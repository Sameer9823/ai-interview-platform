import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run build && npm start -- -p 3100",
    url: "http://localhost:3100",
    timeout: 180_000,
    reuseExistingServer: true,
    env: { AUTH_SECRET: "e2e-secret-0123456789abcdef" },
  },
});
