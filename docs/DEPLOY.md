**Deploy**

This document covers quick steps to containerize and deploy the backend (Node + Prisma), the ML microservice (Flask), and Postgres. It also lists environment variables needed for production deployments.

- Build locally with Docker Compose (useful for testing before cloud deploy):

```bash
# build images and start services
docker compose up --build -d

# run the production image stack (pulls images if SERVER_IMAGE/ML_IMAGE are set)
docker compose -f docker-compose.prod.yml up -d

# view logs
docker compose logs -f server
```

- Required environment variables (set in your host or provider secrets):
  - `DATABASE_URL` (e.g. postgresql://user:pass@host:5432/db)
  - `JWT_SECRET` and optional `JWT_REFRESH_SECRET`
  - `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
  - `ACCESS_TOKEN_EXPIRES` (optional, default 15m)
  - `REFRESH_TOKEN_EXPIRES` (optional, default 7d)

- Deploy options:
  - Render / Railway / Fly / Heroku: connect repo, set env vars in dashboard, configure a Dockerfile build for each service. Use managed Postgres (Neon, Supabase) for production DB.
  - Container registries: push built images to Docker Hub / GitHub Container Registry and deploy with your cloud provider.
  - GitHub Actions: the repo includes a deploy workflow that builds and pushes the backend and ML images to GitHub Container Registry on `main`.

Recommended production flow:

1. Push to `main` to build and publish images.
2. Copy [.env.production.example](../.env.production.example) and set real secrets.
3. Point `SERVER_IMAGE` and `ML_IMAGE` at the published registry tags.
4. Run [docker-compose.prod.yml](../docker-compose.prod.yml) on your host, or use the same image tags in your platform settings.

- After deploying, update the mobile app config (mobile/src/services/api.js and ml service URL) to point to the public URLs of the backend and ML service before building your APK.

Notes:

- Because Prisma needs migrations, run `npx prisma migrate deploy` on your deployed server before starting the app (or as part of your deploy step). If you changed the Prisma schema (e.g., added `refreshToken`), create a migration locally and apply it in production.

Security notes:

- For web clients we set the refresh token as an `HttpOnly` cookie (SameSite) to avoid exposing it to JavaScript. Do not store JWTs in localStorage.
- For native mobile clients (Expo/React Native) store the refresh token in secure device storage (e.g., `expo-secure-store` or Keychain) and keep the access token in memory only. The mobile app included in this repo uses `expo-secure-store` by default.
- Use short-lived access tokens and rotate refresh tokens on use (the server implements rotation and revocation).

Running tests:

```bash
cd server
npm install
npm test
```
