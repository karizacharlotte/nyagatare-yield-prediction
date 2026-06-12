"""
Nyagatare Yield Prediction API
Flask application serving RF/GB model predictions for bean and rice crops.
Swagger UI available at /apidocs
"""

import os
import re
import json
import secrets
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

from .models import db, User, Prediction
from .auth import create_token, get_current_user, token_required

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR   = os.path.join(BASE_DIR, 'models')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')

# ── Database ──────────────────────────────────────────────────────────────────
# Defaults to a local SQLite file for development. In production, set
# DATABASE_URL to a Postgres connection string (see render.yaml) — Render's
# free web service disk is wiped on every deploy, so SQLite alone won't
# persist farmer accounts.
DATABASE_URL = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'yieldwise.db')}")
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

MAX_HISTORY = 10
PHONE_RE = re.compile(r'^\+?\d{8,15}$')

# ── Load models once at startup ───────────────────────────────────────────────
bean_model = joblib.load(os.path.join(MODELS_DIR, 'bean_model.pkl'))
rice_model = joblib.load(os.path.join(MODELS_DIR, 'rice_model.pkl'))

with open(os.path.join(MODELS_DIR, 'model_meta.json')) as f:
    MODEL_META = json.load(f)

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

# ── Farming advice rules ───────────────────────────────────────────────────────
# Rwanda national average yields (t/ha), used to judge whether a prediction is
# above/below average — kept in sync with frontend NATIONAL_AVG in YieldResult.jsx
NATIONAL_AVG = {'bean': 1.2, 'rice': 5.0}

# Rule-of-thumb agronomic ranges centred on the dataset's typical values
ADVICE_RANGES = {
    'bean': {'rainfall': (250, 500), 'temp': (18, 30), 'growing_days': (75, 110)},
    'rice': {'rainfall': (300, 500), 'temp': (20, 32), 'growing_days': (110, 160)},
}


def generate_advice(crop, data, prediction, r2):
    """Return a list of {code, params} tips describing how the farmer's
    inputs compare to agronomic norms. Codes map to translated message
    templates on the frontend (see LangContext tip_* keys)."""
    tips = []
    rng = ADVICE_RANGES[crop]

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

    if r2 < 0.65:
        tips.append({'code': 'confidence_low', 'params': {}})

    return tips

