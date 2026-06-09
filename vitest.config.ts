import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Surface .env / .env.local to process.env so DB-backed tests (lib/db.test.ts)
    // can read Supabase credentials. "" = load all vars, not just VITE_*.
    env: loadEnv(mode, process.cwd(), ""),
    // Only *.test.* are unit tests. Playwright specs (e2e/**/*.spec.ts) are
    // excluded so `pnpm test` and `pnpm e2e` stay independent.
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e", "playwright-report"],
    coverage: {
      provider: "v8",
      // CLAUDE.md requires 100% coverage on these pure modules once they exist.
      include: ["lib/scoring.ts", "lib/tournament.ts"],
    },
  },
}));
