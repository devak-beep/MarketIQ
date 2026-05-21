# ML Service

Flask service for MarketIQ suggested price prediction.

## Files

- `app.py` - prediction API
- `train_model.py` - model training script
- `dataset.csv` - starter dataset with category, condition, description_length, price

## Endpoint

- `POST /predict-price`

## Training Output

- MAE
- RMSE
- R²

Run `train_model.py` after installing dependencies to generate `model.pkl`.
