import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mlflow.tracking import MlflowClient

from api.schemas import ClaimInput, PredictionResponse, ModelInfo, HealthResponse
from api.predict import FraudPredictor, REGISTERED_MODEL_NAME, MODEL_ALIAS

app = FastAPI(
    title="PolicyOps API",
    description="Insurance claim fraud risk prediction with SHAP explainability",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor: FraudPredictor | None = None

@app.get("/experiments/roc-curves")
def roc_curves():
    try:
        with open("models/roc_curves.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="ROC curve data not generated yet. Run src/generate_roc_data.py")

@app.on_event("startup")
def load_model():
    global predictor
    predictor = FraudPredictor()


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", model_loaded=predictor is not None)


@app.post("/predict", response_model=PredictionResponse)
def predict(claim: ClaimInput):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    try:
        claim_dict = claim.dict(by_alias=True)
        # normalize back to underscore keys for internal handling
        claim_dict["capital_gains"] = claim_dict.pop("capital-gains")
        claim_dict["capital_loss"] = claim_dict.pop("capital-loss")
        result = predictor.predict(claim_dict)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/model/info", response_model=ModelInfo)
def model_info():
    client = MlflowClient()
    version = client.get_model_version_by_alias(REGISTERED_MODEL_NAME, MODEL_ALIAS)
    run = client.get_run(version.run_id)
    f1 = run.data.metrics.get("f1_macro")
    roc_auc = run.data.metrics.get("roc_auc")

    return ModelInfo(
        model_name=run.data.params.get("model_type", "unknown"),
        version=str(version.version),
        f1_score=f1,
        roc_auc=roc_auc,
        alias=MODEL_ALIAS,
    )


@app.get("/experiments")
def experiments():
    client = MlflowClient()
    experiment = client.get_experiment_by_name("policyops-fraud-detection")
    if experiment is None:
        raise HTTPException(status_code=404, detail="Experiment not found")

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        order_by=["metrics.f1_macro DESC"],
    )

    results = []
    for run in runs:
        results.append({
            "run_id": run.info.run_id,
            "model_type": run.data.params.get("model_type"),
            "f1_macro": run.data.metrics.get("f1_macro"),
            "roc_auc": run.data.metrics.get("roc_auc"),
            "accuracy": run.data.metrics.get("accuracy"),
            "training_time_sec": run.data.metrics.get("training_time_sec"),
        })

    return results