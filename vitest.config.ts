import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "videos/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
  },
});
