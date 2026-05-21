import { setupTestDb, teardownTestDb } from "./db-setup.js";

// Global setup: runs once before all tests
export async function setup() {
  await setupTestDb();
  return async () => {
    // Global teardown: runs once after all tests
    await teardownTestDb();
  };
}
