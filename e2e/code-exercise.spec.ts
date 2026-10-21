import { expect, test, type Page } from '@playwright/test'
import { seedProgress } from './seed'

async function typeSolution(page: Page, code: string) {
  const exercise = page.locator('[data-exercise="dot"]')
  await exercise.scrollIntoViewIfNeeded()
  await exercise.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  // insertText вставляет текст целиком, без автозакрытия скобок CodeMirror
  await page.keyboard.insertText(code)
  await exercise.getByRole('button', { name: '▶ Запустить тесты' }).click()
  return exercise
}

test.beforeEach(async ({ page }) => {
  await seedProgress(page, { lessons: { 'attention/1.3': { status: 'completed', unlockedStep: 0 } } })
  await page.goto('/courses/attention/1-3-dot-product')
})

test('the dot exercise passes with a correct solution', async ({ page }) => {
  const exercise = await typeSolution(
    page,
    'function dot(a: number[], b: number[]): number {\n  let s = 0\n  for (let i = 0; i < a.length; i++) s += a[i] * b[i]\n  return s\n}\n',
  )
  await expect(exercise.getByText('5 из 5 тестов пройдено')).toBeVisible()
})

test('an infinite loop is stopped by the timeout', async ({ page }) => {
  const exercise = await typeSolution(page, 'function dot(a: number[], b: number[]): number {\n  while (true) {}\n}\n')
  await expect(exercise.getByText(/Похоже на бесконечный цикл/)).toBeVisible({ timeout: 10_000 })
})
