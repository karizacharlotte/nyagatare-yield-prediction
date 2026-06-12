# YieldWise — Nyagatare Crop Yield Prediction

Machine learning yield forecasting for **bean and rice farmers** in Nyagatare District, Rwanda. YieldWise predicts expected crop yield (tonnes/hectare) from fertiliser use, location, planting timing, and seasonal climate — and turns that prediction into plain-language farming advice, in **English and Kinyarwanda**.

**Live app & API:** [nyagatare-yield-prediction.onrender.com](https://nyagatare-yield-prediction.onrender.com)
**API docs (Swagger UI):** [/apidocs](https://nyagatare-yield-prediction.onrender.com/apidocs)

> Note: the live service is on Render's free tier and may take 30–60s to wake up after inactivity.

![YieldWise hero screenshot](notebooks/images/webapp_hero.jpg)

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

## Model performance

Trained on **216 RAB field trial records** from Nyagatare District (5-fold cross-validation):

| Crop | Model | R² | RMSE | MAE | Training rows |
|---|---|---|---|---|---|
| Beans | Random Forest | 0.494 | 0.316 | 0.262 | 96 |
| Rice | Gradient Boosting | 0.674 | 0.848 | 0.629 | 120 |

See [`notebooks/02_model_training.ipynb`](notebooks/02_model_training.ipynb) for the full EDA, model architecture, hyperparameter search, and performance discussion.

---

## Project structure

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

## Running locally

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

## Data source

Field trial data from **RAB (Rwanda Agriculture and Animal Resources Development Board)**, Nyagatare District — bean and rice trials across multiple sectors, seasons, and NPK fertiliser treatments, matched with seasonal climate data from Meteo Rwanda.

---

## Author

**Charlotte Kariza**
c.kariza@alustudent.com
