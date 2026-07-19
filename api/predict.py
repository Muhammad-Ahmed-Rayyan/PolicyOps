import pandas as pd
import joblib
import mlflow
from mlflow.tracking import MlflowClient
import json

REGISTERED_MODEL_NAME = "policyops-fraud-model"
MODEL_ALIAS = "champion"
PREPROCESSOR_PATH = "models/preprocessor.pkl"
EXPLAINER_PATH = "models/shap_explainer.pkl"
BASELINE_PATH = "models/shap_baseline.json"


class FraudPredictor:
    def __init__(self):
        self.client = MlflowClient()
        self.model = None
        self.model_version = None
        self.preprocessor = None
        self.explainer = None
        self.baseline_risk = None
        self._load_artifacts()

    def _load_artifacts(self):
        model_version = self.client.get_model_version_by_alias(
            REGISTERED_MODEL_NAME, MODEL_ALIAS
        )
        self.model_version = model_version.version
        model_uri = f"models:/{REGISTERED_MODEL_NAME}@{MODEL_ALIAS}"
        self.model = mlflow.xgboost.load_model(model_uri)

        self.preprocessor = joblib.load(PREPROCESSOR_PATH)
        self.explainer = joblib.load(EXPLAINER_PATH)

        with open(BASELINE_PATH, "r") as f:
            self.baseline_risk = json.load(f)["baseline_risk"]

    def predict(self, claim_dict: dict, top_n: int = 5) -> dict:
        df = pd.DataFrame([claim_dict])

        # Rename underscore keys back to the hyphenated originals the
        # preprocessor was fit on (capital-gains, capital-loss)
        df = df.rename(columns={
            "capital_gains": "capital-gains",
            "capital_loss": "capital-loss",
        })

        X_transformed = self.preprocessor.transform(df)
        feature_names = self.preprocessor.get_feature_names_out()
        X_df = pd.DataFrame(X_transformed, columns=feature_names)

        probability = float(self.model.predict_proba(X_df)[:, 1][0])
        prediction = int(probability >= 0.5)

        if probability < 0.3:
            risk_level = "Low"
        elif probability < 0.6:
            risk_level = "Medium"
        else:
            risk_level = "High"

        shap_values = self.explainer.shap_values(X_df)
        if len(shap_values.shape) > 1:
            shap_values = shap_values[0]

        contributions = dict(zip(feature_names, shap_values.tolist()))
        top_factors = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)[:top_n]
        )
        top_risk_factor = max(top_factors.items(), key=lambda x: abs(x[1]))[0]

        return {
            "risk_level": risk_level,
            "probability": round(probability, 4),
            "prediction": prediction,
            "model_version": str(self.model_version),
            "baseline_risk": round(self.baseline_risk, 4),
            "shap_values": {k: round(v, 4) for k, v in top_factors.items()},
            "top_risk_factor": top_risk_factor,
        }