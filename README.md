<div align="center">

# 🚨 PolicyOps

**Insurance Claim Fraud Detection MLOps Pipeline**

![Last Commit](https://img.shields.io/github/last-commit/Muhammad-Ahmed-Rayyan/PolicyOps)
![languages](https://img.shields.io/github/languages/count/Muhammad-Ahmed-Rayyan/PolicyOps)

<br>

Built with the tools and technologies:  
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![MLflow](https://img.shields.io/badge/MLflow-0194E2?style=for-the-badge&logo=mlflow&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-006ACC?style=for-the-badge)
![scikitlearn](https://img.shields.io/badge/scikit--learn-%23F7931E.svg?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%232496ED.svg?style=for-the-badge&logo=docker&logoColor=white)
![DVC](https://img.shields.io/badge/DVC-945DD6?style=for-the-badge&logo=dvc&logoColor=white)

</div>

---

## 🧠 Project Summary

**PolicyOps** is a complete end-to-end MLOps pipeline for insurance claim fraud detection. It trains and tracks multiple classification models using MLflow, automatically selects the best performer, explains predictions using SHAP values, serves the model via a FastAPI REST endpoint, containerizes everything with Docker, and displays results on a React dashboard.

The project demonstrates the full ML lifecycle — from raw data ingestion and versioning through model training, experiment tracking, model registry, explainability, and production serving — mirroring how real insurtech fraud-detection systems are built and operated.

Insurance fraud costs the industry billions annually, and manual claim review doesn't scale. But a fraud model that can't explain *why* it flagged a claim is a liability, not a tool — adjusters need to justify decisions, and false accusations damage customer trust. PolicyOps addresses both sides of this: a production-grade classifier wrapped in proper MLOps infrastructure, paired with per-prediction SHAP explanations so every flagged claim comes with a clear, defensible reason.

---

## 🚀 Features

- 🗂️ **DVC Data Versioning**
  Raw and processed data tracked alongside code for full pipeline reproducibility.

- 📈 **MLflow Experiment Tracking**
  Every training run logs hyperparameters, accuracy, F1, precision, recall, ROC-AUC, confusion matrix, ROC curve, and training time.

- 🤖 **Multi-Model Comparison**
  5 models trained and tracked in one pipeline run — Logistic Regression, Random Forest, XGBoost, SVM, KNN.

- 🏆 **Automated Model Selection**
  Best F1 score on the validation set is auto-promoted to the registry under a `champion` alias.

- 🔍 **SHAP Explainability**
  Per-prediction feature attribution via TreeExplainer — exact and fast for tree-based models.

- ❓ **Deliberate Missingness Handling**
  Rather than mode-imputing missing categorical fields, missingness is preserved as its own `"Unknown"` category, since in fraud detection *whether* information is missing can itself be a signal.

- ⚡ **FastAPI Serving Endpoint**
  REST API returning risk classification (Low/Medium/High), probability, baseline risk, and top SHAP contributors.

- 🐳 **Docker Containerization**
  Reproducible backend packaging, platform-agnostic via dynamic `$PORT` binding at runtime.

- 📊 **React Dashboard**
  Claim intake form with client-side validation, SHAP factor visualization, ROC curve comparison across all 5 models, and a full experiment comparison table.

---

## 🗂️ Dataset

**Auto Insurance Claims Data**
- Source: Kaggle — [`buntyshah/auto-insurance-claims-data`](https://www.kaggle.com/datasets/buntyshah/auto-insurance-claims-data)
- ~1,000 policy records, ~40 features
- Binary classification: fraud reported (Y) or not (N) — class distribution: 753 legitimate, 247 fraudulent
- Real, human-readable features (not PCA-anonymized) — policy details, insured demographics, incident specifics, and claim amounts — chosen specifically so SHAP explanations are meaningful to a human reader, not just abstract component scores

---

## 🏗️ Architecture

```bash
Auto Insurance Claims Dataset (Kaggle)
         ↓
DVC Data Versioning
(raw + processed data tracked alongside code)
         ↓
Preprocessing Pipeline
(missing-value handling, feature engineering, scaling, encoding, stratified split)
         ↓
Multi-Model Training
Logistic Regression | Random Forest | XGBoost | SVM | KNN
         ↓
MLflow Experiment Tracking
(params, accuracy, F1, precision, recall, ROC-AUC,
confusion matrix, ROC curve, training time — per model per run)
         ↓
Automated Model Selection
(best F1 score on validation set)
         ↓
MLflow Model Registry
(winning model registered, aliased as "champion")
         ↓
SHAP Value Computation (TreeExplainer)
(per-prediction feature attribution — explainability layer)
         ↓
FastAPI Serving Endpoint
(POST claim features → risk level + confidence + SHAP explanation)
         ↓
Docker Container
(entire backend packaged reproducibly)
         ↓
React Dashboard
(claim intake form, SHAP waterfall chart, ROC comparison, experiment table)
```

---

## 📊 Model Results

*Validation set metrics, 5-fold comparison:*

| Model | F1 (macro) | ROC-AUC | Accuracy | Training Time |
|---|---|---|---|---|
| **XGBoost** ⭐ | **0.8355** | 0.9239 | **0.8800** | 1.28s |
| Logistic Regression | 0.7982 | 0.9067 | 0.8600 | 1.47s |
| Random Forest | 0.7293 | **0.9330** | 0.8333 | 1.76s |
| SVM | 0.5635 | 0.8914 | 0.7733 | 0.67s |
| KNN | 0.5440 | 0.6146 | 0.7467 | 0.01s |

**XGBoost was selected as champion** (best F1 score, the primary selection criterion). Random Forest edges it out on ROC-AUC — a genuine tradeoff between overall ranking quality (AUC) and balanced precision/recall at the classification threshold (F1), discussed further in Key Technical Decisions below.

---

## 🔑 API Endpoints

**`POST /predict`** — Accepts claim features, returns fraud risk prediction with explanation.

```json
{
  "risk_level": "High",
  "probability": 0.9592,
  "prediction": 1,
  "model_version": "1",
  "baseline_risk": 0.2283,
  "shap_values": {
    "incident_severity_Major Damage": 3.2626,
    "auto_year": 1.0208,
    "incident_hour_of_the_day": 0.9024,
    "capital-gains": 0.6591,
    "total_claim_amount": 0.4941
  },
  "top_risk_factor": "incident_severity_Major Damage"
}
```

- **`GET /experiments`** — Returns all MLflow experiment runs with metrics, for dashboard comparison.
- **`GET /experiments/roc-curves`** — Returns precomputed ROC curve points (fpr/tpr) for each of the 5 models.
- **`GET /model/info`** — Returns current champion model metadata — version, F1, ROC-AUC.
- **`GET /health`** — Health check endpoint.

---

## 🔧 Setup & Installation

> Make sure Python 3.8+ and Node.js are installed.

### Backend

```bash
# Clone the repo
git clone https://github.com/Muhammad-Ahmed-Rayyan/PolicyOps.git
cd PolicyOps

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Pull data with DVC
dvc pull

# Run the pipeline
python src\preprocess.py
python src\train.py
python src\select_model.py
python src\explain.py
python src\generate_roc_data.py

# View experiments in MLflow UI
mlflow ui
# open http://localhost:5000

# Run the API
uvicorn api.main:app --reload
# open http://localhost:8000/docs

# Or run with Docker
docker-compose up --build
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

---

## ☁️ Deployment

The backend is fully containerized and deployment-ready (`Dockerfile` + `docker-compose.yml` included, platform-agnostic via dynamic `$PORT` binding). Live deployment is currently on hold — most free-tier platforms with Docker support (Render, Hugging Face Spaces) now require card verification even on their free plans, which this project intentionally avoids. Deploying to any Docker-compatible host requires no code changes, only setting the `MLFLOW_TRACKING_URI` environment variable and ensuring model artifacts are included in the build context.

---

## 🧩 Key Technical Decisions

- **Why MLflow over Weights & Biases:** Fully open source and self-hostable with no account required — the cleaner choice for a reproducible portfolio project.
- **Why DVC for data versioning:** Integrates with Git so data versions are tied to code versions — the same `git checkout` that gives you last week's code also gives you last week's data.
- **Why SHAP over LIME:** Stronger theoretical guarantees (Shapley values from game theory), and TreeSHAP is fast and exact specifically for tree-based models like XGBoost.
- **Why XGBoost despite Random Forest's higher ROC-AUC:** Model selection was based on F1 score, which matters more for a tool where both false positives and false negatives carry real cost. ROC-AUC measures ranking quality across all thresholds, valuable but secondary to threshold performance.
- **Why missingness is preserved, not imputed:** Roughly a third of `property_damage` and `police_report_available` values were missing — imputing them would discard a potentially meaningful pattern. Keeping `"Unknown"` as an explicit category lets the model learn from missingness itself.
- **Why Docker:** MLflow artifacts, model files, and the FastAPI app need to run together reproducibly across environments — the same container runs identically on a dev machine, CI server, or cloud deployment.

---

## ⚠️ Known Limitations

- Free-text claim fields (occupation, hobbies, city, auto make) are validated for character patterns but not against a real-world reference list
- Dataset size (~1,000 records) is small relative to production fraud systems — results here demonstrate pipeline correctness and methodology rather than production-scale performance
- Live deployment is currently paused pending a genuinely free, card-free Docker hosting option

---

## 🔮 Future Improvements

- Live deployment once a suitable free hosting path is confirmed
- Data drift detection — flag when incoming claims distribution shifts from training data
- Automated hyperparameter tuning with Optuna, logged to MLflow
- Model monitoring dashboard for production drift/performance tracking
- GitHub Actions CI/CD for automated retraining on data updates

---

<div align="center">

⭐ Found this project useful? Drop a star on GitHub!

</div>