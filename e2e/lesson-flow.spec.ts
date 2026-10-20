import { expect, test } from '@playwright/test'

const READY = ['0-1-riddle', '0-2-journey-map', '1-1-vector', '1-2-vector-ops', '1-3-dot-product']

test('lesson 0.1 is walked step by step and remembers progress after reload', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/courses/attention/0-1-riddle')
  const step0 = page.locator('[data-step="0"]')
  await step0.getByRole('radio', { name: 'забор' }).click()
  await step0.getByRole('button', { name: 'Зафиксировать прогноз' }).click()
  await expect(step0.getByText('Конечно, забор')).toBeVisible()
  await step0.getByRole('button', { name: 'Дальше →' }).click()
  await expect(page.locator('[data-step="1"]')).toHaveAttribute('data-state', 'open')

  await page.reload()
  await expect(page.locator('[data-step="1"]')).toHaveAttribute('data-state', 'open')
  await expect(page.locator('[data-step="2"]')).toHaveAttribute('data-state', 'teaser')
  await page.waitForLoadState('networkidle')
  // В production-сборке React сообщает о рассинхроне гидратации минифицированными кодами (#418/#423/#425),
  // слова «hydrat» в них нет, поэтому проверяем отсутствие любых ошибок консоли и страницы
  expect(errors).toEqual([])
})

for (const slug of READY) {
  test(`${slug} renders without console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/courses/attention/${slug}`)
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForTimeout(500)
    expect(errors).toEqual([])
  })
}
