# YieldWise — Nyagatare Crop Yield Prediction

Machine learning web app that predicts **bean and rice** yields (t/ha) for farmers in Nyagatare District, Rwanda, from fertiliser use, location, planting timing, and seasonal climate — and returns plain-language farming advice in **English and Kinyarwanda**.

- **GitHub repo:** https://github.com/karizacharlotte/nyagatare-yield-prediction
- **Live app & API:** https://nyagatare-yield-api.onrender.com
- **Demo Video** https://drive.google.com/file/d/1M6h_kg5z2hKAbfzsm3axgG_KvsSvDp0w/view?usp=sharing
- **API docs (Swagger UI):** https://nyagatare-yield-api.onrender.com/apidocs

## App screenshots

**Home**

![YieldWise home page](notebooks/images/webapp_hero.jpg)

**Prediction form**

![Yield prediction form](notebooks/images/webapp_predict.jpg)

**Prediction result**

![Yield prediction result with confidence badge](notebooks/images/webapp_result.jpg)

**About / model performance**

![About page with model performance](notebooks/images/webapp_about.jpg)

**API documentation (Swagger UI)**

![Swagger UI API documentation](notebooks/images/webapp_swagger.png)

---

## What it does

A farmer enters their farm conditions — fertiliser applied (N/P/K), sector, previous crop, planting month, growing days, total rainfall, and mean temperature — and gets back:

- A **predicted yield** (t/ha) with a confidence range (± model RMSE)
- A **prediction confidence score** — the model's overall R² adjusted up or down depending on how typical the farmer's rainfall, temperature, growing season, and fertiliser use are compared to the training data
- A comparison against the **national average yield**
- **Rule-based recommendations** (e.g. fertiliser gaps, rainfall/temperature out of ideal range, season length, low prediction confidence)

The whole interface is bilingual (English ↔ Kinyarwanda), supports light/dark mode, and works offline as an installable PWA.

To see a prediction result, a farmer signs in or **creates a free account** (phone number + password). This keeps their prediction history private, synced across devices, and viewable offline — only the farmer who made a prediction can see it.

---

## Tech stack

| Layer | Tools |
|---|---|
| **Data & ML** | Python, pandas, scikit-learn (Random Forest, Gradient Boosting), joblib |
| **API** | Flask, Flask-SQLAlchemy, PyJWT, Flasgger-style Swagger UI, Gunicorn |
| **Database** | PostgreSQL in production (SQLite for local dev) — stores farmer accounts & prediction history |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, lucide-react |
| **Notebooks** | Jupyter (data preprocessing, EDA, model training & evaluation) |
| **Deployment** | Render (Blueprint via `render.yaml`) |

---

## Model architecture & performance

Trained on **216 RAB field trial records** from Nyagatare District (5-fold cross-validation):

| Crop | Model | R² | RMSE | MAE | Training rows |
|---|---|---|---|---|---|
| Beans | Random Forest | 0.494 | 0.316 | 0.262 | 96 |
| Rice | Gradient Boosting | 0.674 | 0.848 | 0.629 | 120 |

Full data visualisation, feature engineering, model architecture, hyperparameter search, and performance evaluation are in the notebooks:

- [`notebooks/01_data_preprocessing.ipynb`](notebooks/01_data_preprocessing.ipynb) — data cleaning, EDA, feature engineering
- [`notebooks/02_model_training.ipynb`](notebooks/02_model_training.ipynb) — model training, cross-validation, evaluation plots, deployment overview

---

## Project structure (code files)

```
nyagatare_yield_project/
├── api/                  # Flask REST API (serves predictions + built frontend)
│   ├── app.py
│   ├── models.py          # SQLAlchemy models (User, Prediction)
│   └── auth.py            # JWT + password helpers
├── frontend/             # React + Vite + Tailwind web app
│   └── src/
├── models/               # Trained models + evaluation plots
│   ├── bean_model.pkl
│   ├── rice_model.pkl
│   └── model_meta.json
├── data/
│   ├── raw/              # Original RAB field trial dataset
│   └── processed/        # Cleaned bean/rice/climate datasets
├── notebooks/
│   ├── 01_data_preprocessing.ipynb
│   └── 02_model_training.ipynb
├── requirements.txt
└── render.yaml           # Render deployment config
```

---

## Setup instructions (running locally)

