import { defineConfig, devices } from '@playwright/test'

// E2E_BASE_URL — перевірити вже запущений сайт (зібраний локально або робочий домен);
// без нього Playwright сам запускає dev-сервер на :3001 (CSP у dev вимкнений).
const externalBase = process.env.E2E_BASE_URL

const FARMER_FARM_SUITES = /(farm|planting|deal|inventory|harvest)-flow\.spec\.ts|team-access\.spec\.ts|inventory-ui\.spec\.ts|harvest-outlook\.spec\.ts/
// Створюють і видаляють співпрацю між тими самими фермером і агрономом — паралельно один одному заважали
const AGREEMENT_SUITES = /(agreement|chat|agronomist)-flow\.spec\.ts|agronomist-week\.spec\.ts|inspection\.spec\.ts/

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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: [FARMER_FARM_SUITES, AGREEMENT_SUITES] },
    // Ці набори створюють і видаляють поля одного й того самого акаунта фермера. Паралельно вони заважали
    // один одному (ліміт гектарів, поле, видалене посеред завантаження сторінки), тому йдуть по черзі.
    { name: 'farmer-farms', use: { ...devices['Desktop Chrome'] }, testMatch: FARMER_FARM_SUITES, workers: 1 },
    { name: 'agreements', use: { ...devices['Desktop Chrome'] }, testMatch: AGREEMENT_SUITES, workers: 1 },
  ],
  webServer: externalBase ? undefined : {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
