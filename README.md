# YieldWise — Nyagatare Crop Yield Prediction

Machine learning web app that predicts **bean and rice** yields (t/ha) for farmers in Nyagatare District, Rwanda, from fertiliser use, location, planting timing, and seasonal climate — and returns plain-language farming advice in **English and Kinyarwanda**.

- **GitHub repo:** https://github.com/karizacharlotte/nyagatare-yield-prediction
- **Live app & API:** https://nyagatare-yield-prediction.onrender.com
- **API docs (Swagger UI):** https://nyagatare-yield-prediction.onrender.com/apidocs

> Note: the live service is on Render's free tier and may take 30–60s to wake up after inactivity.

---

## App screenshots

**Home**

![YieldWise home page](notebooks/images/webapp_hero.jpg)

**Prediction form**

![Yield prediction form](notebooks/images/webapp_predict.jpg)

**About / model performance**

![About page with model performance](notebooks/images/webapp_about.jpg)

**API documentation (Swagger UI)**

![Swagger UI API documentation](notebooks/images/webapp_swagger.png)

---

## Video demo

[Add demo video link here]

---

## What it does

A farmer enters their farm conditions — fertiliser applied (N/P/K), sector, previous crop, planting month, growing days, total rainfall, and mean temperature — and gets back:

- A **predicted yield** (t/ha) with a confidence range (± model RMSE)
- A comparison against the **national average yield**
- **Rule-based recommendations** (e.g. fertiliser gaps, rainfall/temperature out of ideal range, season length)

The whole interface is bilingual (English ↔ Kinyarwanda), supports light/dark mode, and works offline as an installable PWA.

A farmer can optionally **create an account** (phone number + password) to keep a private prediction history that syncs across devices — predictions made while signed out stay only in that browser's local storage and are never visible to anyone else.

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
| `/auth/signup` | POST | Create a farmer account (`phone`, `password`) → returns a JWT |
| `/auth/login` | POST | Log in with `phone` + `password` → returns a JWT |
| `/auth/me` | GET | Get the current user for a valid `Bearer` token |
| `/predictions` | GET | List the signed-in farmer's saved predictions (most recent first) |
| `/predictions` | DELETE | Clear the signed-in farmer's saved prediction history |
| `/predictions/import` | POST | One-time import of a guest's local history into a new account |

Auth endpoints and `/predictions*` are documented in detail in the Swagger UI (`/apidocs`), including request/response examples and the `bearerAuth` security scheme.

Example request to `/predict`:

```json
{
  "crop": "bean",
  "has_N": 1, "has_P": 1, "has_K": 1,
  "sector": "Katabagemu",
  "prev_crop": "Maize",
  "planting_month": 9,
  "growing_days": 97,
  "total_rainfall_mm": 365.0,
  "mean_temp_C": 28.1
}
```

---

## Deployment plan

The app is deployed as a Render **Blueprint**, defined in [`render.yaml`](render.yaml):

- **Web service:** `pip install -r requirements.txt` (also builds and bundles the React frontend into `frontend/dist/`, which Flask serves at `/`), run via `gunicorn api.app:app --bind 0.0.0.0:$PORT --workers 2`, free tier on Python 3.11, auto-deploys on every push to `main` on GitHub.
- **Database:** a free PostgreSQL instance (`nyagatare-yield-db`), with its connection string injected into the web service as `DATABASE_URL` and a random `JWT_SECRET` generated automatically — both wired up via the Blueprint, no manual config needed.

Flask serves both the REST API (`/predict`, `/auth/*`, `/predictions`, `/model-info`, `/health`, `/apidocs`) and the built frontend (`/`) from one service, so the whole app runs from a single URL.

> Note: Render's free PostgreSQL plan expires after 30 days. For a long-lived demo, either upgrade the database plan or recreate it before it expires — accounts and prediction history are stored there, so the app falls back to read-only/guest behaviour if the database becomes unreachable.

---

## Data source

Field trial data from **RAB (Rwanda Agriculture and Animal Resources Development Board)**, Nyagatare District — bean and rice trials across multiple sectors, seasons, and NPK fertiliser treatments, matched with seasonal climate data from Meteo Rwanda.

---

## Author

**Charlotte Kariza**
c.kariza@alustudent.com