# ── OpenAPI spec ──────────────────────────────────────────────────────────────
OPENAPI_SPEC = {
    'openapi': '3.0.3',
    'info': {
        'title': 'Nyagatare Yield Prediction API',
        'description': (
            'REST API for predicting bean and rice crop yields in Nyagatare District, Rwanda. '
            'Powered by **Random Forest** (beans, R²=0.494) and **Gradient Boosting** (rice, R²=0.674) '
            'models trained on 216 RAB field trial records. '
            '— Charlotte Kariza'
        ),
        'version': '1.0.0',
    },
    'servers': [{'url': '/', 'description': 'Current server'}],
    'tags': [
        {'name': 'Prediction', 'description': 'Yield prediction endpoint'},
        {'name': 'Info',       'description': 'API health and model metadata'},
        {'name': 'Account',    'description': 'Farmer accounts and saved prediction history'},
    ],
    'components': {
        'securitySchemes': {
            'bearerAuth': {'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT'},
        },
    },
    'paths': {
        '/health': {
            'get': {
                'tags': ['Info'],
                'summary': 'Health check',
                'description': 'Returns 200 OK when the API is running and models are loaded.',
                'responses': {
                    '200': {
                        'description': 'API is healthy',
                        'content': {'application/json': {'example': {
                            'status': 'ok', 'models_loaded': ['bean', 'rice']
                        }}},
                    }
                },
            }
        },
        '/model-info': {
            'get': {
                'tags': ['Info'],
                'summary': 'Model metadata',
                'description': 'Returns cross-validation metrics and feature lists for both trained models.',
                'responses': {
                    '200': {
                        'description': 'Model metadata',
                        'content': {'application/json': {'example': {
                            'bean': {'model_type': 'RF', 'cv_r2': 0.494, 'cv_rmse': 0.316, 'n_train': 96},
                            'rice': {'model_type': 'GB', 'cv_r2': 0.674, 'cv_rmse': 0.848, 'n_train': 120},
                        }}},
                    }
                },
            }
        },
        '/predict': {
            'post': {
                'tags': ['Prediction'],
                'summary': 'Predict crop yield',
                'description': (
                    'Submit farm conditions and receive a predicted yield in **tonnes per hectare** '
                    'with a confidence range (± model RMSE).'
                ),
                'requestBody': {
                    'required': True,
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'required': ['crop'],
                                'properties': {
                                    'crop':               {'type': 'string',  'enum': ['bean', 'rice'], 'description': 'Crop type'},
                                    'has_N':              {'type': 'integer', 'enum': [0, 1], 'description': 'Nitrogen applied (1=yes)'},
                                    'has_P':              {'type': 'integer', 'enum': [0, 1], 'description': 'Phosphorus applied (1=yes)'},
                                    'has_K':              {'type': 'integer', 'enum': [0, 1], 'description': 'Potassium applied (1=yes)'},
                                    'N_boost':            {'type': 'integer', 'minimum': 0, 'maximum': 3, 'description': 'Nitrogen level (0–3)'},
                                    'P_boost':            {'type': 'integer', 'minimum': 0, 'maximum': 3, 'description': 'Phosphorus level (0–3)'},
                                    'K_boost':            {'type': 'integer', 'minimum': 0, 'maximum': 3, 'description': 'Potassium level (0–3)'},
                                    'sector':             {'type': 'string',  'description': 'Bean: Katabagemu | Rukomo. Rice: Nyagatare | Rukomo | Rwempasha | Tabagwe'},
                                    'prev_crop':          {'type': 'string',  'description': 'Bean: Maize | Sorghum | Sweet potato. Rice: Rice'},
                                    'planting_month':     {'type': 'integer', 'minimum': 1, 'maximum': 12, 'description': 'Month of planting (1–12)'},
                                    'growing_days':       {'type': 'integer', 'description': 'Days from planting to harvest'},
                                    'total_rainfall_mm':  {'type': 'number',  'description': 'Total season rainfall (mm)'},
                                    'mean_temp_C':        {'type': 'number',  'description': 'Mean season temperature (°C)'},
                                },
                            },
                            'examples': {
                                'Bean example': {'value': {
                                    'crop': 'bean', 'has_N': 1, 'has_P': 1, 'has_K': 1,
                                    'N_boost': 0, 'P_boost': 0, 'K_boost': 0,
                                    'sector': 'Katabagemu', 'prev_crop': 'Maize',
                                    'planting_month': 9, 'growing_days': 97,
                                    'total_rainfall_mm': 365.0, 'mean_temp_C': 28.1,
                                }},
                                'Rice example': {'value': {
                                    'crop': 'rice', 'has_N': 1, 'has_P': 1, 'has_K': 1,
                                    'N_boost': 0, 'P_boost': 0, 'K_boost': 0,
                                    'sector': 'Nyagatare', 'prev_crop': 'Rice',
                                    'planting_month': 7, 'growing_days': 145,
                                    'total_rainfall_mm': 380.0, 'mean_temp_C': 28.1,
                                }},
                            },
                        }
                    },
                },
                'responses': {
                    '200': {
                        'description': 'Yield prediction with confidence range',
                        'content': {'application/json': {'example': {
                            'crop': 'bean',
                            'predicted_yield_t_ha': 2.62,
                            'low_estimate_t_ha': 2.30,
                            'high_estimate_t_ha': 2.94,
                            'model_r2': 0.494,
                            'model_rmse': 0.316,
                            'advice': [
                                {'code': 'fertiliser_full', 'params': {}},
                                {'code': 'yield_above_avg', 'params': {}},
                                {'code': 'confidence_low', 'params': {}},
                            ],
                            'inputs_received': {'crop': 'bean', 'has_N': 1},
                        }}},
                    },
                    '400': {
                        'description': 'Bad request',
                        'content': {'application/json': {'example': {
                            'error': "Field 'crop' must be 'bean' or 'rice'"
                        }}},
                    },
                },
            }
        },
        '/auth/signup': {
            'post': {
                'tags': ['Account'],
                'summary': 'Create a farmer account',
                'description': 'Register with a phone number, password, and recovery word to save prediction history to your account. The recovery word is used to reset your password if you forget it.',
                'requestBody': {
                    'required': True,
                    'content': {'application/json': {
                        'schema': {
                            'type': 'object',
                            'required': ['phone', 'password', 'recovery_word'],
                            'properties': {
                                'phone':         {'type': 'string', 'description': '8-15 digit phone number'},
                                'name':          {'type': 'string', 'description': 'Optional display name, shown instead of the phone number in the app'},
                                'password':      {'type': 'string', 'format': 'password', 'description': 'At least 6 characters'},
                                'recovery_word': {'type': 'string', 'description': 'At least 3 characters — used to reset your password if forgotten'},
                            },
                        },
                        'example': {'phone': '0788123456', 'name': 'Jean Mukiza', 'password': 'secret123', 'recovery_word': 'sunflower'},
                    }},
                },
                'responses': {
                    '201': {'description': 'Account created', 'content': {'application/json': {'example': {
                        'token': '<jwt>', 'user': {'id': 1, 'phone': '0788123456', 'name': 'Jean Mukiza'}
                    }}}},
                    '400': {'description': 'Invalid phone, password, or recovery word'},
                    '409': {'description': 'Phone number already registered'},
                },
            }
        },
        '/auth/login': {
            'post': {
                'tags': ['Account'],
                'summary': 'Log in to an existing account',
                'requestBody': {
                    'required': True,
                    'content': {'application/json': {
                        'schema': {
                            'type': 'object',
                            'required': ['phone', 'password'],
                            'properties': {
                                'phone':    {'type': 'string'},
                                'password': {'type': 'string', 'format': 'password'},
                            },
                        },
                        'example': {'phone': '0788123456', 'password': 'secret123'},
                    }},
                },
                'responses': {
                    '200': {'description': 'Login successful', 'content': {'application/json': {'example': {
                        'token': '<jwt>', 'user': {'id': 1, 'phone': '0788123456', 'name': 'Jean Mukiza'}
                    }}}},
                    '401': {'description': 'Invalid phone number or password'},
                },
            }
        },
        '/auth/reset-password': {
            'post': {
                'tags': ['Account'],
                'summary': 'Reset a forgotten password using the recovery word',
                'description': 'Verify the account phone number and recovery word set at signup, then set a new password. Returns a fresh login token.',
                'requestBody': {
                    'required': True,
                    'content': {'application/json': {
                        'schema': {
                            'type': 'object',
                            'required': ['phone', 'recovery_word', 'new_password'],
                            'properties': {
                                'phone':         {'type': 'string'},
                                'recovery_word': {'type': 'string'},
                                'new_password':  {'type': 'string', 'format': 'password', 'description': 'At least 6 characters'},
                            },
                        },
                        'example': {'phone': '0788123456', 'recovery_word': 'sunflower', 'new_password': 'newsecret123'},
                    }},
                },
                'responses': {
                    '200': {'description': 'Password reset', 'content': {'application/json': {'example': {
                        'token': '<jwt>', 'user': {'id': 1, 'phone': '0788123456', 'name': 'Jean Mukiza'}
                    }}}},
                    '400': {'description': 'New password too short'},
                    '401': {'description': 'Phone number or recovery word is incorrect'},
                },
            }
        },
        '/auth/me': {
            'get': {
                'tags': ['Account'],
                'summary': 'Get the signed-in user',
                'security': [{'bearerAuth': []}],
                'responses': {
                    '200': {'description': 'Current user', 'content': {'application/json': {'example': {
                        'user': {'id': 1, 'phone': '0788123456', 'name': 'Jean Mukiza'}
                    }}}},
                    '401': {'description': 'Authentication required'},
                },
            }
        },
        '/predictions': {
            'get': {
                'tags': ['Account'],
                'summary': "Get the signed-in farmer's saved predictions",
                'security': [{'bearerAuth': []}],
                'responses': {
                    '200': {'description': 'Prediction history, most recent first (max 10)', 'content': {'application/json': {'example': {
                        'history': [
                            {'id': 12, 'crop': 'rice', 'data': {'predicted_yield_t_ha': 6.18}, 'saved_at': '2026-06-12T05:25:15+00:00'}
                        ]
                    }}}},
                    '401': {'description': 'Authentication required'},
                },
            },
            'delete': {
                'tags': ['Account'],
                'summary': "Clear the signed-in farmer's saved predictions",
                'security': [{'bearerAuth': []}],
                'responses': {
                    '200': {'description': 'History cleared', 'content': {'application/json': {'example': {'status': 'ok'}}}},
                    '401': {'description': 'Authentication required'},
                },
            },
        },
    },
}

