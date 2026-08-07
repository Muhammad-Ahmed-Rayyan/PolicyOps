import pandas as pd
import numpy as np
import json
import mlflow
import mlflow.sklearn
import mlflow.xgboost
from mlflow.tracking import MlflowClient
from sklearn.metrics import roc_curve

EXPERIMENT_NAME = "policyops-fraud-detection"
VAL_PATH = "data/processed/val.csv"
TARGET = "fraud_reported"
OUTPUT_PATH = "models/roc_curves.json"
N_POINTS = 50  # downsample for a clean chart

def get_best_run_per_model(client, experiment_id):
    runs = client.search_runs(
        experiment_ids=[experiment_id],
        order_by=["metrics.f1_macro DESC"],
    )
    best_per_type = {}
    for run in runs:
        model_type = run.data.params.get("model_type")
        if model_type and model_type not in best_per_type:
            best_per_type[model_type] = run
    return best_per_type

def load_model_by_type(run_id, model_type):
    uri = f"runs:/{run_id}/model"
    if model_type == "XGBoost":
        return mlflow.xgboost.load_model(uri)
    return mlflow.sklearn.load_model(uri)

def downsample(fpr, tpr, n=N_POINTS):
    if len(fpr) <= n:
        return fpr.tolist(), tpr.tolist()
    idx = np.linspace(0, len(fpr) - 1, n).astype(int)
    return fpr[idx].tolist(), tpr[idx].tolist()

def main():
    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    best_runs = get_best_run_per_model(client, experiment.experiment_id)

    val = pd.read_csv(VAL_PATH)
    X_val = val.drop(columns=[TARGET])
    y_val = val[TARGET]

    results = {}
    for model_type, run in best_runs.items():
        print(f"Processing {model_type}...")
        model = load_model_by_type(run.info.run_id, model_type)
        y_proba = model.predict_proba(X_val)[:, 1]
        fpr, tpr, _ = roc_curve(y_val, y_proba)
        fpr_ds, tpr_ds = downsample(fpr, tpr)

        results[model_type] = {
            "fpr": fpr_ds,
            "tpr": tpr_ds,
            "roc_auc": run.data.metrics.get("roc_auc"),
        }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f)

    print(f"Saved ROC curve data for {len(results)} models to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()