import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
import mlflow.xgboost
import time
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    roc_auc_score, confusion_matrix, roc_curve, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

TRAIN_PATH = "data/processed/train.csv"
VAL_PATH = "data/processed/val.csv"
TARGET = "fraud_reported"

mlflow.set_experiment("policyops-fraud-detection")

def load_data():
    train = pd.read_csv(TRAIN_PATH)
    val = pd.read_csv(VAL_PATH)
    X_train = train.drop(columns=[TARGET])
    y_train = train[TARGET]
    X_val = val.drop(columns=[TARGET])
    y_val = val[TARGET]
    return X_train, y_train, X_val, y_val

def get_models():
    return {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=200, random_state=42),
        "XGBoost": XGBClassifier(eval_metric="logloss", random_state=42),
        "SVM": SVC(probability=True, random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=5),
    }

def plot_confusion_matrix(y_true, y_pred, model_name):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title(f"Confusion Matrix - {model_name}")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    path = f"confusion_matrix_{model_name}.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()
    return path

def plot_roc_curve(y_true, y_proba, model_name):
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    plt.figure(figsize=(5, 4))
    plt.plot(fpr, tpr, label=f"AUC = {roc_auc_score(y_true, y_proba):.3f}")
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray")
    plt.title(f"ROC Curve - {model_name}")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.legend()
    path = f"roc_curve_{model_name}.png"
    plt.savefig(path, bbox_inches="tight")
    plt.close()
    return path

def train_and_log(name, model, X_train, y_train, X_val, y_val):
    with mlflow.start_run(run_name=name):
        start = time.time()
        model.fit(X_train, y_train)
        train_time = time.time() - start

        y_pred = model.predict(X_val)
        y_proba = model.predict_proba(X_val)[:, 1]

        metrics = {
            "accuracy": accuracy_score(y_val, y_pred),
            "f1_macro": f1_score(y_val, y_pred, average="macro"),
            "precision_macro": precision_score(y_val, y_pred, average="macro"),
            "recall_macro": recall_score(y_val, y_pred, average="macro"),
            "roc_auc": roc_auc_score(y_val, y_proba),
            "training_time_sec": train_time,
        }

        mlflow.log_param("model_type", name)
        mlflow.log_params(model.get_params())
        mlflow.log_metrics(metrics)

        cm_path = plot_confusion_matrix(y_val, y_pred, name)
        roc_path = plot_roc_curve(y_val, y_proba, name)
        mlflow.log_artifact(cm_path)
        mlflow.log_artifact(roc_path)

        report = classification_report(y_val, y_pred)
        report_path = f"classification_report_{name}.txt"
        with open(report_path, "w") as f:
            f.write(report)
        mlflow.log_artifact(report_path)

        if name == "XGBoost":
            mlflow.xgboost.log_model(model, "model")
        else:
            mlflow.sklearn.log_model(model, "model")

        print(f"{name}: F1={metrics['f1_macro']:.4f} | ROC-AUC={metrics['roc_auc']:.4f} | Time={train_time:.2f}s")
        return metrics

def main():
    X_train, y_train, X_val, y_val = load_data()
    models = get_models()

    results = {}
    for name, model in models.items():
        results[name] = train_and_log(name, model, X_train, y_train, X_val, y_val)

    print("\n--- Summary ---")
    for name, m in results.items():
        print(f"{name}: F1={m['f1_macro']:.4f}, ROC-AUC={m['roc_auc']:.4f}")

if __name__ == "__main__":
    main()