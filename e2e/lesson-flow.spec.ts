import { expect, test } from '@playwright/test'

const READY = ['0-1-riddle', '0-2-journey-map', '1-1-vector', '1-2-vector-ops', '1-3-dot-product', '1-4-matrix', '1-5-matmul', '1-6-softmax', '1-p-practice']

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

test('clickable controls show the hand cursor and disabled ones do not', async ({ page }) => {
  await page.goto('/courses/attention/0-1-riddle')
  const step0 = page.locator('[data-step="0"]')
  const option = step0.getByRole('radio', { name: 'забор' })
  const commit = step0.getByRole('button', { name: 'Зафиксировать прогноз' })
  await expect(option).toHaveCSS('cursor', 'pointer')
  await expect(commit).toBeDisabled()
  await expect(commit).not.toHaveCSS('cursor', 'pointer')
  await option.click()
  await expect(commit).toHaveCSS('cursor', 'pointer')
})

test('two open tabs of a lesson do not overwrite each other’s progress', async ({ context }) => {
  const url = '/courses/attention/0-1-riddle'
  const b = await context.newPage()
  await b.goto(url)
  // вкладка B загрузила (пустой) прогресс: второй шаг стал тизером
  await expect(b.locator('[data-step="1"]')).toHaveAttribute('data-state', 'teaser')

  const a = await context.newPage()
  await a.goto(url)
  const step0 = a.locator('[data-step="0"]')
  await step0.getByRole('radio', { name: 'забор' }).click()
  await step0.getByRole('button', { name: 'Зафиксировать прогноз' }).click()
  await step0.getByRole('button', { name: 'Дальше →' }).click()
  await expect(a.locator('[data-step="1"]')).toHaveAttribute('data-state', 'open')

  // B видит прогресс A без перезагрузки…
  await expect(b.locator('[data-step="1"]')).toHaveAttribute('data-state', 'open')
  // …и не затирает его своим старым состоянием
  await b.reload()
  await expect(b.locator('[data-step="1"]')).toHaveAttribute('data-state', 'open')
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

test('lesson 0.1 can be completed end to end and stays completed after reload', async ({ page }) => {
  await page.goto('/courses/attention/0-1-riddle')
  const step = (i: number) => page.locator(`[data-step="${i}"]`)

  await step(0).getByRole('radio', { name: 'забор' }).click()
  await step(0).getByRole('button', { name: 'Зафиксировать прогноз' }).click()
  await step(0).getByRole('button', { name: 'Дальше →' }).click()

  await step(1).getByRole('radio', { name: 'кот' }).click()
  await step(1).getByRole('button', { name: 'Зафиксировать прогноз' }).click()
  await step(1).getByRole('button', { name: 'Дальше →' }).click()

  await step(2).getByRole('radio', { name: '«Кот» и «забор» — оба мужского рода' }).click()
  await step(2).getByRole('button', { name: 'Проверить' }).click()
  await step(2).getByRole('button', { name: 'Дальше →' }).click()

  await step(3).getByRole('radio', { name: /Самая толстая дуга переезжает/ }).click()
  await step(3).getByRole('button', { name: 'Проверить' }).click()
  await step(3).getByRole('button', { name: 'Дальше →' }).click()

  await step(4).getByRole('group', { name: 'Варианты для «Я пью горячий…»' }).getByRole('button', { name: 'чай' }).click()
  await step(4).getByRole('group', { name: 'Варианты для «Он открыл…»' }).getByRole('button', { name: 'дверь' }).click()
  await step(4)
    .getByRole('group', { name: 'Варианты для «В комнате было душно, и он открыл…»' })
    .getByRole('button', { name: 'окно' })
    .click()
  await step(4).getByRole('button', { name: 'Дальше →' }).click()

  await step(5)
    .getByRole('textbox', { name: 'Твоё объяснение' })
    .fill('Грамматика не помогает: оба слова мужского рода, решает смысл последнего слова.')
  await step(5).getByRole('button', { name: 'Сравнить с эталоном' }).click()
  await step(5).getByRole('button', { name: 'Готово, я сравнил' }).click()
  await step(5).getByRole('button', { name: 'Дальше →' }).click()

  await step(6).getByRole('button', { name: 'Завершить урок ✓' }).click()
  await expect(page.getByText(/Урок пройден/)).toBeVisible()
  await expect(step(6).getByText(/3 карточки добавлены/)).toBeVisible()

  await page.reload()
  await expect(page.getByText(/Урок пройден/)).toBeVisible()
  for (const i of [0, 1, 2, 3, 4, 5, 6]) await expect(step(i)).toHaveAttribute('data-state', 'open')
  // карточки урока встали в очередь под курсом
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ailearning:v2')!))
  expect(stored.version).toBe(2)
  expect(Object.keys(stored.state.cards)).toEqual(expect.arrayContaining(['attention/c-0-1-next-word']))
})

test('progress of the previous site version is carried over once and its key is left untouched', async ({ page }) => {
  const legacy = JSON.stringify({
    version: 1,
    state: { version: 1, lessons: { '0.1': { status: 'completed', unlockedStep: 6 } }, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {} },
  })
  // только перед первой загрузкой: после неё старый ключ пишет лишь вкладка старой версии
  await page.goto('/')
  await page.evaluate((value) => localStorage.setItem('ailearning:v1', value), legacy)

  await page.goto('/courses/attention/0-1-riddle')
  await expect(page.getByText(/Урок пройден/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/Урок пройден/)).toBeVisible()

  const keys = await page.evaluate(() => ({
    legacy: localStorage.getItem('ailearning:v1'),
    marker: localStorage.getItem('ailearning:v1-imported'),
    current: localStorage.getItem('ailearning:v2'),
  }))
  expect(keys.legacy).toBe(legacy)
  expect(keys.marker).toBe('1')
  expect(keys.current).not.toBeNull()
})
