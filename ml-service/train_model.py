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
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    expected = {"category", "condition", "description_length", "price"}
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    df = df.dropna(
        subset=["category", "condition", "description_length", "price"]
    ).copy()
    df["description_length"] = pd.to_numeric(
        df["description_length"], errors="coerce"
    )
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["description_length", "price"])

    df["category"] = df["category"].astype(str).str.lower().str.strip()
    df["condition"] = df["condition"].astype(str).str.upper().str.strip()
    df["title"] = df.get("title", "").fillna("").astype(str)
    df["description"] = df.get("description", "").fillna("").astype(str)
    df["text"] = (df["title"] + " " + df["description"]).str.lower().str.strip()

    return df


def main():
    df = load_dataset()
    x = df[["category", "condition", "text"]]
    y = df["price"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                ["category", "condition"],
            ),
            (
                "text",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=1,
                    max_features=5000,
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

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse**0.5
    r2 = r2_score(y_test, predictions)

    joblib.dump(
        {
            "model": model,
            "feature_columns": ["category", "condition", "text"],
            "metrics": {
                "mae": round(float(mae), 2),
                "rmse": round(float(rmse), 2),
                "r2": round(float(r2), 4),
            },
        },
        MODEL_PATH,
    )

    print("Model saved to", MODEL_PATH)
    print({"mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4)})


if __name__ == "__main__":
    main()
