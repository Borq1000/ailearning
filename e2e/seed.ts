import type { Page } from '@playwright/test'

/** Записывает прогресс в localStorage до загрузки страницы (выполняется при каждой навигации). */
export async function seedProgress(page: Page, state: Record<string, unknown>): Promise<void> {
  await page.addInitScript((data) => {
    window.localStorage.setItem(
      'ailearning:v1',
      JSON.stringify({
        version: 2,
        state: { version: 2, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {}, ...data },
      }),
    )
  }, state)
}
