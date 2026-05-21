# Testing Guide

This project uses **Vitest** for unit and integration testing with Supertest for HTTP assertions.

## Test Types

### Unit Tests (Mocked)

- **Location**: `test/*.unit.test.js`
- **Purpose**: Fast, isolated tests with mocked dependencies
- **Example**: `test/auth.unit.test.js` - tests with mocked Prisma and JWT
- **Speed**: <100ms per test
- Use these for testing business logic in isolation

### Integration Tests (Real DB)

- **Location**: `test/*.integration.test.js`
- **Purpose**: End-to-end tests using real PostgreSQL test database
- **Examples**:
  - `test/auth.integration.test.js` - real JWT creation, token rotation
  - `test/listings.integration.test.js` - full CRUD flow with DB
  - `test/offers.integration.test.js` - offer workflow with constraints
- **Speed**: 100-500ms per test
- Use these to verify actual behavior with real data

## Running Tests

```bash
# Run all tests once (CI mode)
npm test

# Run tests in watch mode (auto-rerun on save)
npm run test:watch

# Run tests with UI dashboard
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run specific test file
npx vitest test/auth.integration.test.js

# Run tests matching pattern
npx vitest --grep "refresh token"
```

## Setup

### Prerequisites

- PostgreSQL 15+ running locally
- Node 18+

### Environment

Tests use `.env.test` which configures:

- `DATABASE_URL=postgresql://marketiq:marketiq@localhost:5432/marketiq_test`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (test values)
- Test database migrations are auto-run before tests

### First Time Setup

1. Ensure PostgreSQL is running:

   ```bash
   sudo systemctl start postgresql
   ```

2. Create test database (manual, one-time):

   ```bash
   sudo -u postgres createdb marketiq_test -O marketiq
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Writing New Integration Tests

### Pattern: Create Test User + Test Data + Assert

```javascript
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanDb, prisma } from "./db-setup.js";
import app from "../src/app.js";

beforeEach(async () => {
  await cleanDb(); // Isolate each test
});

describe("MyFeature", () => {
  it("does the thing", async () => {
    // 1. Create test user
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "SecurePass123!",
    });
    const token = res.body.accessToken;

    // 2. Test the feature
    const featureRes = await request(app)
      .post("/api/feature")
      .set("Authorization", `Bearer ${token}`)
      .send({ data: "test" });

    // 3. Assert
    expect(featureRes.status).toBe(201);
    expect(featureRes.body.id).toBeDefined();
  });
});
```

## CI/CD

GitHub Actions runs tests on every:

- Push to `main` or `develop`
- Pull request against `main` or `develop`

**Workflow**: `.github/workflows/test.yml`

The CI spins up a PostgreSQL service, runs migrations, and executes all tests. If tests pass and branch is `main`, Docker images are built.

## Best Practices

1. **Use `beforeEach(cleanDb)`** in integration tests to ensure test isolation
2. **Test both happy and sad paths** (success + error cases)
3. **Name tests descriptively**: "seller can create listing" not "test 1"
4. **Use test helpers** like `createTestUser()` to avoid repetition
5. **Avoid mocking in integration tests** - use real DB to catch bugs
6. **Keep unit tests for algorithmic/math logic**, integration tests for API flows
7. **Test edge cases**: constraints (unique offers per buyer), permissions (can't edit others' listings), etc.

## Debugging

### Run a single test

```bash
npx vitest test/auth.integration.test.js
```

### Run tests matching a pattern

```bash
npx vitest --grep "refresh"
```

### View logs during test

Tests automatically log to stdout. Add `console.log()` in tests or model code.

### Check test database manually

```bash
psql -U marketiq -d marketiq_test

# List tables
\dt

# Check users
SELECT * FROM "User";
```

### Check migrations

```bash
npx prisma migrate status
```
