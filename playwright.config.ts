import { defineConfig, devices } from '@playwright/test'

// E2E_BASE_URL — перевірити вже запущений сайт (зібраний локально або робочий домен);
// без нього Playwright сам запускає dev-сервер на :3001 (CSP у dev вимкнений).
const externalBase = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: externalBase || 'http://localhost:3001',
    trace: 'on-first-retry',
    storageState: { cookies: [], origins: [] },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: externalBase ? undefined : {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
