"""
OpenAPI 3.0 specification and Swagger UI HTML for the Nyagatare Yield Prediction API.
Kept separate from routes so the spec can be updated without touching application logic.
"""

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
                            'prediction_confidence': 0.694,
                            'advice': [
                                {'code': 'fertiliser_full', 'params': {}},
                                {'code': 'yield_above_avg', 'params': {}},
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
