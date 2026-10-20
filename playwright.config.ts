import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run serve:out',
    url: 'http://localhost:3100',
    // Локально уже запущенный сервер на 3100 переиспользуется (и тогда тестируется его сборка); в CI — всегда свежая.
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // адрес сайта для sitemap/robots/Open Graph — тот, на котором сборку открывают тесты
    env: { NEXT_PUBLIC_SITE_URL: 'http://localhost:3100' },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // программный WebGL, чтобы 3D-сцены рисовались в headless-режиме
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
      },
    },
  ],
})
