import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
RAW_MODEL_PATH = os.environ.get('MODEL_PATH', 'model.pkl')


def resolve_model_path(raw_path: str) -> str:
    candidates = [raw_path] if os.path.isabs(raw_path) else [
        os.path.join(APP_ROOT, raw_path),
        os.path.join(APP_ROOT, os.path.basename(raw_path)),
        raw_path,
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]


MODEL_PATH = resolve_model_path(RAW_MODEL_PATH)

app = Flask(__name__)
CORS(app)

model_bundle = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None


@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'ml-service', 'currency': 'INR'})


@app.post('/predict-price')
def predict_price():
    payload = request.get_json(silent=True) or {}

    missing = [f for f in ['category', 'condition'] if f not in payload]
    if missing:
        return jsonify({'message': 'Missing required fields', 'missing': missing}), 400

    category    = str(payload['category']).strip().lower()
    subcategory = str(payload.get('subcategory', 'general')).strip().lower()
    condition   = str(payload['condition']).strip().upper()
    title       = str(payload.get('title', '')).strip()
    description = str(payload.get('description', '')).strip()
    text        = f'{title} {description}'.strip().lower()

    if model_bundle is None:
        desc_len = len(description)
        return jsonify({'predicted_price': round(25 + desc_len * 0.4, 2), 'model_loaded': False, 'currency': 'INR'})

    prediction_input = pd.DataFrame([{
        'category':    category,
        'subcategory': subcategory,
        'condition':   condition,
        'text':        text,
    }])
    prediction = float(model_bundle['model'].predict(prediction_input)[0])

    return jsonify({'predicted_price': round(prediction, 2), 'model_loaded': True, 'currency': 'INR'})


if __name__ == '__main__':
    port  = int(os.environ.get('PORT', os.environ.get('FLASK_PORT', 5001)))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
