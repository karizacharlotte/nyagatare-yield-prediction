"""
Nyagatare Yield Prediction API
Flask application serving RF/GB model predictions for bean and rice crops.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, render_template

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

app = Flask(__name__, template_folder='templates', static_folder='static')

# ── Load models once at startup ──────────────────────────────────────────────
bean_model = joblib.load(os.path.join(MODELS_DIR, 'bean_model.pkl'))
rice_model = joblib.load(os.path.join(MODELS_DIR, 'rice_model.pkl'))

with open(os.path.join(MODELS_DIR, 'model_meta.json')) as f:
    MODEL_META = json.load(f)

# ── Label encodings (from preprocessing LabelEncoder, alphabetical order) ────
ENCODINGS = {
    'bean': {
        'sector':    {'katabagemu': 0, 'rukomo': 1},
        'prev_crop': {'maize': 0, 'sorghum': 1, 'sweet potato': 2},
    },
    'rice': {
        'sector':    {'nyagatare': 0, 'rukomo': 1, 'rwempasha': 1, 'tabagwe': 1},
        'prev_crop': {'rice': 0},
    },
}

NPK_BOOST_LEVELS = {
    'none':   0,
    'low':    1,   # ≤ 10 kg/ha additional
    'medium': 2,   # 11–30 kg/ha
    'high':   3,   # > 30 kg/ha
}


def encode_category(value, mapping, default=0):
    """Case-insensitive lookup into a label-encoding map."""
    return mapping.get(str(value).strip().lower(), default)


def build_feature_row(crop, data):
    """
    Convert API request data dict → a pandas DataFrame row
    matching the feature columns the model was trained on.
    """
    meta     = MODEL_META[crop]
    features = meta['features']
    enc      = ENCODINGS[crop]

    row = {
        'has_N':            int(data.get('has_N', 0)),
        'has_P':            int(data.get('has_P', 0)),
        'has_K':            int(data.get('has_K', 0)),
        'N_boost':          int(data.get('N_boost', 0)),
        'P_boost':          int(data.get('P_boost', 0)),
        'K_boost':          int(data.get('K_boost', 0)),
        'slope_encoded':    int(data.get('slope_encoded', 0)),
        'variety_encoded':  int(data.get('variety_encoded', 0)),
        'sector_encoded':   encode_category(data.get('sector', ''), enc['sector']),
        'prev_crop_encoded': encode_category(data.get('prev_crop', ''), enc['prev_crop']),
        'planting_month':   float(data.get('planting_month', 9)),
        'growing_days':     float(data.get('growing_days', 97)),
        'total_rainfall_mm': float(data.get('total_rainfall_mm', 250)),
        'mean_temp_C':      float(data.get('mean_temp_C', 27.5)),
    }

    # Keep only the columns this model was trained on, in the right order
    return pd.DataFrame([{k: row[k] for k in features if k in row}])


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html', model_meta=MODEL_META)


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'models_loaded': ['bean', 'rice']})


@app.route('/model-info')
def model_info():
    return jsonify(MODEL_META)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict crop yield.

    Request body (JSON):
    {
        "crop":             "bean" | "rice",
        "has_N":            0 | 1,
        "has_P":            0 | 1,
        "has_K":            0 | 1,
        "N_boost":          0–3,
        "P_boost":          0–3,
        "K_boost":          0–3,
        "sector":           "Katabagemu" | "Rukomo" | "Nyagatare" | ...,
        "prev_crop":        "Maize" | "Sorghum" | "Sweet potato" | "Rice",
        "planting_month":   1–12,
        "growing_days":     integer,
        "total_rainfall_mm": float,
        "mean_temp_C":      float
    }

    Response (JSON):
    {
        "crop":                  "bean",
        "predicted_yield_t_ha":  2.62,
        "low_estimate_t_ha":     2.30,
        "high_estimate_t_ha":    2.94,
        "model_r2":              0.494,
        "model_rmse":            0.316,
        "inputs_received":       {...}
    }
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({'error': 'No JSON body received'}), 400

    crop = str(data.get('crop', '')).lower()
    if crop not in ('bean', 'rice'):
        return jsonify({'error': "Field 'crop' must be 'bean' or 'rice'"}), 400

    model = bean_model if crop == 'bean' else rice_model
    meta  = MODEL_META[crop]

    try:
        X = build_feature_row(crop, data)
    except Exception as e:
        return jsonify({'error': f'Feature construction failed: {str(e)}'}), 400

    prediction = float(model.predict(X)[0])
    rmse       = meta['cv_rmse']

    return jsonify({
        'crop':                 crop,
        'predicted_yield_t_ha': round(prediction, 3),
        'low_estimate_t_ha':    round(max(0.0, prediction - rmse), 3),
        'high_estimate_t_ha':   round(prediction + rmse, 3),
        'model_r2':             meta['cv_r2'],
        'model_rmse':           rmse,
        'inputs_received':      data,
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
