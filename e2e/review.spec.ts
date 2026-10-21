import { expect, test } from '@playwright/test'
import { seedProgress } from './seed'

test('a due card can be reviewed on /review', async ({ page }) => {
  await seedProgress(page, { cards: { 'attention/c-0-1-next-word': { box: 1, due: '2000-01-01' } } })
  await page.goto('/review')
  await expect(page.getByText('Что делает языковая модель вроде ChatGPT на каждом шаге?')).toBeVisible()
  await page.getByRole('button', { name: 'Показать ответ' }).click()
  await page.getByRole('button', { name: 'Помню ✓' }).click()
  await page.getByRole('button', { name: 'Следующая карточка →' }).click()
  await expect(page.getByText(/На сегодня всё/)).toBeVisible()
})
