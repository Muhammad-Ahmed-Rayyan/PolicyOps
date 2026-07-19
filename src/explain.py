import pandas as pd
import numpy as np
import shap
import mlflow
from mlflow.tracking import MlflowClient
import joblib
import json

REGISTERED_MODEL_NAME = "policyops-fraud-model"
MODEL_ALIAS = "champion"
VAL_PATH = "data/processed/val.csv"
TARGET = "fraud_reported"
BASELINE_PATH = "models/shap_baseline.json"

def load_champion_model():
    client = MlflowClient()
    model_version = client.get_model_version_by_alias(REGISTERED_MODEL_NAME, MODEL_ALIAS)
    model_uri = f"models:/{REGISTERED_MODEL_NAME}@{MODEL_ALIAS}"
    model = mlflow.xgboost.load_model(model_uri)
    return model, model_version.version

def build_explainer(model, X_background):
    # TreeExplainer is exact and fast for tree-based models like XGBoost,
    # unlike KernelExplainer which is a slower model-agnostic approximation
    explainer = shap.TreeExplainer(model, X_background)
    return explainer

def explain_instance(explainer, X_instance, feature_names, top_n=5):
    shap_values = explainer.shap_values(X_instance)
    if len(shap_values.shape) > 1:
        shap_values = shap_values[0]

    contributions = dict(zip(feature_names, shap_values))
    sorted_contributions = dict(
        sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)[:top_n]
    )
    return sorted_contributions

def main():
    model, version = load_champion_model()
    print(f"Loaded champion model version {version}")

    val = pd.read_csv(VAL_PATH)
    X_val = val.drop(columns=[TARGET])
    feature_names = X_val.columns.tolist()

    # Use a sample of validation data as SHAP background distribution
    background = X_val.sample(min(100, len(X_val)), random_state=42)
    explainer = build_explainer(model, background)

    baseline_risk = float(model.predict_proba(background)[:, 1].mean())
    print(f"Baseline risk (avg predicted fraud probability): {baseline_risk:.4f}")

    with open(BASELINE_PATH, "w") as f:
        json.dump({"baseline_risk": baseline_risk}, f)
    print(f"Saved baseline risk to {BASELINE_PATH}")

    # Sanity check: explain one example prediction
    sample_instance = X_val.iloc[[0]]
    top_factors = explain_instance(explainer, sample_instance, feature_names)

    print("\nSample prediction explanation (top 5 SHAP contributors):")
    for feature, value in top_factors.items():
        direction = "increases" if value > 0 else "decreases"
        print(f"  {feature}: {value:.4f} ({direction} fraud risk)")

    joblib.dump(explainer, "models/shap_explainer.pkl")
    print("\nSHAP explainer saved to models/shap_explainer.pkl")

if __name__ == "__main__":
    main()