### Backend (Flask API)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python -m api.app
```

This starts the API on `http://localhost:5000`, with Swagger UI at `/apidocs` and a health check at `/health`. It also serves the built React app from `frontend/dist/`.

By default it stores accounts and prediction history in a local SQLite file (`yieldwise.db`, gitignored). To test against PostgreSQL instead, set a `DATABASE_URL` env var (e.g. `postgresql://user:pass@host/dbname`) before starting the API. You can also set `JWT_SECRET` to override the dev default used to sign login tokens.

### Frontend (development mode)

```bash
cd frontend
npm install
npm run dev
```

To build the frontend for production (output goes to `frontend/dist/`, served by Flask):

```bash
npm run build
```

---

## API quick reference

| Endpoint | Method | Description |
|---|---|---|
| `/predict` | POST | Submit farm conditions, get a yield prediction + advice (saved to history if signed in) |
| `/model-info` | GET | Cross-validation metrics & feature lists for both models |
| `/health` | GET | Health check |
| `/apidocs` | GET | Interactive Swagger UI |
| `/auth/signup` | POST | Create a farmer account (`phone`, `password`, `recovery_word`, optional `name`) → returns a JWT |
| `/auth/login` | POST | Log in with `phone` + `password` → returns a JWT |
| `/auth/reset-password` | POST | Reset a forgotten password using `phone` + `recovery_word` → returns a JWT |
| `/auth/me` | GET | Get the current user for a valid `Bearer` token |
| `/predictions` | GET | List the signed-in farmer's saved predictions (most recent first) |
| `/predictions` | DELETE | Clear the signed-in farmer's saved prediction history |

Signing in (or creating a free account) is required to see a prediction result — this is what lets results sync across devices and stay available offline. Auth endpoints and `/predictions` are documented in detail in the Swagger UI (`/apidocs`), including request/response examples and the `bearerAuth` security scheme. See the "Testing" section below for a sample `/predict` request and response.

---

## Deployment plan

The app is deployed as a Render **Blueprint**, defined in [`render.yaml`](render.yaml):

- **Web service:** `pip install -r requirements.txt` (also builds and bundles the React frontend into `frontend/dist/`, which Flask serves at `/`), run via `gunicorn api.app:app --bind 0.0.0.0:$PORT --workers 2`, free tier on Python 3.11, auto-deploys on every push to `main` on GitHub.
- **Database:** a free PostgreSQL instance (`nyagatare-yield-db`), with its connection string injected into the web service as `DATABASE_URL` and a random `JWT_SECRET` generated automatically — both wired up via the Blueprint, no manual config needed.

Flask serves both the REST API (`/predict`, `/auth/*`, `/predictions`, `/model-info`, `/health`, `/apidocs`) and the built frontend (`/`) from one service, so the whole app runs from a single URL.

> Note: Render's free PostgreSQL plan expires after 30 days. For a long-lived demo, either upgrade the database plan or recreate it before it expires — accounts and prediction history are stored there, so the app falls back to read-only/guest behaviour if the database becomes unreachable.

---

## Testing

### Strategy 1 — API endpoint testing (curl / Swagger UI)

All responses below were captured from the local server (`python -m api.app`) running on Python 3.13 + SQLite. The same results are reproducible against the live Render deployment.

**Health check**
```
GET /health → 200
{"models_loaded": ["bean", "rice"], "status": "ok"}
```

**Bean — full NPK, optimal conditions**
```
POST /predict
{"crop":"bean","has_N":1,"has_P":1,"has_K":1,"sector":"Katabagemu",
 "prev_crop":"Maize","planting_month":9,"growing_days":97,
 "total_rainfall_mm":365,"mean_temp_C":28.1}

→ 200
{
  "crop": "bean",
  "predicted_yield_t_ha": 2.641,
  "low_estimate_t_ha": 2.325,
  "high_estimate_t_ha": 2.957,
  "model_r2": 0.494,
  "model_rmse": 0.316,
  "prediction_confidence": 0.694,
  "advice": [
    {"code": "fertiliser_full", "params": {}},
    {"code": "yield_above_avg", "params": {}}
  ]
}
```

