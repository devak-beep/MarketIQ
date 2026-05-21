# Quick Start Guide

## ⚙️ Setup Status: COMPLETE ✅

All dependencies installed, database configured, and services tested.

---

## 🚀 Running the Services

### Terminal 1: Start Backend API

```bash
npm --prefix server run dev
```

Expected output:

```
MarketIQ API listening on port 4000
```

### Terminal 2: Start ML Service

```bash
cd ml-service
# Using the Python venv created during setup
"/home/hello/Documents/My projects /MarketIQ/.venv/bin/python" app.py
```

Expected output:

```
Running on http://127.0.0.1:5001
```

### Terminal 3: Start Mobile App

```bash
npm --prefix mobile run start
```

This will start Expo, and you can:

- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator
- Scan QR code with Expo Go app (iOS/Android)

---

## 🧪 Testing the APIs

### Test 1: Get All Categories

```bash
curl http://localhost:4000/api/categories | jq
```

Should return 10 categories (Phones, Laptops, Furniture, etc.)

### Test 2: Register a New User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "Password123!",
    "role": "SELLER"
  }'
```

Returns: `{ "user": {...}, "token": "..." }`

### Test 3: Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Password123!"
  }'
```

### Test 4: Create a Listing (requires auth token)

```bash
TOKEN="<paste_token_from_login>"
curl -X POST http://localhost:4000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": "<category_id_from_categories>",
    "title": "iPhone 13 Pro",
    "description": "Excellent condition, 256GB storage, includes box and accessories",
    "condition": "LIKE_NEW",
    "askingPrice": 850.00,
    "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
  }'
```

### Test 5: Get ML Price Prediction

```bash
curl -X POST http://localhost:5001/predict-price \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Phones",
    "condition": "LIKE_NEW",
    "description_length": 100
  }'
```

Returns: `{ "predicted_price": <price>, "model_loaded": true }`

### Test 6: Browse Listings with Filters

```bash
curl "http://localhost:4000/api/listings?page=1&limit=10&minPrice=100&maxPrice=1000&search=iPhone"
```

---

## 📱 Mobile App Features to Test

1. **Auth Flow**
   - Register as SELLER
   - Sign in with credentials
   - View profile

2. **Browse Marketplace**
   - See all listings
   - Filter by price range
   - Search by title
   - Pagination (infinite scroll)

3. **Post Item (with ML Integration)**
   - Select category
   - Enter title and description
   - Choose condition
   - See AI-suggested price in real-time
   - Upload images
   - Publish listing

4. **Make Offers**
   - View listing details
   - Submit offer with price and message
   - Track sent offers

5. **Manage Offers (Seller)**
   - View received offers
   - Accept/reject offers

---

## 🗄️ Database

### Access PostgreSQL directly:

```bash
psql -U marketiq -d marketiq -h localhost
```

Password: `marketiq`

### View tables:

```sql
\dt  -- list tables
SELECT * FROM "User";
SELECT * FROM "Category";
SELECT * FROM "Listing";
SELECT * FROM "Offer";
```

---

## 📊 ML Model Metrics

Model trained on 20 samples with 80/20 train/test split:

- **MAE**: 102.53 (average error in price prediction)
- **RMSE**: 124.71 (root mean squared error)
- **R²**: -0.0904 (negative indicates small dataset; use production data for better accuracy)

### Improving Model Accuracy:

1. Collect more training data from actual listings
2. Engineer better features
3. Incorporate more variables (location, seller rating, etc.)
4. Tune hyperparameters

---

## 📝 Next Tasks

### Immediate (Validation)

- [ ] Run the expanded Postman collection
- [ ] Verify listing CRUD and browse filters end to end
- [ ] Verify offer creation and status updates end to end

### Follow-up (Polish)

- [ ] Cover remaining auth edge cases
- [ ] Add image upload workflow to Postman
- [ ] Improve search ranking/relevance

### Follow-up (Production)

- [ ] Wire deploy secrets for GHCR or your provider
- [ ] Publish the backend and ML images
- [ ] Point the mobile app to production API URLs

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 4000 is in use
lsof -i :4000
# Kill if needed
kill -9 <PID>

# Check database connection
cd server && npx prisma db execute --stdin < query.sql
```

### Mobile app won't connect to API

- Check `mobile/.env` has correct `EXPO_PUBLIC_API_URL`
- Verify backend is running on correct port
- Check firewall settings
- Use device IP instead of localhost on physical devices

### ML service not responding

```bash
# Verify model file exists
ls -la ml-service/model.pkl

# Test Flask directly
curl http://localhost:5001/health
```

---

## 📖 Documentation

- [ERD Diagram](docs/ERD.md) - Database relationships
- [Setup Complete](SETUP_COMPLETE.md) - Full setup details
- [Postman Collection](postman/MarketIQ.postman_collection.json) - API endpoints
