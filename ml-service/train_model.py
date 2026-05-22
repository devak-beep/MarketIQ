from pathlib import Path
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.isotonic import IsotonicRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / 'dataset.csv'
MODEL_PATH = BASE_DIR / 'model.pkl'
CONDITION_ORDER = ['POOR', 'FAIR', 'GOOD', 'LIKE_NEW', 'NEW']


def load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f'Dataset not found: {DATASET_PATH}')
    df = pd.read_csv(DATASET_PATH)
    expected = {'category', 'condition', 'description_length', 'price'}
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f'Missing columns: {sorted(missing)}')
    df = df.dropna(subset=['category', 'condition', 'description_length', 'price']).copy()
    df['description_length'] = pd.to_numeric(df['description_length'], errors='coerce')
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    df = df.dropna(subset=['description_length', 'price'])
    return df


def main():
    df = load_dataset()
    df['condition'] = df['condition'].str.upper().str.strip()

    # Build a baseline model for the item/category/description itself,
    # then apply a monotonic condition multiplier so NEW > LIKE_NEW > GOOD > FAIR > POOR.
    baseline_df = df[df['condition'] == 'NEW'].copy()
    if baseline_df.empty:
        baseline_df = df.copy()

    X = baseline_df[['category', 'description_length']]
    y = baseline_df['price']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    preprocess = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), ['category'])
        ],
        remainder='passthrough'
    )

    model = Pipeline(
        steps=[
            ('preprocess', preprocess),
            ('regressor', RandomForestRegressor(n_estimators=250, random_state=42))
        ]
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    condition_means = (
        df.groupby('condition')['price']
        .mean()
        .reindex(CONDITION_ORDER)
        .astype(float)
    )
    quality_scale = list(range(len(CONDITION_ORDER)))
    iso = IsotonicRegression(increasing=True, out_of_bounds='clip')
    smoothed_means = iso.fit_transform(quality_scale, condition_means.tolist())
    new_mean = float(smoothed_means[-1]) if smoothed_means[-1] else float(condition_means['NEW'])
    condition_multipliers = {
        condition: round(float(smoothed_means[idx]) / new_mean, 6)
        for idx, condition in enumerate(CONDITION_ORDER)
    }

    joblib.dump(
        {
            'base_model': model,
            'condition_multipliers': condition_multipliers,
            'condition_order': CONDITION_ORDER,
            'metrics': {
                'mae': round(float(mae), 2),
                'rmse': round(float(rmse), 2),
                'r2': round(float(r2), 4)
            }
        },
        MODEL_PATH
    )

    print('Model saved to', MODEL_PATH)
    print({'mae': round(mae, 2), 'rmse': round(rmse, 2), 'r2': round(r2, 4)})
    print({'condition_multipliers': condition_multipliers})


if __name__ == '__main__':
    main()