**Rice — full NPK, optimal conditions**
```
POST /predict
{"crop":"rice","has_N":1,"has_P":1,"has_K":1,"sector":"Nyagatare",
 "prev_crop":"Rice","planting_month":7,"growing_days":145,
 "total_rainfall_mm":380,"mean_temp_C":28.1}

→ 200
{
  "crop": "rice",
  "predicted_yield_t_ha": 6.184,
  "low_estimate_t_ha": 5.336,
  "high_estimate_t_ha": 7.032,
  "model_r2": 0.674,
  "model_rmse": 0.848,
  "prediction_confidence": 0.874,
  "advice": [
    {"code": "fertiliser_full", "params": {}},
    {"code": "yield_above_avg", "params": {}}
  ]
}
```

**Invalid crop — error handling**
```
POST /predict  {"crop":"wheat"}
→ 400  {"error": "Field 'crop' must be 'bean' or 'rice'"}

POST /predict  {}
→ 400  {"error": "No JSON body received"}
```

### Strategy 2 — Input variation testing

Tested through the web UI and confirmed against direct API calls. Each row shows a different combination of conditions and the advice codes that fired:

| Crop | Fertiliser | Rainfall (mm) | Temp (°C) | Days | Actual advice codes |
|------|-----------|---------------|-----------|------|---------------------|
| Bean | Full NPK | 365 | 28.1 | 97 | `fertiliser_full`, `yield_above_avg` |
| Bean | No NPK | 200 (low) | 28.1 | 97 | `fertiliser_missing [N,P,K]`, `rainfall_low`, `confidence_low` |
| Bean | N only | 365 | 28.1 | 60 (short) | `fertiliser_missing [P,K]`, `season_short`, `confidence_low` |
| Rice | Full NPK | 650 (high) | 36 (hot) | 145 | `fertiliser_full`, `rainfall_high`, `temp_high`, `yield_above_avg` |
| Rice | Full NPK | 380 | 28.1 | 180 (long) | `fertiliser_full`, `season_long` |

**Captured response — bean, no NPK, low rainfall (confidence drops to 0.494, `confidence_low` fires):**
```json
{
  "crop": "bean",
  "predicted_yield_t_ha": 1.398,
  "prediction_confidence": 0.494,
  "advice": [
    {"code": "fertiliser_missing", "params": {"nutrients": ["N","P","K"]}},
    {"code": "rainfall_low", "params": {"value": 200}},
    {"code": "yield_above_avg", "params": {}},
    {"code": "confidence_low", "params": {}}
  ]
}
```

**Captured response — rice, extreme rainfall + temperature:**
```json
{
  "crop": "rice",
  "predicted_yield_t_ha": 6.135,
  "prediction_confidence": 0.674,
  "advice": [
    {"code": "fertiliser_full", "params": {}},
    {"code": "rainfall_high", "params": {"value": 650}},
    {"code": "temp_high", "params": {"value": 36.0}},
    {"code": "yield_above_avg", "params": {}}
  ]
}
```

### Strategy 3 — Edge case / boundary testing

- **Zero rainfall** (`total_rainfall_mm: 0`): prediction completes, `rainfall_low` advice fired, confidence drops below 0.65 → `confidence_low` also triggered.
- **Missing optional fields** (sector, prev_crop omitted): API defaults to encoded value 0 and returns a valid prediction without crashing.
- **Wrong phone format on signup** (`phone: "abc"`): returns `400 {"error":"Enter a valid phone number (8–15 digits)"}`.
- **Duplicate phone on signup**: returns `409 {"error":"An account with this phone number already exists"}`.
- **Wrong password on login**: returns `401 {"error":"Invalid phone number or password"}`.
- **Invalid / expired JWT on `/predictions`**: returns `401 {"error":"Authentication required"}`.

### Strategy 4 — Functional UI testing

Tested manually through the React frontend across Chrome (desktop) and Chrome for Android:

- Language toggle (English ↔ Kinyarwanda) — all UI text, advice messages, and error messages switch correctly.
- Dark / light mode toggle — persists across page reloads via localStorage.
- Prediction form → result → history round-trip: submit a prediction while signed in, navigate to prediction history, confirm entry appears with correct crop, yield, and timestamp.
- PWA install prompt (Chrome Android): app installs and launches offline with the last-loaded prediction visible.
- Unauthenticated prediction: form submits, result displays, but history does not appear (guest mode).

### Strategy 5 — Cross-environment testing

