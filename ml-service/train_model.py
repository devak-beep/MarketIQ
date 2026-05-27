from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"
MODEL_PATH = BASE_DIR / "model.pkl"


def load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}\n"
            "Run: python prepare_dataset.py"
        )

    df = pd.read_csv(DATASET_PATH)
    required = {"category", "subcategory", "condition", "description_length", "price"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    df = df.dropna(subset=list(required)).copy()
    df["description_length"] = pd.to_numeric(df["description_length"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["description_length", "price"])
    df = df[df["price"] > 0]

    df["category"]    = df["category"].astype(str).str.lower().str.strip()
    df["subcategory"] = df["subcategory"].astype(str).str.lower().str.strip()
    df["condition"]   = df["condition"].astype(str).str.upper().str.strip()
    df["title"]       = df.get("title", pd.Series(dtype=str)).fillna("").astype(str)
    df["description"] = df.get("description", pd.Series(dtype=str)).fillna("").astype(str)
    df["text"]        = (df["title"] + " " + df["description"]).str.lower().str.strip()

    return df


def main():
    df = load_dataset()
    print(f"Training on {len(df):,} rows …")

    X = df[["category", "subcategory", "condition", "text"]]
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                ["category", "subcategory", "condition"],
            ),
            (
                "text",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=3,
                    max_features=50000,
                ),
                "text",
            ),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocess", preprocess),
            (
                "regressor",
                TransformedTargetRegressor(
                    regressor=Ridge(alpha=1.0),
                    func=np.log1p,
                    inverse_func=np.expm1,
                ),
            ),
        ]
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    residuals = (pd.Series(y_test.to_numpy()) - pd.Series(predictions)).abs()

    mae  = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2   = r2_score(y_test, predictions)

    metrics = {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2": round(float(r2), 4),
    }

    uncertainty = X_test[["category"]].reset_index(drop=True).copy()
    uncertainty["absolute_error"] = residuals
    category_error = (
        uncertainty.groupby("category")["absolute_error"]
        .quantile(0.8)
        .round(2)
        .to_dict()
    )
    global_error = float(residuals.quantile(0.8))

    joblib.dump(
        {
            "model": model,
            "feature_columns": ["category", "subcategory", "condition", "text"],
            "metrics": metrics,
            "catalog_prices": df[
                ["category", "subcategory", "condition", "title", "price"]
            ].to_dict(orient="records"),
            "interval": {
                "method": "p80_absolute_residual",
                "global_error": round(global_error, 2),
                "category_error": category_error,
                "minimum_relative_width": 0.12,
            },
        },
        MODEL_PATH,
    )

    print("Model saved →", MODEL_PATH)
    print(metrics)


if __name__ == "__main__":
    main()
