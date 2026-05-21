import { exec } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

/**
 * Database setup/teardown utilities for integration tests
 */

// Set test database URL before importing anything that uses PrismaClient
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://marketiq:marketiq@localhost:5432/marketiq_test";

/**
 * Migrate test database (runs pending migrations)
 */
export async function migrateTestDb() {
  try {
    await execAsync("npx prisma migrate deploy", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
  } catch (error) {
    console.error("❌ DB migration error:", error);
    throw error;
  }
}

/**
 * Seed categories for testing
 */
export async function seedCategories() {
  try {
    return await prisma.category.createMany({
      data: [
        { name: "Electronics", slug: "electronics" },
        { name: "Furniture", slug: "furniture" },
        { name: "Books", slug: "books" },
      ],
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

/**
 * Clean all tables except categories (for test isolation)
 */
export async function cleanDb() {
  try {
    // Don't truncate categories - we need them for tests
    const tables = ["Offer", "ListingImage", "Listing", "User"];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
  } catch (error) {
    if (!error.message.includes("does not exist")) {
      console.error("❌ Clean DB error:", error);
      throw error;
    }
  }
}

/**
 * Global test setup (runs once before all tests)
 */
export async function setupTestDb() {
  console.log("🔧 Setting up test database...");
  try {
    await migrateTestDb();
    await seedCategories();
    console.log("✓ Test DB ready");
  } catch (error) {
    console.error("Failed to set up test DB:", error);
    process.exit(1);
  }
}

/**
 * Global test teardown (runs once after all tests)
 */
export async function teardownTestDb() {
  try {
    await cleanDb();
    await prisma.$disconnect();
    console.log("✓ Test DB cleaned up");
  } catch (error) {
    console.error("Teardown error:", error);
  }
}

export { prisma };
