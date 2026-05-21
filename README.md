# MarketIQ

Mobile-first marketplace for buying and selling used items with AI-assisted pricing.

## Tech Stack

- React Native (Expo)
- Node.js + Express
- PostgreSQL + Prisma
- Python + Flask + scikit-learn

## Project Structure

- `mobile/` - React Native app
- `server/` - Node REST API
- `ml-service/` - price prediction service
- `docs/` - architecture and ERD notes
- `postman/` - API collection

## Current Status

✅ **Complete: Project Setup & Database Design**

- Project folders created with all services scaffolded
- PostgreSQL database configured with 5 related tables
- Prisma schema validated and migrated successfully
- 10 marketplace categories seeded
- Backend Node.js/Express API initialized and tested
- React Native/Expo mobile app initialized and tested
- Flask ML service initialized and trained model generated
- All dependencies installed and verified

## Setup Overview

1. Configure PostgreSQL and set `DATABASE_URL`.
2. Install dependencies in `mobile/`, `server/`, and `ml-service/`.
3. Run Prisma migration from `server/`.
4. Start the Node API, Flask service, and mobile app.

## Quick Setup

1. Copy `.env.example` into the service-specific `.env` files.
2. Start PostgreSQL and create the `marketiq` database.
3. Run the Prisma seed script to create marketplace categories.
4. Train the ML model to generate `ml-service/model.pkl`.

## API Surface

- Authentication: register, login, current user
- Listings: CRUD, browse, search, filter, pagination
- Offers: create, sent, received, accept/reject
- Categories: list categories for the marketplace UI
- ML: `POST /predict-price`

## Next Milestones

- authentication
- listings CRUD
- offers system
- ML training and prediction API
- React Native integration

## Deployment

- Local container stack: [docker-compose.yml](docker-compose.yml)
- Production image stack: [docker-compose.prod.yml](docker-compose.prod.yml)
- Environment template: [.env.production.example](.env.production.example)
- Image publishing workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

## Notes

The ML service is scaffolded to accept a future trained model and can be trained from exported marketplace data.
