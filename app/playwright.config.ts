import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  reporter: "list",
  use: {
    channel: "msedge",
    baseURL: "http://localhost:3171",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3171",
    env: { NEXT_DIST_DIR: ".next/par/t71" },
    url: "http://localhost:3171/masuk",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
