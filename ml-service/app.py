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

CATEGORY_ALIASES = {
    'mobile phones': 'phones',
    'mobile-phones': 'phones',
    'cell phones': 'phones',
    'cell phones & accessories': 'phones',
    'tablet': 'tablets',
    'tablets': 'tablets',
    'electronics': 'electronics',
}

TOKEN_STOPWORDS = {
    'and', 'with', 'the', 'for', 'good', 'condition', 'original', 'included',
    'working', 'tested', 'phone', 'mobile', 'laptop', 'tablet', 'camera',
    'headphones', 'audio', 'tv', 'television', 'console', 'games', 'smart',
    'inch', 'gb', 'ssd', 'wifi', 'bluetooth',
}

SUBCATEGORY_ALIASES = {
    'cell phones & accessories': 'mobile-phones',
    'mobile phones': 'mobile-phones',
    'mobile-phones': 'mobile-phones',
}


def normalize_category(value: str) -> str:
    normalized = str(value or '').strip().lower()
    return CATEGORY_ALIASES.get(normalized, normalized)


def normalize_subcategory(value: str) -> str:
    normalized = str(value or '').strip().lower()
    return SUBCATEGORY_ALIASES.get(normalized, normalized or 'general')


def build_price_interval(
    prediction: float,
    category: str,
    prediction_source: str = 'model',
) -> tuple[float, float]:
    if prediction_source == 'catalog':
        half_width = max(prediction * 0.12, 500)
        low = max(1, prediction - half_width)
        high = max(low + 1, prediction + half_width)
        return round(low, 2), round(high, 2)

    interval = (model_bundle or {}).get('interval', {})
    category_error = interval.get('category_error', {})
    global_error = float(interval.get('global_error', 0) or 0)
    minimum_relative_width = float(interval.get('minimum_relative_width', 0.12) or 0.12)
    absolute_width = float(category_error.get(category, global_error) or 0)
    half_width = max(prediction * minimum_relative_width, absolute_width)
    low = max(1, prediction - half_width)
    high = max(low + 1, prediction + half_width)
    return round(low, 2), round(high, 2)


def tokenize(value: str) -> set[str]:
    normalized = ''.join(ch.lower() if ch.isalnum() else ' ' for ch in value or '')
    return {
        token
        for token in normalized.split()
        if len(token) > 1 and token not in TOKEN_STOPWORDS
    }


def find_catalog_prediction(category: str, condition: str, text: str):
    if not model_bundle:
        return None

    query_tokens = tokenize(text)
    if len(query_tokens) < 2:
        return None

    best = None
    best_score = 0
    for item in model_bundle.get('catalog_prices', []):
        if item.get('category') != category or item.get('condition') != condition:
            continue

        title = str(item.get('title', ''))
        title_tokens = tokenize(title)
        if not title_tokens:
            continue

        overlap = query_tokens & title_tokens
        score = len(overlap) / len(title_tokens)
        if title.lower() in text.lower():
            score += 0.35

        if score > best_score:
            best_score = score
            best = item

    if best_score < 0.55:
        return None

    return float(best['price'])


@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'ml-service', 'currency': 'INR'})


@app.post('/predict-price')
def predict_price():
    payload = request.get_json(silent=True) or {}

    missing = [f for f in ['category', 'condition'] if f not in payload]
    if missing:
        return jsonify({'message': 'Missing required fields', 'missing': missing}), 400

    category    = normalize_category(payload['category'])
    subcategory = normalize_subcategory(payload.get('subcategory', 'general'))
    condition   = str(payload['condition']).strip().upper()
    title       = str(payload.get('title', '')).strip()
    description = str(payload.get('description', '')).strip()
    text        = f'{title} {description}'.strip().lower()

    if model_bundle is None:
        desc_len = len(description)
        prediction = round(25 + desc_len * 0.4, 2)
        low = round(max(1, prediction * 0.85), 2)
        high = round(prediction * 1.15, 2)
        return jsonify({
            'predicted_price': prediction,
            'price_low': low,
            'price_high': high,
            'model_loaded': False,
            'currency': 'INR',
        })

    catalog_prediction = find_catalog_prediction(category, condition, text)
    prediction_source = 'catalog' if catalog_prediction is not None else 'model'
    if catalog_prediction is not None:
        prediction = catalog_prediction
    else:
        prediction_input = pd.DataFrame([{
            'category':    category,
            'subcategory': subcategory,
            'condition':   condition,
            'text':        text,
        }])
        prediction = float(model_bundle['model'].predict(prediction_input)[0])
    low, high = build_price_interval(prediction, category, prediction_source)

    return jsonify({
        'predicted_price': round(prediction, 2),
        'price_low': low,
        'price_high': high,
        'prediction_source': prediction_source,
        'model_loaded': True,
        'currency': 'INR',
    })


if __name__ == '__main__':
    port  = int(os.environ.get('PORT', os.environ.get('FLASK_PORT', 5001)))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
