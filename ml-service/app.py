import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import pandas as pd

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(APP_ROOT, os.environ.get('MODEL_PATH', 'model.pkl'))

app = Flask(__name__)
CORS(app)

model_bundle = None
if os.path.exists(MODEL_PATH):
    model_bundle = joblib.load(MODEL_PATH)

@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'ml-service'})

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

    features = {
        'category': str(payload['category']),
        'condition': str(payload['condition']),
        'description_length': description_length
    }

    if model_bundle is None:
        baseline = round(25 + description_length * 0.4, 2)
        return jsonify({'predicted_price': baseline, 'model_loaded': False})

    prediction_input = pd.DataFrame([features])
    prediction = model_bundle['model'].predict(prediction_input)[0]
    return jsonify({'predicted_price': round(float(prediction), 2), 'model_loaded': True})

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
