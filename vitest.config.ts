import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The app pins zod v3, but TanStack plugins pull zod v4 into the tree.
      // Pin the test runner to the app's v3 copy so `import { z } from "zod"`
      // resolves consistently (v4's entry breaks the named `z` export here).
      zod: path.resolve(__dirname, "./node_modules/zod"),
    },
  },
});