| Environment | Result |
|---|---|
| Local dev — Python 3.13 + SQLite (Ubuntu 24.04, 8 GB RAM) | All endpoints respond; predictions saved to local `yieldwise.db` |
| Render free tier — Python 3.11 + PostgreSQL (cloud) | Full deployment verified; auto-deploys on push to `main` |
| Chrome 124 — desktop (1920×1080) | Full UI, dark/light mode, PWA install prompt |
| Chrome 124 — Android (Samsung Galaxy, 1080p) | Full UI, responsive layout, PWA installed and tested offline |
| Firefox 125 — desktop | Full UI; service worker registered; PWA install not prompted (expected) |

---

## Analysis

### Objectives vs results

The capstone proposal targeted a web tool that predicts bean and rice yields for Nyagatare farmers and returns actionable advice. All core objectives were met:

| Objective | Status |
|---|---|
| Predict bean yield from farm inputs | Achieved — Random Forest, R²=0.494, RMSE=0.316 t/ha |
| Predict rice yield from farm inputs | Achieved — Gradient Boosting, R²=0.674, RMSE=0.848 t/ha |
| Return bilingual farming advice | Achieved — English and Kinyarwanda |
| Farmer authentication and prediction history | Achieved — JWT auth, PostgreSQL-backed history |
| Deployed, publicly accessible app | Achieved — live at nyagatare-yield-api.onrender.com |

### Model performance discussion

The rice Gradient Boosting model (R²=0.674) explains significantly more variance than the bean Random Forest (R²=0.494). This is consistent with the training data: rice trials (120 records) had more systematic variation tied to fertiliser treatment and season, giving the model clearer signal. Bean yield variance is harder to explain — the dataset's 96 bean records span fewer sector/season combinations, and soil quality differences between plots are not captured in the features.

The RMSE for rice (0.848 t/ha) is higher in absolute terms than for beans (0.316 t/ha) because rice yields themselves range much more widely (≈3–10 t/ha vs ≈0.5–3 t/ha). The confidence score system accounts for this — it signals to farmers when their inputs fall outside the range the model was trained on, so they know the prediction is extrapolation.

Feature importance analysis (from `models/feature_importance.png`) confirmed that fertiliser use (N, P, K) and growing season length are the strongest predictors for both crops, followed by rainfall and temperature. Sector (location) matters less, reflecting that the field trial plots are all within Nyagatare District and share broadly similar soil conditions.

### What could be improved

A dataset of 216 records is sufficient for a proof of concept but limits model generalisation. Expanding to data from multiple districts, more seasons, and more detailed soil measurements would meaningfully improve both R² values. A survey-based data collection pipeline integrated into the app itself would be a natural next step.

---

## Discussion

The milestones of data cleaning, model training, API development, and frontend deployment were completed in sequence, with each stage building directly on the last. The bilingual interface was the most impactful UX decision: early feedback from peers indicated that Kinyarwanda-speaking users were more willing to try the app when advice appeared in their first language.

The confidence score feature — added after initial model training — turned out to be one of the most useful outputs. Without it, a farmer entering extreme rainfall or temperature values would receive a prediction number with no signal about how reliable it was. The score surfaces the model's uncertainty in plain terms, which is especially important when the model is extrapolating beyond the training distribution.

The prediction history feature (saving each result to the farmer's account and showing it offline via the PWA service worker) makes the tool usable in low-connectivity areas — a realistic constraint for farmers in Nyagatare District who may only have occasional internet access.

---

## Recommendations

**For farmers:** Use the confidence score as a guide. A score below 65% means your conditions differ significantly from the trials the model was trained on — treat the prediction as a rough estimate and consult an agronomist before making major input decisions.

**For RAB and extension services:** The app's advice engine is rule-based and easy to update. As better agronomic thresholds are established for Nyagatare's specific sectors, these can be adjusted in the API without retraining the model.

**Future work:**
- Collect data from additional seasons and districts to expand model coverage.
- Add a soil pH / type input field — currently the biggest missing predictor.
- Build an SMS interface (e.g. via Africa's Talking) for farmers without smartphones.
- Add a crop calendar view that integrates planting-month guidance with seasonal rainfall forecasts from Meteo Rwanda.
- Explore LSTM or Prophet models for season-level yield forecasting using time-series climate data.

---

## Data source

Field trial data from **RAB (Rwanda Agriculture and Animal Resources Development Board)**, Nyagatare District — bean and rice trials across multiple sectors, seasons, and NPK fertiliser treatments, matched with seasonal climate data from Meteo Rwanda.

---

## Author

**Charlotte Kariza**
c.kariza@alustudent.com
