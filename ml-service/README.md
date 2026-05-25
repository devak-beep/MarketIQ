# ML Service

Flask service for MarketIQ suggested price prediction.

## Files

- `app.py` - prediction API
- `train_model.py` - model training script
- `dataset.csv` - starter dataset with category, condition, title, description, description_length, price
- `build_starter_dataset.py` - regenerates the starter dataset with product-level examples

## Endpoint

- `POST /predict-price`

Recommended request body:

```json
{
  "category": "laptops",
  "condition": "GOOD",
  "title": "MacBook Pro",
  "description": "M3 14 inch 16GB 512GB good condition"
}
```

## Training Output

- MAE
- RMSE
- R²

Run `train_model.py` after installing dependencies to generate `model.pkl`.
