import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import os

RAW_PATH = "data/raw/insurance_claims.csv"
PROCESSED_DIR = "data/processed"
MODELS_DIR = "models"

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def load_and_clean(path):
    df = pd.read_csv(path)

    # Drop junk / non-predictive columns
    df = df.drop(columns=["_c39", "policy_number", "insured_zip",
                           "incident_location", "auto_model"], errors="ignore")

    # Engineer a feature: days between policy start and incident
    df["policy_bind_date"] = pd.to_datetime(df["policy_bind_date"])
    df["incident_date"] = pd.to_datetime(df["incident_date"])
    df["days_policy_to_incident"] = (df["incident_date"] - df["policy_bind_date"]).dt.days
    df = df.drop(columns=["policy_bind_date", "incident_date"])

    # Replace '?' with explicit "Unknown" category (not imputed as mode —
    # missingness itself may correlate with fraud)
    df["collision_type"] = df["collision_type"].replace("?", "Unknown")
    df["property_damage"] = df["property_damage"].replace("?", "Unknown")
    df["police_report_available"] = df["police_report_available"].replace("?", "Unknown")
    df["authorities_contacted"] = df["authorities_contacted"].fillna("None")

    # Encode target
    df["fraud_reported"] = df["fraud_reported"].map({"Y": 1, "N": 0})

    return df

def build_preprocessor(df):
    target = "fraud_reported"
    X = df.drop(columns=[target])
    y = df[target]

    numeric_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()

    preprocessor = ColumnTransformer(transformers=[
        ("num", StandardScaler(), numeric_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_cols)
    ])

    return X, y, preprocessor

def main():
    df = load_and_clean(RAW_PATH)
    X, y, preprocessor = build_preprocessor(df)

    # Stratified split — important since classes are imbalanced (753 vs 247)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, stratify=y, random_state=42
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=42
    )

    preprocessor.fit(X_train)

    for name, X_split, y_split in [("train", X_train, y_train),
                                     ("val", X_val, y_val),
                                     ("test", X_test, y_test)]:
        X_transformed = preprocessor.transform(X_split)
        feature_names = preprocessor.get_feature_names_out()
        out = pd.DataFrame(X_transformed, columns=feature_names)
        out["fraud_reported"] = y_split.values
        out.to_csv(f"{PROCESSED_DIR}/{name}.csv", index=False)
        print(f"{name}: {out.shape}")

    joblib.dump(preprocessor, f"{MODELS_DIR}/preprocessor.pkl")
    print("Preprocessor saved to models/preprocessor.pkl")

if __name__ == "__main__":
    main()