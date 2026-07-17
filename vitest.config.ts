import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Look for tests inside the top-level tests/ folder, mirroring src/ structure
    include: ["tests/**/*.{test,spec}.ts"],
  },
});
