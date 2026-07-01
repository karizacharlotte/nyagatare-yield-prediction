"""
Prediction logic: feature encoding, confidence scoring, and advice generation.
Kept separate from routes so each concern can be read and tested independently.
"""

import pandas as pd

# ── Label encodings ───────────────────────────────────────────────────────────
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

# Rwanda national average yields (t/ha) — kept in sync with frontend NATIONAL_AVG
NATIONAL_AVG = {'bean': 1.2, 'rice': 5.0}

# Agronomic ranges centred on the dataset's typical values
ADVICE_RANGES = {
    'bean': {'rainfall': (250, 500), 'temp': (18, 30), 'growing_days': (75, 110)},
    'rice': {'rainfall': (300, 500), 'temp': (20, 32), 'growing_days': (110, 160)},
}


def encode_category(value, mapping, default=0):
    return mapping.get(str(value).strip().lower(), default)


def build_feature_row(crop, data, model_meta):
    features = model_meta[crop]['features']
    enc      = ENCODINGS[crop]

    row = {
        'has_N':             int(data.get('has_N', 0)),
        'has_P':             int(data.get('has_P', 0)),
        'has_K':             int(data.get('has_K', 0)),
        'N_boost':           int(data.get('N_boost', 0)),
        'P_boost':           int(data.get('P_boost', 0)),
        'K_boost':           int(data.get('K_boost', 0)),
        'slope_encoded':     int(data.get('slope_encoded', 0)),
        'variety_encoded':   int(data.get('variety_encoded', 0)),
        'sector_encoded':    encode_category(data.get('sector', ''), enc['sector']),
        'prev_crop_encoded': encode_category(data.get('prev_crop', ''), enc['prev_crop']),
        'planting_month':    float(data.get('planting_month', 9)),
        'growing_days':      float(data.get('growing_days', 97)),
        'total_rainfall_mm': float(data.get('total_rainfall_mm', 250)),
        'mean_temp_C':       float(data.get('mean_temp_C', 27.5)),
    }

    return pd.DataFrame([{k: row[k] for k in features if k in row}])


def compute_confidence(crop, data, r2):
    """Adjust model R² up or down based on how typical the farmer's inputs are.

    Inputs within the agronomic ranges seen during training raise confidence;
    values outside those ranges represent extrapolation, so confidence drops.
    """
    rng   = ADVICE_RANGES[crop]
    score = 0

    rainfall = float(data.get('total_rainfall_mm', 0))
    rmin, rmax = rng['rainfall']
    score += 1 if rmin <= rainfall <= rmax else -1

    temp = float(data.get('mean_temp_C', 0))
    tmin, tmax = rng['temp']
    score += 1 if tmin <= temp <= tmax else -1

    days = float(data.get('growing_days', 0))
    dmin, dmax = rng['growing_days']
    score += 1 if dmin <= days <= dmax else -1

    fert_count = sum(int(data.get(f'has_{n}', 0)) for n in ('N', 'P', 'K'))
    score += (fert_count - 1.5) / 1.5

    return round(max(0.0, min(1.0, r2 + (score / 4) * 0.2)), 3)


def generate_advice(crop, data, prediction, confidence):
    """Return a list of {code, params} tips describing how the farmer's inputs
    compare to agronomic norms. Codes map to translated message templates on
    the frontend (see LangContext tip_* keys).
    """
    tips = []
    rng  = ADVICE_RANGES[crop]

    has_N = int(data.get('has_N', 0))
    has_P = int(data.get('has_P', 0))
    has_K = int(data.get('has_K', 0))
    missing = [n for n, has in (('N', has_N), ('P', has_P), ('K', has_K)) if not has]
    if missing:
        tips.append({'code': 'fertiliser_missing', 'params': {'nutrients': missing}})
    else:
        tips.append({'code': 'fertiliser_full', 'params': {}})

    rainfall = float(data.get('total_rainfall_mm', 0))
    rmin, rmax = rng['rainfall']
    if rainfall < rmin:
        tips.append({'code': 'rainfall_low', 'params': {'value': round(rainfall)}})
    elif rainfall > rmax:
        tips.append({'code': 'rainfall_high', 'params': {'value': round(rainfall)}})

    temp = float(data.get('mean_temp_C', 0))
    tmin, tmax = rng['temp']
    if temp > tmax:
        tips.append({'code': 'temp_high', 'params': {'value': round(temp, 1)}})
    elif temp < tmin:
        tips.append({'code': 'temp_low', 'params': {'value': round(temp, 1)}})

    days = float(data.get('growing_days', 0))
    dmin, dmax = rng['growing_days']
    if days < dmin:
        tips.append({'code': 'season_short', 'params': {'value': round(days)}})
    elif days > dmax:
        tips.append({'code': 'season_long', 'params': {'value': round(days)}})

    avg = NATIONAL_AVG[crop]
    if prediction >= avg * 1.15:
        tips.append({'code': 'yield_above_avg', 'params': {}})
    elif prediction < avg * 0.85:
        tips.append({'code': 'yield_below_avg', 'params': {}})

    if confidence < 0.65:
        tips.append({'code': 'confidence_low', 'params': {}})

    return tips
