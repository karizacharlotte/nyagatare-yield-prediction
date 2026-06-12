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

The whole interface is bilingual (English ↔ Kinyarwanda) and supports light/dark mode.

---

## Tech stack

| Layer | Tools |
|---|---|
| **Data & ML** | Python, pandas, scikit-learn (Random Forest, Gradient Boosting), joblib |
| **API** | Flask, Flasgger-style Swagger UI, Gunicorn |
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
│   └── app.py
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
| `/predict` | POST | Submit farm conditions, get a yield prediction + advice |
| `/model-info` | GET | Cross-validation metrics & feature lists for both models |
| `/health` | GET | Health check |
| `/apidocs` | GET | Interactive Swagger UI |

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

The app is deployed as a single Render **Blueprint** service, defined in [`render.yaml`](render.yaml):

- **Build:** `pip install -r requirements.txt` (also builds and bundles the React frontend into `frontend/dist/`, which Flask serves at `/`)
- **Run:** `gunicorn api.app:app --bind 0.0.0.0:$PORT --workers 2`
- **Plan:** Free tier, Python 3.11
- **Trigger:** auto-deploys on every push to `main` on GitHub

Flask serves both the REST API (`/predict`, `/model-info`, `/health`, `/apidocs`) and the built frontend (`/`) from one service, so the whole app runs from a single URL.

---

## Data source

Field trial data from **RAB (Rwanda Agriculture and Animal Resources Development Board)**, Nyagatare District — bean and rice trials across multiple sectors, seasons, and NPK fertiliser treatments, matched with seasonal climate data from Meteo Rwanda.

---

## Author

**Charlotte Kariza**
c.kariza@alustudent.com
