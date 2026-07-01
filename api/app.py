"""
Nyagatare Yield Prediction API — Flask application entry point.

Routes only. Prediction logic lives in prediction.py; OpenAPI spec in spec.py;
SQLAlchemy models in models.py; JWT helpers in auth.py.
"""

import os
import re
import json
import joblib
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

from .models import db, User, Prediction
from .auth import create_token, get_current_user, token_required
from .prediction import build_feature_row, compute_confidence, generate_advice
from .spec import OPENAPI_SPEC, SWAGGER_UI_HTML

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(BASE_DIR, 'models')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'yieldwise.db')}")
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

MAX_HISTORY = 10
PHONE_RE    = re.compile(r'^\+?\d{8,15}$')

# ── Load models once at startup ───────────────────────────────────────────────
bean_model = joblib.load(os.path.join(MODELS_DIR, 'bean_model.pkl'))
rice_model = joblib.load(os.path.join(MODELS_DIR, 'rice_model.pkl'))

with open(os.path.join(MODELS_DIR, 'model_meta.json')) as f:
    MODEL_META = json.load(f)

# ── Routes — static / docs ────────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/apidocs')
def apidocs():
    return SWAGGER_UI_HTML, 200, {'Content-Type': 'text/html'}


@app.route('/apispec.json')
def apispec():
    return jsonify(OPENAPI_SPEC)


@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'models_loaded': ['bean', 'rice']})


@app.route('/model-info')
def model_info():
    return jsonify(MODEL_META)


# ── Routes — accounts ─────────────────────────────────────────────────────────

@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json(force=True) or {}
    phone         = str(data.get('phone', '')).strip().replace(' ', '')
    name          = str(data.get('name', '')).strip()
    password      = str(data.get('password', ''))
    recovery_word = str(data.get('recovery_word', '')).strip()

    if not PHONE_RE.match(phone):
        return jsonify({'error': 'Enter a valid phone number (8-15 digits)'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if len(recovery_word) < 3:
        return jsonify({'error': 'Recovery word must be at least 3 characters'}), 400
    if User.query.filter_by(phone=phone).first():
        return jsonify({'error': 'An account with this phone number already exists'}), 409

    user = User(
        phone=phone,
        name=name or None,
        password_hash=generate_password_hash(password),
        recovery_hash=generate_password_hash(recovery_word.lower()),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'token': create_token(user.id), 'user': user.to_dict()}), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data     = request.get_json(force=True) or {}
    phone    = str(data.get('phone', '')).strip().replace(' ', '')
    password = str(data.get('password', ''))

    user = User.query.filter_by(phone=phone).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid phone number or password'}), 401
    return jsonify({'token': create_token(user.id), 'user': user.to_dict()})


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data          = request.get_json(force=True) or {}
    phone         = str(data.get('phone', '')).strip().replace(' ', '')
    recovery_word = str(data.get('recovery_word', '')).strip()
    new_password  = str(data.get('new_password', ''))

    if len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user or not check_password_hash(user.recovery_hash, recovery_word.lower()):
        return jsonify({'error': 'Phone number or recovery word is incorrect'}), 401

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'token': create_token(user.id), 'user': user.to_dict()})


@app.route('/auth/me')
def me():
    user = get_current_user()
    if user is None:
        return jsonify({'error': 'Authentication required'}), 401
    return jsonify({'user': user.to_dict()})


# ── Routes — prediction history ───────────────────────────────────────────────

@app.route('/predictions', methods=['GET'])
@token_required
def list_predictions(user):
    preds = (Prediction.query.filter_by(user_id=user.id)
             .order_by(Prediction.created_at.desc())
             .limit(MAX_HISTORY).all())
    return jsonify({'history': [p.to_dict() for p in preds]})


@app.route('/predictions', methods=['DELETE'])
@token_required
def clear_predictions(user):
    Prediction.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({'status': 'ok'})


# ── Routes — prediction ───────────────────────────────────────────────────────

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True)
    if not data:
        return jsonify({'error': 'No JSON body received'}), 400

    crop = str(data.get('crop', '')).lower()
    if crop not in ('bean', 'rice'):
        return jsonify({'error': "Field 'crop' must be 'bean' or 'rice'"}), 400

    model = bean_model if crop == 'bean' else rice_model
    meta  = MODEL_META[crop]

    try:
        X = build_feature_row(crop, data, MODEL_META)
    except Exception as e:
        return jsonify({'error': f'Feature construction failed: {str(e)}'}), 400

    prediction = float(model.predict(X)[0])
    rmse       = meta['cv_rmse']
    confidence = compute_confidence(crop, data, meta['cv_r2'])

    result = {
        'crop':                  crop,
        'predicted_yield_t_ha':  round(prediction, 3),
        'low_estimate_t_ha':     round(max(0.0, prediction - rmse), 3),
        'high_estimate_t_ha':    round(prediction + rmse, 3),
        'model_r2':              meta['cv_r2'],
        'model_rmse':            rmse,
        'prediction_confidence': confidence,
        'advice':                generate_advice(crop, data, prediction, confidence),
        'inputs_received':       data,
    }

    user = get_current_user()
    if user is not None:
        db.session.add(Prediction(user_id=user.id, crop=crop, result=result))
        db.session.commit()
        stale = (Prediction.query.filter_by(user_id=user.id)
                 .order_by(Prediction.created_at.desc())
                 .offset(MAX_HISTORY).all())
        for p in stale:
            db.session.delete(p)
        if stale:
            db.session.commit()

    return jsonify(result)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
