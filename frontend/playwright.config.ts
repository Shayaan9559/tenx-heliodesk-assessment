import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT || 5063);
const python = process.env.E2E_PYTHON || '../.venv/bin/python';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `"${python}" ../backend/e2e_server.py`,
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
