import { defineConfig, devices } from "@playwright/test";

/** Dedicated port so we never attach to an unrelated local server (e.g. another Vite app on :3000). */
const PORT = process.env.PLAYWRIGHT_PORT || "4177";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          ...process.env,
          VITE_SUPABASE_URL:
            process.env.VITE_SUPABASE_URL ||
            process.env.SUPABASE_URL ||
            "https://placeholder.supabase.co",
          SUPABASE_URL:
            process.env.SUPABASE_URL ||
            process.env.VITE_SUPABASE_URL ||
            "https://placeholder.supabase.co",
          VITE_SUPABASE_ANON_KEY:
            process.env.VITE_SUPABASE_ANON_KEY || "ci-placeholder-anon-key",
          VITE_ALLOW_DEMO_AUTH: process.env.VITE_ALLOW_DEMO_AUTH || "true",
          ALLOW_DEMO_PERSIST: process.env.ALLOW_DEMO_PERSIST || "true",
        },
      },
});
