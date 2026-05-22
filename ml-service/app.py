import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
RAW_MODEL_PATH = os.environ.get('MODEL_PATH', 'model.pkl')

def resolve_model_path(raw_path: str) -> str:
    candidates = []
    if os.path.isabs(raw_path):
        candidates.append(raw_path)
    else:
        candidates.append(os.path.join(APP_ROOT, raw_path))
        candidates.append(os.path.join(APP_ROOT, os.path.basename(raw_path)))
        candidates.append(raw_path)

    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate

    return candidates[0]


MODEL_PATH = resolve_model_path(RAW_MODEL_PATH)

app = Flask(__name__)
CORS(app)

model_bundle = None
if os.path.exists(MODEL_PATH):
    model_bundle = joblib.load(MODEL_PATH)

@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'ml-service', 'currency': 'INR'})

@app.post('/predict-price')
def predict_price():
    payload = request.get_json(silent=True) or {}
    required = ['category', 'condition', 'description_length']
    missing = [field for field in required if field not in payload]
    if missing:
        return jsonify({'message': 'Missing required fields', 'missing': missing}), 400

    try:
        description_length = int(payload['description_length'])
    except (TypeError, ValueError):
        return jsonify({'message': 'description_length must be a number'}), 400

    category = str(payload['category']).strip().lower()
    condition = str(payload['condition']).strip().upper()

    if model_bundle is None:
        baseline = round(25 + description_length * 0.4, 2)
        return jsonify({'predicted_price': baseline, 'model_loaded': False, 'currency': 'INR'})

    if 'base_model' in model_bundle and 'condition_multipliers' in model_bundle:
        prediction_input = pd.DataFrame([
            {'category': category, 'description_length': description_length}
        ])
        baseline = float(model_bundle['base_model'].predict(prediction_input)[0])
        multiplier = float(model_bundle['condition_multipliers'].get(condition, 1.0))
        prediction = baseline * multiplier
    else:
        features = {
            'category': category,
            'condition': condition,
            'description_length': description_length,
        }
        prediction_input = pd.DataFrame([features])
        prediction = float(model_bundle['model'].predict(prediction_input)[0])

    return jsonify({'predicted_price': round(float(prediction), 2), 'model_loaded': True, 'currency': 'INR'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('FLASK_PORT', 5001)))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
