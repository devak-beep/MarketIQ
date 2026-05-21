import { defineConfig } from "vitest/config";
import "dotenv/config";

// Load test environment
import { config } from "dotenv";
config({ path: ".env.test", override: true });

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: false,
    setupFiles: ["./test/setup.js"],
    globalSetup: ["./test/global-setup.js"],
  },
});
