import mlflow
from mlflow.tracking import MlflowClient

EXPERIMENT_NAME = "policyops-fraud-detection"
REGISTERED_MODEL_NAME = "policyops-fraud-model"

def get_best_run(client, experiment_id):
    runs = client.search_runs(
        experiment_ids=[experiment_id],
        order_by=["metrics.f1_macro DESC"],
        max_results=1,
    )
    if not runs:
        raise ValueError("No runs found in this experiment. Run train.py first.")
    return runs[0]

def main():
    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)

    if experiment is None:
        raise ValueError(f"Experiment '{EXPERIMENT_NAME}' not found. Run train.py first.")

    best_run = get_best_run(client, experiment.experiment_id)
    run_id = best_run.info.run_id
    model_name = best_run.data.params.get("model_type", "unknown")
    f1 = best_run.data.metrics.get("f1_macro")
    roc_auc = best_run.data.metrics.get("roc_auc")

    print(f"Best run: {model_name}")
    print(f"  Run ID: {run_id}")
    print(f"  F1 (macro): {f1:.4f}")
    print(f"  ROC-AUC: {roc_auc:.4f}")

    # XGBoost was logged under the 'xgboost' flavor, others under 'sklearn' —
    # both expose the same artifact path "model" so this works either way
    model_uri = f"runs:/{run_id}/model"

    result = mlflow.register_model(model_uri=model_uri, name=REGISTERED_MODEL_NAME)
    version = result.version

    print(f"\nRegistered as '{REGISTERED_MODEL_NAME}' version {version}")

    # Promote to Production stage / set as champion alias
    client.set_registered_model_alias(
        name=REGISTERED_MODEL_NAME,
        alias="champion",
        version=version,
    )
    print(f"Aliased version {version} as 'champion' — this is what the API will serve")

if __name__ == "__main__":
    main()