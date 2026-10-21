import { expect, test } from '@playwright/test'
import { seedProgress } from './seed'

test('a 3D stage mounts a WebGL canvas when scrolled into view', async ({ page }) => {
  await seedProgress(page, { lessons: { 'attention/1.1': { status: 'completed', unlockedStep: 0 } } })
  await page.goto('/courses/attention/1-1-vector')
  const stage = page
    .locator('.observatory')
    .filter({ has: page.getByRole('textbox', { name: 'v, координата x' }) })
    .first()
  await stage.scrollIntoViewIfNeeded()
  await expect(stage.locator('canvas')).toBeVisible({ timeout: 15_000 })
  // OrbitControls ставит холсту touch-action: none — на телефоне вертикальный свайп должен листать страницу
  await expect(stage.locator('canvas')).toHaveCSS('touch-action', 'pan-y')
})