SWAGGER_UI_HTML = '''<!DOCTYPE html>
<html>
<head>
  <title>Nyagatare Yield API — Swagger UI</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; }
    .topbar { background-color: #166534 !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::before {
      content: "🌿 Nyagatare Yield Prediction API";
      color: white; font-size: 1.1rem; font-weight: 700; padding-left: 1rem;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/apispec.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    });
  </script>
</body>
</html>'''


def encode_category(value, mapping, default=0):
    return mapping.get(str(value).strip().lower(), default)


def build_feature_row(crop, data):
    meta     = MODEL_META[crop]
    features = meta['features']
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


# ── Routes ────────────────────────────────────────────────────────────────────

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


# ── Accounts ──────────────────────────────────────────────────────────────────
# Farmers can optionally create an account (phone number + password) so their
# prediction history is saved to the server and follows them across devices,
# instead of staying only in this browser's local storage.

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
    data = request.get_json(force=True) or {}
    phone    = str(data.get('phone', '')).strip().replace(' ', '')
    password = str(data.get('password', ''))

    user = User.query.filter_by(phone=phone).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid phone number or password'}), 401

    return jsonify({'token': create_token(user.id), 'user': user.to_dict()})


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(force=True) or {}
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


# ── Temporary: one-off reset of all accounts/history ────────────────────────
# TODO: remove this endpoint after use.
ADMIN_WIPE_SECRET = 'Z8U7cclRHJ0u2-EjtCgCmvQenpUBkGpAMgfTpwMH39Q'

@app.route('/admin/wipe', methods=['POST'])
def admin_wipe():
    secret = request.headers.get('X-Admin-Secret', '')
    if not secrets.compare_digest(secret, ADMIN_WIPE_SECRET):
        return jsonify({'error': 'Forbidden'}), 403
    pred_count = Prediction.query.delete()
    user_count = User.query.delete()
    db.session.commit()
    return jsonify({'deleted_predictions': pred_count, 'deleted_users': user_count})


# ── Prediction history ───────────────────────────────────────────────────────

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
        X = build_feature_row(crop, data)
    except Exception as e:
        return jsonify({'error': f'Feature construction failed: {str(e)}'}), 400

    prediction = float(model.predict(X)[0])
    rmse       = meta['cv_rmse']

    result = {
        'crop':                 crop,
        'predicted_yield_t_ha': round(prediction, 3),
        'low_estimate_t_ha':    round(max(0.0, prediction - rmse), 3),
        'high_estimate_t_ha':   round(prediction + rmse, 3),
        'model_r2':             meta['cv_r2'],
        'model_rmse':           rmse,
        'advice':               generate_advice(crop, data, prediction, meta['cv_r2']),
        'inputs_received':      data,
    }

    # Signed-in farmers get their prediction saved to their account,
    # capped at MAX_HISTORY most recent entries.
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
