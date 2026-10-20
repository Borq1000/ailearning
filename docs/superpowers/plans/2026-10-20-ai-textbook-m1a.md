# Учебник ИИ — веха M1a: платформа + уроки 0.1–1.3 — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать работающий интерактивный учебник: платформа (движок уроков, «ворота», прогресс, интервальное повторение, 3D-сцены, упражнения с кодом) и первые пять уроков курса «Внимание и трансформеры» (0.1, 0.2, 1.1, 1.2, 1.3).

**Architecture:** Next.js 16 App Router со статическим экспортом. Урок — MDX-файл. Локальный remark-плагин режет урок по `---` на шаги `<LessonStep>`, интерактивные компоненты подключаются через `mdx-components.tsx`. Прогресс хранится в zustand + localStorage. 3D-сцены на React Three Fiber загружаются лениво внутри «окон-обсерваторий». Код ученика транспилируется sucrase и выполняется в Web Worker.

**Tech Stack:** Next.js 16.4 · React 19 · TypeScript · Tailwind CSS 4 · @next/mdx (Turbopack) · remark-math + rehype-katex · three 0.186 + @react-three/fiber 9 + @react-three/drei 10 · CodeMirror 6 · sucrase · zustand 5 · Vitest 5 + Testing Library · Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-ai-textbook-design.md`

**Объём этого плана.** Спецификация называет вехой M1 уроки 0.1–1.P. Этот план покрывает её первую половину (**M1a**): всю платформу + уроки 0.1, 0.2, 1.1, 1.2, 1.3. Уроки 1.4, 1.5, 1.6, 1.P (`MatrixTransform3D`, `SoftmaxBars`, упражнения `matVec`, `matMul`, `softmax`) пойдут отдельным планом **M1b** поверх готовой платформы.

**Отклонения от спецификации (осознанные):**
- Название и длительность урока хранятся только в манифесте `course.ts`, а MDX экспортирует `metadata = { description, objectives }`. Так не дублируются данные.
- Цвет второстепенного текста — `#6f6758` вместо `#8a8273`: у `#8a8273` на фоне `#f6f3ec` контраст 3.6:1, это ниже WCAG AA (4.5:1) и не позволяет выполнить требование Accessibility ≥ 90 из §1.
- Упражнение «поставь вектор» из §10 реализовано компонентом `<VectorTask>` (это «ворота» спецификации типа Exercise).
- `<ExplainBack>` проходится кнопкой «Готово, я сравнил» после показа эталона. Чек-лист пунктов служит для самопроверки и не блокирует.
- `motion` не подключаем: в M1a хватает CSS-переходов (YAGNI).
- Урок режется на шаги **remark-плагином**, а не серверным `wrapper` из §5.3. MDX передаёт в `wrapper` один элемент `_createMdxContent`, а не список блоков, так что резать там нечего. Плагин делает ту же работу на этапе компиляции, а автор урока по-прежнему просто пишет `---`.
- Код ученика сохраняется при каждой правке, без задержки из §5.5: запись в localStorage дешёвая, а потерять последние символы при закрытии вкладки хуже.

## Global Constraints

- Node ≥ 22; npm. Версии: next 16.4.x, react 19.x, @react-three/fiber 9.x, @react-three/drei 10.x, three 0.186.x, tailwindcss 4.x, zustand 5.x, vitest 5.x, @playwright/test 1.6x.
- Весь текст интерфейса и уроков — на русском; `<html lang="ru">`.
- Никаких API routes, middleware, server actions: сборка — `output: 'export'`.
- Turbopack: remark/rehype-плагины в `next.config.ts` указываются **строками**; локальный плагин — путь `./lib/mdx/remark-steps.mjs`.
- MDX-уроки ничего не импортируют: все компоненты — из `mdx-components.tsx`.
- Все «ворота» — DOM-элементы (кнопки и поля), а не объекты внутри canvas. Урок проходим без WebGL.
- Цвета: бумага `#f6f3ec`, текст `#22201c`, второстепенный `#6f6758`, линии `#e2dccf`; обсерватория — градиент `#1b2550 → #0a0e1f`; цвета понятий: query/a — `#22d3ee` (на бумаге `#0e7490`), key/b — `#fb923c` (на бумаге `#c2410c`), value — `#a78bfa` (на бумаге `#6d28d9`), result — `#a3e635` (на бумаге `#3f6212`).
- Шрифты через `next/font/google` с кириллицей: Literata (заголовки), IBM Plex Sans (текст), JetBrains Mono (код, подписи).
- Числа в интерфейсе выводятся с точкой (`0.5`), поля ввода принимают и точку, и запятую, и минус `−` (U+2212).
- Ключи хранилища: `ailearning:v1`, резервная копия `ailearning:backup`. Версия схемы прогресса — `1`.
- Интервалы повторения (коробки Лейтнера 1–5): 1 / 3 / 7 / 16 / 35 дней.
- Таймаут исполнения кода ученика — 2000 мс.
- Обязательный состав урока типа `lesson`: ≥1 `<Predict>`, ≥2 `<Check>`, ровно 1 `<Summary>`, ровно 1 `<Recall>` (кроме самого первого урока курса — там 0).
- Lighthouse (десктоп, страница урока): Performance ≥ 85, SEO ≥ 95, Accessibility ≥ 90.
- Каждая задача заканчивается коммитом; в конце сообщения коммита строка `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Десятичная запятая и «типографский» минус в ответах** (`0,5`, ` 2 `, `−4`): ученик из России вводит именно так, и ответ должен засчитываться как `0.5`, `2`, `−4`. Тесты — в Task 9 (`parseNumber`, `Check`) и Task 11 (`Faded`).
2. **Код ученика, который мутирует входные массивы, возвращает не тот тип или бросает исключение:** проваливается конкретный тест, остальные выполняются, приложение не падает. Тесты — в Task 15 (`executeExercise`, `approxEqual`).
3. **Повреждённый или устаревший прогресс в localStorage** (битый JSON, чужая версия, id несуществующих уроков): приложение не падает, данные копируются в `ailearning:backup`, неизвестные id игнорируются. Тесты — в Task 5 (store) и Task 16 (`CourseNav`).
4. **Прямой заход по ссылке на поздний урок без пройденных предыдущих:** урок работает, разминка `<Recall>` не ломается, если карточек ещё нет. Тесты — в Task 10 (`Recall`).
5. **Перезагрузка посреди урока:** открыты те же шаги, без ошибок гидратации в консоли. Тест — в Task 20 (e2e).

## Карта файлов

```
app/
  layout.tsx · page.tsx · globals.css · not-found.tsx · sitemap.ts · robots.ts
  courses/[course]/page.tsx              # карта курса
  courses/[course]/[lesson]/page.tsx     # урок
  review/page.tsx · glossary/page.tsx
mdx-components.tsx                       # реестр компонентов для MDX
next.config.ts · vitest.config.mts · vitest.setup.ts · playwright.config.ts
lib/
  site.ts · parse-number.ts · plural.ts · webgl.ts
  math/      vec.ts · mat.ts · softmax.ts · attention.ts · index.ts
  course/    types.ts · registry.ts · lesson-module.ts
  progress/  types.ts · scheduler.ts · storage.ts · migrate.ts · store.ts · useHydrated.ts
  react/     use-isomorphic-layout-effect.ts
  mdx/       remark-steps.mjs · remark-steps.d.mts
  theme/     concepts.ts
  viz/       vector-helpers.ts
  code/      types.ts · approx-equal.ts · execute.ts
components/                        # компоненты разложены по доменам; между доменами — импорты через @/components/…
  progress/          ProgressHydrator.tsx                                   # загрузка прогресса
  lesson/                                                                   # урок
    engine/          LessonContext.tsx · StepContext.ts · useGate.ts · LessonStep.tsx
                     LessonStatusBadge.tsx · LessonPager.tsx                # движок шагов и «ворот»
    gates/           Check.tsx · Predict.tsx · ExplainBack.tsx · Faded.tsx
                     Recall.tsx · NextWordGame.tsx                          # вопросы, закрывающие шаг
    blocks/          Hook.tsx · WorkedExample.tsx · Levels.tsx · Term.tsx
                     Sidenote.tsx · C.tsx · Summary.tsx                     # контентные блоки
  review/            CardView.tsx · ReviewDeck.tsx                          # карточки и интервальное повторение
  course/            CourseMap.tsx · CourseNav.tsx · ContinueButton.tsx · CourseCard.tsx   # навигация по курсу
  viz/                                                                      # визуализации
    stage/           Observatory.tsx · stage-context.ts · InfoCard.tsx · SceneCanvas.tsx
                     Stage.tsx · StageFallbackNote.tsx                      # «обсерватория» и 3D-сцена
    vectors/         VectorScene.tsx · LazyVectorScene.tsx · VectorInputs.tsx · VectorSpace3D.tsx
                     VectorTask.tsx · VectorOps3D.tsx · DotProduct3D.tsx
                     three/ Arrow3D.tsx · Axes3D.tsx · DragHandle.tsx       # векторы в 3D
    attention/       AttentionArcs.tsx                                      # внимание
    words/           WordCloud3D.tsx · WordCloudScene.tsx                   # облако слов
  code/              CodeEditor.tsx · useRunner.ts · runner.worker.ts · CodeExercise.tsx   # упражнения с кодом
  layout/            TopBar.tsx · ReviewBadge.tsx · StorageBanner.tsx       # каркас страницы
content/
  glossary.ts · content.test.ts
  home/word-cloud.ts
  attention/ course.ts · toy-model.ts
             exercises/ dot.ts · index.ts
             lessons/ 0-1-riddle.mdx · 0-2-journey-map.mdx · 1-1-vector.mdx · 1-2-vector-ops.mdx · 1-3-dot-product.mdx
e2e/         lesson-flow.spec.ts · code-exercise.spec.ts · stage.spec.ts · review.spec.ts · seed.ts
```

Юнит-тесты лежат рядом с кодом (`*.test.ts(x)`), e2e — в `e2e/*.spec.ts`.

**🧑‍🎓 Вклад ученика.** Две задачи содержат шаг «вклад ученика»: Task 4 (`pickRecallCards`) и Task 15 (`approxEqual`). На этом шаге исполнитель **останавливается**, готовит файл с сигнатурой и тестами и просит пользователя написать 5–10 строк. Если пользователь откажется, исполнитель вставляет эталонную реализацию, приведённую в шаге.

---

### Task 1: Каркас проекта, дизайн-система, тестовая среда

**Files:**
- Create (через create-next-app): `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/*`
- Create: `vitest.config.mts`, `vitest.setup.ts`, `lib/site.ts`, `lib/site.test.ts`, `mdx-components.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`

**Interfaces:**
- Produces: `SITE: { name: string; description: string; url: string }` из `lib/site.ts`; CSS-классы дизайн-системы (`prose-lesson`, `gate-card`, `option-btn`, `btn-primary`, `btn-ghost`, `feedback-right`, `feedback-wrong`, `text-input`, `text-area`, `hook`, `summary-card`, `recall-card`, `worked`, `worked-step`, `levels*`, `term`, `term-popover`, `concept`, `sidenote`, `observatory*`, `stage-*`, `readout`, `info-card`, `axis-label`, `vector-label`, `code-editor`, `lesson-step`, `step-footer`, `lock-pill`, `breakout`); цветовые утилиты Tailwind из `@theme` (`bg-paper`, `text-ink`, `text-muted`, `border-line`, `text-ink-cyan`, `bg-glow-cyan` и т. д.).

- [ ] **Step 1: Сгенерировать Next.js во временную папку и перенести в корень**

create-next-app не работает в непустой папке (здесь уже есть `docs/`, `.superpowers/`, `.git`), поэтому генерируем рядом и переносим.

```bash
cd "C:/Users/Boris/Desktop/projects-p/ailearning"
npx --yes create-next-app@16.4.2 scaffold-tmp --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --yes
rm -f scaffold-tmp/.gitignore scaffold-tmp/README.md
cp -r scaffold-tmp/. ./
rm -rf scaffold-tmp
npm pkg set name=ailearning
```

Если create-next-app отвергнет какой-то флаг, повторить команду без него. `--yes` подставит значения по умолчанию.

- [ ] **Step 2: Установить зависимости**

```bash
npm install
npm install @next/mdx@16.4.2 @mdx-js/loader @mdx-js/react @types/mdx remark-gfm remark-math rehype-katex katex three @react-three/fiber @react-three/drei zustand sucrase codemirror @codemirror/view @codemirror/state @codemirror/lang-javascript @codemirror/theme-one-dark
npm install -D @types/three vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @testing-library/dom @mdx-js/mdx @playwright/test serve
npm pkg set scripts.test="vitest run" scripts.test:watch="vitest" scripts.typecheck="tsc --noEmit" scripts.e2e="playwright test" scripts.serve:out="serve out -l 3100"
```

- [ ] **Step 3: Написать падающий тест конфигурации сайта**

`lib/site.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { SITE } from './site'

describe('SITE', () => {
  it('has a Russian name and an absolute base URL', () => {
    expect(SITE.name).toBe('Учебник ИИ')
    expect(SITE.url).toMatch(/^https?:\/\//)
    expect(SITE.description.length).toBeGreaterThan(20)
  })
})
```

- [ ] **Step 4: Настроить Vitest**

`vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) }],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'out/**', 'e2e/**'],
  },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  class IntersectionObserverStub {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: number[] = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver

  // jsdom не умеет WebGL: getContext всегда возвращает null (без шума в консоли)
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
}
```

- [ ] **Step 5: Запустить тест и убедиться, что он падает**

Run: `npm test -- lib/site.test.ts`
Expected: FAIL — `Failed to resolve import "./site"`.

- [ ] **Step 6: Создать `lib/site.ts`**

```ts
export const SITE = {
  name: 'Учебник ИИ',
  description:
    'Интерактивный учебник: от векторов до статьи «Attention Is All You Need» — с 3D-сценами, задачами и кодом.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const
```

- [ ] **Step 7: Запустить тест**

Run: `npm test -- lib/site.test.ts`
Expected: PASS (1 test).

- [ ] **Step 8: Дизайн-система в `app/globals.css`** (полностью заменить файл)

```css
@import "tailwindcss";

@theme {
  --color-paper: #f6f3ec;
  --color-paper-deep: #eee8da;
  --color-card: #fffdf7;
  --color-ink: #22201c;
  --color-ink-soft: #4a453c;
  --color-muted: #6f6758;
  --color-line: #e2dccf;
  --color-space: #0a0e1f;
  --color-space-glow: #1b2550;
  --color-space-text: #dbe6ff;
  --color-space-muted: #7c8db5;
  --color-glow-cyan: #22d3ee;
  --color-glow-orange: #fb923c;
  --color-glow-violet: #a78bfa;
  --color-glow-lime: #a3e635;
  --color-ink-cyan: #0e7490;
  --color-ink-orange: #c2410c;
  --color-ink-violet: #6d28d9;
  --color-ink-lime: #3f6212;
  --color-success: #15803d;
  --color-success-bg: #ecfdf3;
  --color-error: #be123c;
  --color-error-bg: #fff1f2;
  --font-serif: var(--font-literata), Georgia, serif;
  --font-sans: var(--font-plex), system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;
}

@layer base {
  html {
    background: var(--color-paper);
    color: var(--color-ink);
    scroll-padding-top: 5rem;
  }
  body {
    font-family: var(--font-sans);
  }
  ::selection {
    background: #22d3ee55;
  }
}

@layer components {
  /* ── текст урока ─────────────────────────────── */
  .prose-lesson {
    font-size: 1.0625rem;
    line-height: 1.75;
  }
  .prose-lesson h2 {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    line-height: 1.25;
    margin: 2.5rem 0 1rem;
  }
  .prose-lesson h3 {
    font-family: var(--font-serif);
    font-size: 1.3rem;
    margin: 2rem 0 0.75rem;
  }
  .prose-lesson p {
    margin: 1rem 0;
  }
  .prose-lesson ul,
  .prose-lesson ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }
  .prose-lesson ul {
    list-style: disc;
  }
  .prose-lesson ol {
    list-style: decimal;
  }
  .prose-lesson li {
    margin: 0.35rem 0;
  }
  .prose-lesson strong {
    font-weight: 600;
  }
  .prose-lesson blockquote {
    margin: 1.25rem 0;
    padding: 0.75rem 1.25rem;
    border-left: 3px solid var(--color-glow-cyan);
    border-radius: 0 8px 8px 0;
    background: var(--color-paper-deep);
    font-family: var(--font-serif);
    font-size: 1.15rem;
  }
  .prose-lesson code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--color-paper-deep);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  .prose-lesson .katex-display {
    margin: 1.5rem 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  /* ── шаги урока ──────────────────────────────── */
  .lesson-step + .lesson-step {
    @apply mt-14 border-t border-dashed border-line pt-14;
  }
  .step-footer {
    @apply mt-10 flex flex-wrap items-center gap-4;
  }
  .lock-pill {
    @apply absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm whitespace-nowrap text-paper shadow-lg;
  }

  /* ── «ворота» и кнопки ───────────────────────── */
  .gate-card {
    @apply my-8 rounded-xl border-[1.5px] border-ink bg-card p-5 shadow-[4px_4px_0_0_var(--color-ink)];
  }
  .gate-card[data-passed='true'] {
    @apply border-success shadow-[4px_4px_0_0_var(--color-success)];
  }
  .gate-label {
    @apply text-[11px] font-semibold tracking-[0.14em] text-muted uppercase;
  }
  .gate-question {
    @apply mt-1 font-serif text-lg leading-snug;
  }
  .option-btn {
    @apply w-full rounded-lg border border-line bg-white px-4 py-2.5 text-left transition hover:border-ink disabled:cursor-default;
  }
  .option-btn[data-selected='true'] {
    @apply border-ink bg-paper-deep;
  }
  .option-btn[data-right='true'] {
    @apply border-success bg-success-bg;
  }
  .btn-primary {
    @apply inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40;
  }
  .btn-ghost {
    @apply inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-ink hover:text-ink;
  }
  .feedback-right {
    @apply mt-3 rounded-lg bg-success-bg px-4 py-3 text-sm text-success;
  }
  .feedback-wrong {
    @apply mt-3 rounded-lg bg-error-bg px-4 py-3 text-sm text-error;
  }
  .text-input {
    @apply mt-3 w-40 rounded-lg border border-line bg-white px-3 py-2 font-mono focus:border-ink focus:outline-none;
  }
  .text-area {
    @apply mt-3 w-full rounded-lg border border-line bg-white p-3 text-[15px] leading-relaxed focus:border-ink focus:outline-none;
  }

  /* ── блоки контента ──────────────────────────── */
  .hook {
    @apply my-6 rounded-xl bg-paper-deep px-6 py-5;
  }
  .summary-card {
    @apply my-6 rounded-xl border border-line bg-card p-6;
  }
  .recall-card {
    @apply rounded-lg border border-line bg-white p-4;
  }
  .worked {
    @apply my-8 rounded-xl border border-line bg-card p-5;
  }
  .worked-step {
    @apply border-l-2 border-glow-cyan pl-4;
  }
  .levels {
    @apply my-6 rounded-xl border border-line bg-card;
  }
  .levels-tabs {
    @apply flex gap-1 border-b border-line p-1.5;
  }
  .levels-tab {
    @apply rounded-md px-3 py-1.5 text-sm text-ink-soft transition hover:text-ink;
  }
  .levels-tab[aria-selected='true'] {
    @apply bg-ink text-paper;
  }
  .levels-panel {
    @apply px-5 py-1;
  }
  .term {
    @apply cursor-help border-b border-dotted border-ink-soft;
    font: inherit;
    color: inherit;
  }
  .term-popover {
    @apply absolute top-full left-0 z-20 mt-2 block w-72 rounded-lg border border-line bg-white p-4 text-left font-sans text-ink shadow-xl;
    line-height: 1.5;
  }
  .concept {
    @apply border-b-2 font-semibold;
  }
  .sidenote {
    @apply my-4 block border-l-2 border-line pl-3 text-sm leading-relaxed text-muted italic;
  }

  /* ── обсерватория (3D/SVG-окна) ──────────────── */
  .observatory-figure {
    @apply my-8;
  }
  .observatory {
    @apply relative overflow-hidden rounded-2xl text-space-text;
    background: radial-gradient(ellipse at 60% 0%, var(--color-space-glow) 0%, var(--color-space) 70%);
    box-shadow: 0 18px 40px -18px #0a0e1fcc;
  }
  .observatory-hint {
    @apply pointer-events-none absolute top-2.5 right-3 z-10 font-mono text-[11px] text-space-muted;
  }
  .observatory-footer {
    @apply border-t border-white/10 px-4 py-3 text-sm;
  }
  .stage-chip {
    @apply rounded-full border border-white/20 px-3 py-1 font-mono text-xs text-space-text transition hover:border-glow-cyan;
  }
  .stage-chip[data-active='true'] {
    @apply border-glow-cyan bg-glow-cyan/15 text-glow-cyan;
  }
  .stage-fallback {
    @apply flex h-full flex-col justify-center gap-3 p-6 text-sm text-space-muted;
  }
  .stage-input {
    @apply w-14 rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-center font-mono text-space-text focus:border-glow-cyan focus:outline-none;
  }
  .readout {
    @apply mt-2 font-mono text-[13px] text-space-text;
  }
  .info-card {
    @apply absolute top-9 right-3 z-20 w-64 rounded-lg border border-white/15 bg-[#0d1330f2] p-3 shadow-2xl;
  }
  .axis-label {
    @apply pointer-events-none font-mono text-[11px] text-space-muted select-none;
  }
  .vector-label {
    @apply pointer-events-none font-mono text-xs font-semibold whitespace-nowrap select-none;
  }
  .code-editor {
    @apply overflow-hidden rounded-lg border border-white/10 text-[13px];
  }
  .code-editor .cm-editor {
    max-height: 420px;
  }
}

@media (min-width: 1280px) {
  .prose-lesson .sidenote {
    float: right;
    clear: right;
    width: 200px;
    margin: 0.25rem -230px 1rem 1.5rem;
  }
  .prose-lesson .breakout {
    width: calc(100% + 220px);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 9: Корневой layout со шрифтами и KaTeX** (полностью заменить `app/layout.tsx`)

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono, Literata } from 'next/font/google'
import 'katex/dist/katex.min.css'
import './globals.css'
import { SITE } from '@/lib/site'

const literata = Literata({ subsets: ['latin', 'cyrillic'], variable: '--font-literata', display: 'swap' })
const plex = IBM_Plex_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
})
const jetbrains = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${literata.variable} ${plex.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
```

Временная главная (полностью заменить `app/page.tsx`; в Task 16 её заменит настоящая):

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="font-serif text-5xl">Учебник ИИ</h1>
      <p className="mt-4 text-ink-soft">Каркас готов. Скоро здесь будет курс.</p>
    </main>
  )
}
```

- [ ] **Step 10: MDX и статический экспорт**

`next.config.ts` (полностью заменить):

```ts
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm', 'remark-math'],
    rehypePlugins: ['rehype-katex'],
  },
})

export default withMDX(nextConfig)
```

`mdx-components.tsx` (корень проекта; @next/mdx требует этот файл для App Router):

```tsx
import type { MDXComponents } from 'mdx/types'

const components: MDXComponents = {}

export function useMDXComponents(): MDXComponents {
  return components
}
```

- [ ] **Step 11: Проверить сборку, типы и тесты**

Run: `npm run typecheck && npm test && npm run build`
Expected: типы без ошибок; 1 тест PASS; сборка успешна, в `out/index.html` есть `Учебник ИИ`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 16 app with design system, MDX and Vitest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Математическое ядро `lib/math`

Эталонные функции. Ими пользуются визуализации, игрушечная модель и упражнения (как подсказки-«помощники»).

**Files:**
- Create: `lib/math/vec.ts`, `lib/math/mat.ts`, `lib/math/softmax.ts`, `lib/math/attention.ts`, `lib/math/index.ts`
- Test: `lib/math/vec.test.ts`, `lib/math/mat.test.ts`, `lib/math/softmax.test.ts`, `lib/math/attention.test.ts`

**Interfaces:**
- Produces:
  - `type Vec = number[]`; `add(a: Vec, b: Vec): Vec`; `sub(a: Vec, b: Vec): Vec`; `scale(a: Vec, k: number): Vec`; `dot(a: Vec, b: Vec): number`; `norm(a: Vec): number`; `cosine(a: Vec, b: Vec): number` (0 для нулевого вектора); `angleDeg(a: Vec, b: Vec): number` (NaN для нулевого вектора)
  - `type Mat = number[][]`; `shape(m: Mat): [number, number]`; `transpose(m: Mat): Mat`; `matVec(m: Mat, v: Vec): Vec`; `matMul(a: Mat, b: Mat): Mat`
  - `softmax(xs: number[], temperature?: number): number[]`
  - `interface AttentionResult { scores: Mat; weights: Mat; output: Mat }`; `attention(Q: Mat, K: Mat, V: Mat): AttentionResult`
  - `lib/math/index.ts` реэкспортирует всё перечисленное.

- [ ] **Step 1: Написать падающие тесты**

`lib/math/vec.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { add, angleDeg, cosine, dot, norm, scale, sub } from './vec'

describe('vec', () => {
  it('adds, subtracts and scales coordinate-wise', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
    expect(sub([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3])
    expect(scale([1, -2, 0.5], 2)).toEqual([2, -4, 1])
  })

  it('computes the dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(dot([1, 0, 0], [0, 1, 0])).toBe(0)
    expect(dot([], [])).toBe(0)
  })

  it('refuses vectors of different length', () => {
    expect(() => dot([1, 2], [1, 2, 3])).toThrow(/same length/)
    expect(() => add([1], [1, 2])).toThrow(/same length/)
  })

  it('computes length, cosine and angle', () => {
    expect(norm([3, 4, 0])).toBe(5)
    expect(cosine([1, 1, 0], [3, 3, 0])).toBeCloseTo(1)
    expect(cosine([1, 0, 0], [0, 2, 0])).toBeCloseTo(0)
    expect(cosine([1, 0, 0], [-5, 0, 0])).toBeCloseTo(-1)
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(angleDeg([1, 0, 0], [0, 1, 0])).toBeCloseTo(90)
    expect(angleDeg([1, 0, 0], [1, 0, 0])).toBeCloseTo(0)
    expect(angleDeg([0, 0, 0], [1, 0, 0])).toBeNaN()
  })
})
```

`lib/math/mat.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { matMul, matVec, shape, transpose } from './mat'

describe('mat', () => {
  it('reports shape and transposes', () => {
    const m = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    expect(shape(m)).toEqual([2, 3])
    expect(transpose(m)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ])
    expect(shape([])).toEqual([0, 0])
  })

  it('multiplies a matrix by a vector as row dot products', () => {
    expect(
      matVec(
        [
          [1, 0, 2],
          [0, 3, 0],
        ],
        [1, 2, 3],
      ),
    ).toEqual([7, 6])
  })

  it('multiplies compatible matrices', () => {
    const a = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const b = [
      [7, 8],
      [9, 10],
      [11, 12],
    ]
    expect(matMul(a, b)).toEqual([
      [58, 64],
      [139, 154],
    ])
  })

  it('refuses incompatible shapes', () => {
    expect(() => matMul([[1, 2]], [[1, 2]])).toThrow(/incompatible/)
  })
})
```

`lib/math/softmax.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { softmax } from './softmax'

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

describe('softmax', () => {
  it('turns any scores into probabilities that sum to 1', () => {
    const p = softmax([2, 1, 0.1])
    expect(sum(p)).toBeCloseTo(1)
    expect(p[0]).toBeGreaterThan(p[1])
    expect(p[1]).toBeGreaterThan(p[2])
  })

  it('gives equal shares to equal scores', () => {
    expect(softmax([0, 0])).toEqual([0.5, 0.5])
  })

  it('does not change when the same number is added to every score', () => {
    const a = softmax([1, 2, 3])
    const b = softmax([11, 12, 13])
    a.forEach((x, i) => expect(x).toBeCloseTo(b[i]))
  })

  it('stays numerically stable for huge scores', () => {
    const p = softmax([1000, 1001])
    expect(p[0]).toBeCloseTo(0.2689, 4)
    expect(p[1]).toBeCloseTo(0.7311, 4)
  })

  it('gets sharper with lower temperature', () => {
    expect(softmax([1, 2], 0.5)[1]).toBeGreaterThan(softmax([1, 2], 1)[1])
    expect(() => softmax([1, 2], 0)).toThrow(/temperature/)
  })

  it('returns an empty list for no scores', () => {
    expect(softmax([])).toEqual([])
  })
})
```

`lib/math/attention.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { attention } from './attention'

describe('attention (scaled dot-product)', () => {
  it('matches a hand-computed example', () => {
    // d_k = 2: оценки [1, 0] / √2 = [0.7071, 0]; softmax → [0.6698, 0.3302]
    const { scores, weights, output } = attention(
      [[1, 0]],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 2],
        [3, 4],
      ],
    )
    expect(scores[0][0]).toBeCloseTo(0.7071, 4)
    expect(scores[0][1]).toBeCloseTo(0, 4)
    expect(weights[0][0]).toBeCloseTo(0.6698, 4)
    expect(weights[0][1]).toBeCloseTo(0.3302, 4)
    expect(output[0][0]).toBeCloseTo(1.6605, 3)
    expect(output[0][1]).toBeCloseTo(2.6605, 3)
  })

  it('produces one probability row per query', () => {
    const Q = [
      [1, 0, 1],
      [0, 1, 0],
    ]
    const K = [
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 0],
    ]
    const { weights } = attention(Q, K, K)
    expect(weights).toHaveLength(2)
    for (const row of weights) expect(row.reduce((s, x) => s + x, 0)).toBeCloseTo(1)
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/math`
Expected: FAIL — модули `./vec`, `./mat`, `./softmax`, `./attention` не найдены.

- [ ] **Step 3: Реализовать**

`lib/math/vec.ts`:

```ts
export type Vec = number[]

function assertSameLength(a: Vec, b: Vec, op: string): void {
  if (a.length !== b.length) {
    throw new Error(`${op}: vectors must have the same length (got ${a.length} and ${b.length})`)
  }
}

export function add(a: Vec, b: Vec): Vec {
  assertSameLength(a, b, 'add')
  return a.map((x, i) => x + b[i])
}

export function sub(a: Vec, b: Vec): Vec {
  assertSameLength(a, b, 'sub')
  return a.map((x, i) => x - b[i])
}

export function scale(a: Vec, k: number): Vec {
  return a.map((x) => x * k)
}

export function dot(a: Vec, b: Vec): number {
  assertSameLength(a, b, 'dot')
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function norm(a: Vec): number {
  return Math.sqrt(dot(a, a))
}

/** Косинусная похожесть; для нулевого вектора — 0 (направления нет). */
export function cosine(a: Vec, b: Vec): number {
  const lengths = norm(a) * norm(b)
  return lengths === 0 ? 0 : dot(a, b) / lengths
}

/** Угол между векторами в градусах; для нулевого вектора — NaN. */
export function angleDeg(a: Vec, b: Vec): number {
  if (norm(a) === 0 || norm(b) === 0) return NaN
  const c = Math.min(1, Math.max(-1, cosine(a, b)))
  return (Math.acos(c) * 180) / Math.PI
}
```

`lib/math/mat.ts`:

```ts
import { dot, type Vec } from './vec'

export type Mat = number[][]

export function shape(m: Mat): [number, number] {
  return [m.length, m.length === 0 ? 0 : m[0].length]
}

export function transpose(m: Mat): Mat {
  const [rows, cols] = shape(m)
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => m[i][j]))
}

/** Матрица × вектор: каждая строка матрицы скалярно умножается на вектор. */
export function matVec(m: Mat, v: Vec): Vec {
  return m.map((row) => dot(row, v))
}

export function matMul(a: Mat, b: Mat): Mat {
  const [, aCols] = shape(a)
  const [bRows] = shape(b)
  if (aCols !== bRows) {
    throw new Error(`matMul: shapes ${shape(a).join('×')} and ${shape(b).join('×')} are incompatible`)
  }
  const bt = transpose(b)
  return a.map((row) => bt.map((col) => dot(row, col)))
}
```

`lib/math/softmax.ts`:

```ts
/** Превращает любые оценки в вероятности. Вычитание максимума защищает от переполнения exp. */
export function softmax(xs: number[], temperature = 1): number[] {
  if (temperature <= 0) throw new Error('softmax: temperature must be positive')
  if (xs.length === 0) return []
  const scaled = xs.map((x) => x / temperature)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const total = exps.reduce((s, x) => s + x, 0)
  return exps.map((x) => x / total)
}
```

`lib/math/attention.ts`:

```ts
import { matMul, transpose, type Mat } from './mat'
import { softmax } from './softmax'

export interface AttentionResult {
  scores: Mat
  weights: Mat
  output: Mat
}

/** Scaled dot-product attention: softmax(QKᵀ / √dₖ) · V (Vaswani et al., 2017, формула 1). */
export function attention(Q: Mat, K: Mat, V: Mat): AttentionResult {
  const dk = K[0]?.length ?? 0
  if (dk === 0) throw new Error('attention: keys must not be empty')
  const factor = 1 / Math.sqrt(dk)
  const scores = matMul(Q, transpose(K)).map((row) => row.map((s) => s * factor))
  const weights = scores.map((row) => softmax(row))
  return { scores, weights, output: matMul(weights, V) }
}
```

`lib/math/index.ts`:

```ts
export * from './vec'
export * from './mat'
export * from './softmax'
export * from './attention'
```

- [ ] **Step 4: Запустить тесты**

Run: `npm test -- lib/math`
Expected: PASS (4 files).

- [ ] **Step 5: Commit**

```bash
git add lib/math
git commit -m "feat(math): vectors, matrices, softmax and scaled dot-product attention" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Модель курса: типы, манифест, реестр

**Files:**
- Create: `lib/course/types.ts`, `content/attention/course.ts`, `lib/course/registry.ts`
- Test: `lib/course/registry.test.ts`

**Interfaces:**
- Produces (`lib/course/types.ts`):
  ```ts
  type LessonKind = 'lesson' | 'practice'
  type Availability = 'ready' | 'soon'
  type Level = 'kid' | 'student' | 'advanced' | 'paper' | 'frontier'
  interface LessonMeta { id: string; slug: string; title: string; minutes: number; kind: LessonKind; availability: Availability }
  interface ModuleMeta { id: string; number: number; title: string; description: string; level: Level; lessons: LessonMeta[] }
  interface CourseMeta { id: string; title: string; subtitle: string; modules: ModuleMeta[] }
  interface FlatLesson extends LessonMeta { moduleId: string; moduleNumber: number; moduleTitle: string }
  interface LessonMetadata { description: string; objectives: string[] }
  interface Card { id: string; prompt: string; answer: string; kind: 'flip' | 'choice'; options?: string[]; correct?: number }
  const LEVEL_LABEL: Record<Level, string>
  ```
- Produces (`lib/course/registry.ts`): `getCourse(id: string): CourseMeta | undefined`, `listCourses(): CourseMeta[]`, `flatLessons(course: CourseMeta): FlatLesson[]`, `readyLessons(course: CourseMeta): FlatLesson[]`, `findLesson(course: CourseMeta, slug: string): FlatLesson | undefined`, `findLessonById(course: CourseMeta, id: string): FlatLesson | undefined`, `neighbors(course: CourseMeta, slug: string): { prev?: FlatLesson; next?: FlatLesson }` (только среди готовых), `lessonsBefore(course: CourseMeta, slug: string): FlatLesson[]` (готовые уроки строго раньше), `nextLessonToStudy(course: CourseMeta, statuses: Record<string, { status: string } | undefined>): FlatLesson | undefined`.
- Produces (`content/attention/course.ts`): `attentionCourse: CourseMeta` — все 9 модулей. **Пока все уроки `availability: 'soon'`**: задачи с контентом переключают их в `'ready'`.

- [ ] **Step 1: Написать падающий тест**

`lib/course/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CourseMeta } from './types'
import {
  findLesson,
  findLessonById,
  flatLessons,
  getCourse,
  lessonsBefore,
  neighbors,
  nextLessonToStudy,
  readyLessons,
} from './registry'

const course: CourseMeta = {
  id: 'test',
  title: 'Тест',
  subtitle: '',
  modules: [
    {
      id: 'm0',
      number: 0,
      title: 'Ноль',
      description: '',
      level: 'kid',
      lessons: [
        { id: '0.1', slug: 'a', title: 'A', minutes: 5, kind: 'lesson', availability: 'ready' },
        { id: '0.2', slug: 'b', title: 'B', minutes: 5, kind: 'lesson', availability: 'soon' },
      ],
    },
    {
      id: 'm1',
      number: 1,
      title: 'Один',
      description: '',
      level: 'student',
      lessons: [{ id: '1.1', slug: 'c', title: 'C', minutes: 5, kind: 'lesson', availability: 'ready' }],
    },
  ],
}

describe('course registry', () => {
  it('flattens lessons in order and annotates their module', () => {
    const flat = flatLessons(course)
    expect(flat.map((l) => l.id)).toEqual(['0.1', '0.2', '1.1'])
    expect(flat[2]).toMatchObject({ moduleId: 'm1', moduleNumber: 1, moduleTitle: 'Один' })
  })

  it('finds lessons by slug and by id', () => {
    expect(findLesson(course, 'c')?.id).toBe('1.1')
    expect(findLessonById(course, '0.2')?.slug).toBe('b')
    expect(findLesson(course, 'nope')).toBeUndefined()
  })

  it('links neighbours through ready lessons only', () => {
    expect(readyLessons(course).map((l) => l.id)).toEqual(['0.1', '1.1'])
    expect(neighbors(course, 'a').next?.id).toBe('1.1')
    expect(neighbors(course, 'c').prev?.id).toBe('0.1')
    expect(neighbors(course, 'a').prev).toBeUndefined()
  })

  it('lists ready lessons before a given one', () => {
    expect(lessonsBefore(course, 'c').map((l) => l.id)).toEqual(['0.1'])
    expect(lessonsBefore(course, 'a')).toEqual([])
  })

  it('suggests the first unfinished ready lesson, or the last one when all are done', () => {
    expect(nextLessonToStudy(course, {})?.id).toBe('0.1')
    expect(nextLessonToStudy(course, { '0.1': { status: 'completed' } })?.id).toBe('1.1')
    expect(
      nextLessonToStudy(course, { '0.1': { status: 'completed' }, '1.1': { status: 'completed' } })?.id,
    ).toBe('1.1')
  })

  it('ships the attention course with unique ids and slugs', () => {
    const attention = getCourse('attention')
    expect(attention?.modules).toHaveLength(9)
    const flat = flatLessons(attention!)
    expect(new Set(flat.map((l) => l.id)).size).toBe(flat.length)
    expect(new Set(flat.map((l) => l.slug)).size).toBe(flat.length)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- lib/course`
Expected: FAIL — `Failed to resolve import "./registry"`.

- [ ] **Step 3: Типы**

`lib/course/types.ts`:

```ts
export type LessonKind = 'lesson' | 'practice'
export type Availability = 'ready' | 'soon'
export type Level = 'kid' | 'student' | 'advanced' | 'paper' | 'frontier'

export interface LessonMeta {
  id: string
  slug: string
  title: string
  minutes: number
  kind: LessonKind
  availability: Availability
}

export interface ModuleMeta {
  id: string
  number: number
  title: string
  description: string
  level: Level
  lessons: LessonMeta[]
}

export interface CourseMeta {
  id: string
  title: string
  subtitle: string
  modules: ModuleMeta[]
}

export interface FlatLesson extends LessonMeta {
  moduleId: string
  moduleNumber: number
  moduleTitle: string
}

/** То, что экспортирует каждый MDX-урок как `metadata`. */
export interface LessonMetadata {
  description: string
  objectives: string[]
}

/** Карточка интервального повторения. */
export interface Card {
  id: string
  prompt: string
  answer: string
  kind: 'flip' | 'choice'
  options?: string[]
  correct?: number
}

export const LEVEL_LABEL: Record<Level, string> = {
  kid: '🧒 с нуля',
  student: '🎓 основы',
  advanced: '🔬 глубже',
  paper: '📄 статья',
  frontier: '🚀 дальше',
}
```

- [ ] **Step 4: Манифест курса**

`content/attention/course.ts`:

```ts
import type { CourseMeta, LessonKind, LessonMeta } from '@/lib/course/types'

function lesson(id: string, slug: string, title: string, minutes: number, kind: LessonKind = 'lesson'): LessonMeta {
  return { id, slug, title, minutes, kind, availability: 'soon' }
}

export const attentionCourse: CourseMeta = {
  id: 'attention',
  title: 'Внимание и трансформеры',
  subtitle: 'От «что такое стрелка» до статьи «Attention Is All You Need» и ChatGPT',
  modules: [
    {
      id: 'm0',
      number: 0,
      title: 'Загадка',
      description: 'Почему понять «он» так трудно для машины — и как устроен наш путь.',
      level: 'kid',
      lessons: [lesson('0.1', '0-1-riddle', 'Загадка «он»', 10), lesson('0.2', '0-2-journey-map', 'Карта путешествия', 8)],
    },
    {
      id: 'm1',
      number: 1,
      title: 'Математика как язык',
      description: 'Векторы, скалярное произведение, матрицы и softmax — с нуля и на картинках.',
      level: 'kid',
      lessons: [
        lesson('1.1', '1-1-vector', 'Вектор: стрелка и список чисел', 12),
        lesson('1.2', '1-2-vector-ops', 'Сложение и масштаб', 12),
        lesson('1.3', '1-3-dot-product', 'Скалярное произведение', 15),
        lesson('1.4', '1-4-matrix', 'Матрица превращает пространство', 15),
        lesson('1.5', '1-5-matmul', 'Умножение матриц', 15),
        lesson('1.6', '1-6-softmax', 'Экспонента и softmax', 15),
        lesson('1.P', '1-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm2',
      number: 2,
      title: 'Слова как точки',
      description: 'Как слово превращается в точку в пространстве смыслов.',
      level: 'student',
      lessons: [
        lesson('2.1', '2-1-tokens', 'Токены', 10),
        lesson('2.2', '2-2-embeddings', 'Эмбеддинг: слово как точка', 12),
        lesson('2.3', '2-3-similarity', 'Похожесть и арифметика смыслов', 12),
        lesson('2.4', '2-4-context-problem', 'Проблема «ключа»', 10),
        lesson('2.P', '2-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm3',
      number: 3,
      title: 'Внимание: идея',
      description: 'Запрос, ключ и значение: как слово «смотрит» на другие слова.',
      level: 'student',
      lessons: [
        lesson('3.1', '3-1-before-transformers', 'До трансформеров: испорченный телефон', 10),
        lesson('3.2', '3-2-query-key-value', 'Запрос, ключ, значение', 12),
        lesson('3.3', '3-3-attention-by-hand', 'Считаем внимание руками', 15),
        lesson('3.4', '3-4-self-attention', 'Self-attention решает загадку', 15),
        lesson('3.P', '3-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm4',
      number: 4,
      title: 'Внимание: формула',
      description: 'softmax(QKᵀ/√dₖ)·V — разбираем каждую букву и пишем код.',
      level: 'advanced',
      lessons: [
        lesson('4.1', '4-1-qkv-matrices', 'Откуда берутся Q, K, V', 12),
        lesson('4.2', '4-2-qk-heatmap', 'QKᵀ — тепловая карта', 12),
        lesson('4.3', '4-3-scaling', 'Зачем делить на √dₖ', 10),
        lesson('4.4', '4-4-full-formula', 'Формула целиком', 15),
        lesson('4.5', '4-5-masking', 'Маска: не подглядывать в будущее', 10),
        lesson('4.P', '4-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm5',
      number: 5,
      title: 'Много голов и порядок слов',
      description: 'Несколько «прожекторов» внимания и как модель узнаёт порядок слов.',
      level: 'advanced',
      lessons: [
        lesson('5.1', '5-1-multi-head', 'Несколько прожекторов', 12),
        lesson('5.2', '5-2-concat', 'Concat, Wᴼ и размеры из статьи', 12),
        lesson('5.3', '5-3-word-order', 'Порядок слов', 10),
        lesson('5.4', '5-4-positional-encoding', 'Позиционное кодирование', 15),
        lesson('5.P', '5-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm6',
      number: 6,
      title: 'Собираем трансформер',
      description: 'Feed-forward, residual, LayerNorm, энкодер и декодер — собираем целиком.',
      level: 'advanced',
      lessons: [
        lesson('6.1', '6-1-feed-forward', 'Feed-forward: подумать над словом', 12),
        lesson('6.2', '6-2-residual-layernorm', 'Residual и LayerNorm', 12),
        lesson('6.3', '6-3-encoder-block', 'Блок энкодера в 3D', 15),
        lesson('6.4', '6-4-decoder-cross-attention', 'Декодер и cross-attention', 15),
        lesson('6.5', '6-5-stack', 'Стопка из шести слоёв', 12),
        lesson('6.6', '6-6-project', 'Проект: свой мини-трансформер', 20),
        lesson('6.P', '6-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm7',
      number: 7,
      title: 'Читаем статью',
      description: 'Обучение на интуиции, результаты и статья абзац за абзацем.',
      level: 'paper',
      lessons: [
        lesson('7.1', '7-1-training-intuition', 'Обучение на интуиции', 15),
        lesson('7.2', '7-2-why-revolution', 'Почему это революция', 12),
        lesson('7.3', '7-3-paper-walkthrough', 'Статья абзац за абзацем', 20),
        lesson('7.P', '7-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
    {
      id: 'm8',
      number: 8,
      title: 'Мостик к GPT',
      description: 'Как из трансформера получился ChatGPT: только декодер и генерация.',
      level: 'frontier',
      lessons: [
        lesson('8.1', '8-1-decoder-only', 'Только декодер', 12),
        lesson('8.2', '8-2-generation', 'Генерация: температура и top-k', 12),
        lesson('8.3', '8-3-whats-next', 'Что дальше', 10),
        lesson('8.P', '8-p-practice', 'Смешанная практика', 12, 'practice'),
      ],
    },
  ],
}
```

- [ ] **Step 5: Реестр**

`lib/course/registry.ts`:

```ts
import { attentionCourse } from '@/content/attention/course'
import type { CourseMeta, FlatLesson } from './types'

const COURSES: Record<string, CourseMeta> = { [attentionCourse.id]: attentionCourse }

export function getCourse(id: string): CourseMeta | undefined {
  return COURSES[id]
}

export function listCourses(): CourseMeta[] {
  return Object.values(COURSES)
}

export function flatLessons(course: CourseMeta): FlatLesson[] {
  return course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNumber: m.number, moduleTitle: m.title })),
  )
}

export function readyLessons(course: CourseMeta): FlatLesson[] {
  return flatLessons(course).filter((l) => l.availability === 'ready')
}

export function findLesson(course: CourseMeta, slug: string): FlatLesson | undefined {
  return flatLessons(course).find((l) => l.slug === slug)
}

export function findLessonById(course: CourseMeta, id: string): FlatLesson | undefined {
  return flatLessons(course).find((l) => l.id === id)
}

export function neighbors(course: CourseMeta, slug: string): { prev?: FlatLesson; next?: FlatLesson } {
  const ready = readyLessons(course)
  const i = ready.findIndex((l) => l.slug === slug)
  if (i === -1) return {}
  return { prev: ready[i - 1], next: ready[i + 1] }
}

export function lessonsBefore(course: CourseMeta, slug: string): FlatLesson[] {
  const flat = flatLessons(course)
  const i = flat.findIndex((l) => l.slug === slug)
  return flat.slice(0, Math.max(i, 0)).filter((l) => l.availability === 'ready')
}

export function nextLessonToStudy(
  course: CourseMeta,
  statuses: Record<string, { status: string } | undefined>,
): FlatLesson | undefined {
  const ready = readyLessons(course)
  return ready.find((l) => statuses[l.id]?.status !== 'completed') ?? ready[ready.length - 1]
}
```

- [ ] **Step 6: Запустить тесты**

Run: `npm test -- lib/course`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/course content/attention/course.ts
git commit -m "feat(course): course types, full attention-course manifest and registry" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Планировщик интервального повторения

**Files:**
- Create: `lib/progress/types.ts`, `lib/progress/scheduler.ts`
- Test: `lib/progress/scheduler.test.ts`

**Interfaces:**
- Consumes: `Card` из `lib/course/types.ts` (Task 3).
- Produces (`lib/progress/types.ts`):
  ```ts
  type LessonStatus = 'in-progress' | 'completed'
  interface LessonProgress { status: LessonStatus; unlockedStep: number; completedAt?: string }
  interface GateProgress { passed: boolean; attempts: number; revealed: boolean; choice?: number }
  type Box = 1 | 2 | 3 | 4 | 5
  interface CardState { box: Box; due: string }        // due — дата 'YYYY-MM-DD'
  interface ProgressData { version: 1; lessons: Record<string, LessonProgress>; gates: Record<string, GateProgress>;
    code: Record<string, string>; explanations: Record<string, string>; cards: Record<string, CardState>; customCards: Record<string, Card> }
  ```
- Produces (`lib/progress/scheduler.ts`): `INTERVALS = [1, 3, 7, 16, 35]`, `MAX_BOX = 5`, `todayISO(date?: Date): string`, `addDays(iso: string, days: number): string`, `newCard(today: string): CardState`, `nextReview(card: CardState, correct: boolean, today: string): CardState`, `isDue(card: CardState, today: string): boolean`, `hashString(s: string): number`, `seededShuffle<T>(items: readonly T[], seed: string): T[]`, `pickRecallCards(candidateIds: readonly string[], states: Readonly<Record<string, CardState>>, today: string, seed: string): string[]`.

- [ ] **Step 1: Типы прогресса**

`lib/progress/types.ts`:

```ts
import type { Card } from '@/lib/course/types'

export type LessonStatus = 'in-progress' | 'completed'

export interface LessonProgress {
  status: LessonStatus
  /** Индекс последнего открытого шага урока. */
  unlockedStep: number
  completedAt?: string
}

export interface GateProgress {
  passed: boolean
  attempts: number
  /** Ответ был показан после неудачных попыток. */
  revealed: boolean
  /** Последний выбранный вариант (для «Предскажи»). */
  choice?: number
}

export type Box = 1 | 2 | 3 | 4 | 5

export interface CardState {
  box: Box
  /** Дата следующего повторения, 'YYYY-MM-DD'. */
  due: string
}

export interface ProgressData {
  version: 1
  lessons: Record<string, LessonProgress>
  gates: Record<string, GateProgress>
  code: Record<string, string>
  explanations: Record<string, string>
  cards: Record<string, CardState>
  /** Карточки, созданные из вопросов, на которые ученик не ответил сам. */
  customCards: Record<string, Card>
}
```

- [ ] **Step 2: Написать падающие тесты**

`lib/progress/scheduler.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { CardState } from './types'
import { addDays, isDue, newCard, nextReview, pickRecallCards, seededShuffle, todayISO } from './scheduler'

describe('dates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 9, 20, 23, 59))).toBe('2026-10-20')
  })

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-20', 1)).toBe('2026-10-21')
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('Leitner scheduling', () => {
  it('enrolls a new card into box 1, due tomorrow', () => {
    expect(newCard('2026-10-20')).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('moves a remembered card one box up with a longer interval', () => {
    expect(nextReview({ box: 1, due: '2026-10-21' }, true, '2026-10-21')).toEqual({ box: 2, due: '2026-10-24' })
    expect(nextReview({ box: 4, due: '2026-10-20' }, true, '2026-10-20')).toEqual({ box: 5, due: '2026-11-24' })
  })

  it('keeps a remembered card in the last box', () => {
    expect(nextReview({ box: 5, due: '2026-10-20' }, true, '2026-10-20')).toEqual({ box: 5, due: '2026-11-24' })
  })

  it('sends a forgotten card back to box 1', () => {
    expect(nextReview({ box: 4, due: '2026-10-20' }, false, '2026-10-20')).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('knows when a card is due', () => {
    expect(isDue({ box: 1, due: '2026-10-20' }, '2026-10-20')).toBe(true)
    expect(isDue({ box: 1, due: '2026-10-19' }, '2026-10-20')).toBe(true)
    expect(isDue({ box: 1, due: '2026-10-21' }, '2026-10-20')).toBe(false)
  })
})

describe('seededShuffle', () => {
  it('is deterministic and keeps every item', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const once = seededShuffle(items, 'x')
    expect(seededShuffle(items, 'x')).toEqual(once)
    expect([...once].sort()).toEqual(items)
  })
})

describe('pickRecallCards', () => {
  const today = '2026-10-20'
  const states: Record<string, CardState> = {
    due1: { box: 1, due: '2026-10-18' },
    due2: { box: 3, due: '2026-10-20' },
    due3: { box: 2, due: '2026-10-19' },
    due4: { box: 1, due: '2026-10-20' },
    later: { box: 2, due: '2026-10-25' },
  }

  it('returns nothing when there are no candidates', () => {
    expect(pickRecallCards([], states, today, 's')).toEqual([])
  })

  it('returns at most three due cards, all from the candidates', () => {
    const picked = pickRecallCards(['due1', 'due2', 'due3', 'due4', 'later'], states, today, 's')
    expect(picked).toHaveLength(3)
    for (const id of picked) expect(['due1', 'due2', 'due3', 'due4']).toContain(id)
  })

  it('ignores due cards that are not candidates', () => {
    expect(pickRecallCards(['due2', 'later'], states, today, 's')).toEqual(['due2'])
  })

  it('falls back to two distinct cards when nothing is due', () => {
    const picked = pickRecallCards(['later', 'never1', 'never2'], states, today, 's')
    expect(picked).toHaveLength(2)
    expect(new Set(picked).size).toBe(2)
  })

  it('falls back to whatever exists when there are fewer than two candidates', () => {
    expect(pickRecallCards(['never1'], states, today, 's')).toEqual(['never1'])
  })

  it('is deterministic for the same seed', () => {
    const ids = ['later', 'never1', 'never2', 'never3']
    expect(pickRecallCards(ids, states, today, 'lesson-1.2')).toEqual(pickRecallCards(ids, states, today, 'lesson-1.2'))
  })
})
```

- [ ] **Step 3: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/progress/scheduler`
Expected: FAIL — `Failed to resolve import "./scheduler"`.

- [ ] **Step 4: Реализовать планировщик (кроме `pickRecallCards`)**

`lib/progress/scheduler.ts`:

```ts
import type { Box, CardState } from './types'

/** Интервал (в днях) для коробок Лейтнера 1–5. */
export const INTERVALS = [1, 3, 7, 16, 35] as const
export const MAX_BOX = 5

/** Локальная дата пользователя в формате 'YYYY-MM-DD'. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function newCard(today: string): CardState {
  return { box: 1, due: addDays(today, INTERVALS[0]) }
}

export function nextReview(card: CardState, correct: boolean, today: string): CardState {
  const box = (correct ? Math.min(card.box + 1, MAX_BOX) : 1) as Box
  return { box, due: addDays(today, INTERVALS[box - 1]) }
}

/** ISO-даты сравниваются как строки. */
export function isDue(card: CardState, today: string): boolean {
  return card.due <= today
}

/** FNV-1a: строка → 32-битное число (зерно для перемешивания). */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Детерминированное перемешивание Фишера–Йетса: одинаковое зерно → одинаковый порядок. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = mulberry32(hashString(seed))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Какие карточки показать в разминке урока.
 * Правила (их фиксируют тесты): берём только из candidateIds; если среди них есть карточки
 * со сроком «сегодня или раньше» — до трёх таких; если нет ни одной — две любые
 * (детерминированно по seed); результат одинаков для одинаковых аргументов.
 */
export function pickRecallCards(
  candidateIds: readonly string[],
  states: Readonly<Record<string, CardState>>,
  today: string,
  seed: string,
): string[] {
  // 🧑‍🎓 Вклад ученика (Step 5)
  throw new Error('pickRecallCards: not implemented yet')
}
```

- [ ] **Step 5: 🧑‍🎓 Вклад ученика — `pickRecallCards`**

**Остановиться и попросить пользователя** реализовать тело `pickRecallCards` (5–10 строк). Контекст для просьбы:
- Тесты из Step 2 фиксируют правила: только кандидаты, до 3 «просроченных», запасной вариант — 2 случайные, детерминизм.
- **Решение за учеником — порядок среди просроченных карточек**, когда их больше трёх. Варианты: самые просроченные первыми (раньше всех `due`); самые «слабые» первыми (меньший `box`); случайно через `seededShuffle`. Это влияет на то, какие знания ученик укрепит в первую очередь.
- Полезные функции уже есть в файле: `isDue`, `seededShuffle`.

Если пользователь откажется, вставить эталон («самые просроченные первыми, при равенстве — меньшая коробка»):

```ts
  const due = candidateIds.filter((id) => states[id] !== undefined && isDue(states[id], today))
  if (due.length > 0) {
    return [...due]
      .sort((a, b) => states[a].due.localeCompare(states[b].due) || states[a].box - states[b].box)
      .slice(0, 3)
  }
  return seededShuffle(candidateIds, seed).slice(0, 2)
```

- [ ] **Step 6: Запустить тесты**

Run: `npm test -- lib/progress/scheduler`
Expected: PASS (все тесты файла).

- [ ] **Step 7: Commit**

```bash
git add lib/progress/types.ts lib/progress/scheduler.ts lib/progress/scheduler.test.ts
git commit -m "feat(progress): Leitner scheduler and recall-card picker" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Хранилище прогресса (zustand + localStorage)

**Files:**
- Create: `lib/progress/storage.ts`, `lib/progress/migrate.ts`, `lib/progress/store.ts`, `lib/progress/useHydrated.ts`, `components/progress/ProgressHydrator.tsx`
- Test: `lib/progress/store.test.ts`, `lib/progress/useHydrated.test.tsx`

**Interfaces:**
- Consumes: `ProgressData`, `CardState` (Task 4), `newCard`, `nextReview`, `addDays` (Task 4), `Card` (Task 3).
- Produces:
  - `storage.ts`: `STORAGE_KEY = 'ailearning:v1'`, `BACKUP_KEY = 'ailearning:backup'`, `isLocalStorageAvailable(): boolean`, `createMemoryStorage(): StateStorage`, `createSafeStorage(): StateStorage`
  - `migrate.ts`: `CURRENT_VERSION = 1`, `emptyProgress(): ProgressData`, `normalizeProgress(raw: unknown): ProgressData`, `migrateProgress(persisted: unknown, version: number): ProgressData`
  - `store.ts`: `useProgress` (zustand-хук; `useProgress.persist.rehydrate()`, `useProgress.persist.hasHydrated()`, `useProgress.persist.onFinishHydration(cb)`), тип `ProgressStore = ProgressData & ProgressActions`, где
    ```ts
    interface ProgressActions {
      unlockStep(lessonId: string, stepIndex: number): void
      completeLesson(lessonId: string, cardIds: string[], today: string): void
      recordAttempt(gateId: string, correct: boolean, choice?: number): void
      passGate(gateId: string): void
      revealGate(gateId: string, card: Card | undefined, today: string): void
      saveCode(exerciseId: string, code: string): void
      saveExplanation(id: string, text: string): void
      reviewCard(cardId: string, correct: boolean, today: string): void
      exportProgress(): string
      importProgress(json: string): boolean
      resetProgress(): void
    }
    ```
  - `useHydrated.ts`: `useHydrated(): boolean` — `false` на сервере и при первой отрисовке на клиенте, `true` после загрузки прогресса.
  - `ProgressHydrator.tsx`: клиентский компонент без разметки, вызывает `useProgress.persist.rehydrate()` после монтирования.

- [ ] **Step 1: Написать падающие тесты**

`lib/progress/store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from './store'
import { emptyProgress, migrateProgress, normalizeProgress } from './migrate'
import { BACKUP_KEY, STORAGE_KEY, createSafeStorage } from './storage'

const today = '2026-10-20'
const s = () => useProgress.getState()

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('progress store', () => {
  it('unlocks steps monotonically and marks the lesson in progress', () => {
    s().unlockStep('1.1', 2)
    s().unlockStep('1.1', 1)
    expect(s().lessons['1.1']).toEqual({ status: 'in-progress', unlockedStep: 2 })
  })

  it('does not reopen a completed lesson as in progress', () => {
    s().completeLesson('1.1', [], today)
    s().unlockStep('1.1', 5)
    expect(s().lessons['1.1'].status).toBe('completed')
  })

  it('completes a lesson and enrolls its cards without resetting known ones', () => {
    useProgress.setState({ cards: { old: { box: 3, due: '2026-10-25' } } })
    s().completeLesson('1.1', ['old', 'new'], today)
    expect(s().lessons['1.1'].status).toBe('completed')
    expect(s().lessons['1.1'].completedAt).toBeTypeOf('string')
    expect(s().cards.old).toEqual({ box: 3, due: '2026-10-25' })
    expect(s().cards.new).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('counts attempts, remembers success and the last choice', () => {
    s().recordAttempt('g', false, 1)
    s().recordAttempt('g', true, 0)
    expect(s().gates.g).toEqual({ passed: true, attempts: 2, revealed: false, choice: 0 })
  })

  it('reveals a gate and schedules its question for review tomorrow', () => {
    const card = { id: 'check:g', kind: 'flip' as const, prompt: 'Вопрос', answer: 'Ответ' }
    s().revealGate('g', card, today)
    expect(s().gates.g).toMatchObject({ passed: true, revealed: true })
    expect(s().customCards['check:g']).toEqual(card)
    expect(s().cards['check:g']).toEqual({ box: 1, due: '2026-10-21' })
  })

  it('reviews cards with the Leitner scheduler', () => {
    s().completeLesson('x', ['c'], today)
    s().reviewCard('c', true, '2026-10-21')
    expect(s().cards.c).toEqual({ box: 2, due: '2026-10-24' })
  })

  it('round-trips progress through export and import', () => {
    s().saveCode('dot', 'function dot() {}')
    s().saveExplanation('e', 'моё объяснение')
    const json = s().exportProgress()
    s().resetProgress()
    expect(s().code).toEqual({})
    expect(s().importProgress(json)).toBe(true)
    expect(s().code.dot).toBe('function dot() {}')
    expect(s().explanations.e).toBe('моё объяснение')
  })

  it('rejects broken or foreign imports and keeps the current state', () => {
    s().saveCode('dot', 'keep me')
    expect(s().importProgress('{not json')).toBe(false)
    expect(s().importProgress(JSON.stringify({ version: 99, code: {} }))).toBe(false)
    expect(s().importProgress(JSON.stringify([1, 2]))).toBe(false)
    expect(s().code.dot).toBe('keep me')
  })

  it('loads saved progress from localStorage on rehydrate', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: { ...emptyProgress(), lessons: { '0.1': { status: 'completed', unlockedStep: 3 } } },
      }),
    )
    await useProgress.persist.rehydrate()
    expect(s().lessons['0.1'].status).toBe('completed')
  })
})

describe('normalizeProgress / migrateProgress', () => {
  it('drops malformed sections but keeps valid ones', () => {
    const p = normalizeProgress({ lessons: 'oops', gates: null, cards: { c: { box: 2, due: '2026-10-22' } }, junk: 1 })
    expect(p.lessons).toEqual({})
    expect(p.gates).toEqual({})
    expect(p.cards.c).toEqual({ box: 2, due: '2026-10-22' })
  })

  it('keeps progress for lesson ids the course no longer has (the UI ignores them)', () => {
    const p = normalizeProgress({ lessons: { '9.9': { status: 'completed', unlockedStep: 0 } } })
    expect(p.lessons['9.9']).toBeDefined()
  })

  it('backs up unknown versions and starts fresh', () => {
    const p = migrateProgress({ lessons: { a: 1 } }, 99)
    expect(p).toEqual(emptyProgress())
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({ lessons: { a: 1 } })
  })
})

describe('createSafeStorage', () => {
  it('moves corrupted JSON to the backup key and reports no data', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    const storage = createSafeStorage()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{broken')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
```

`lib/progress/useHydrated.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProgress } from './store'
import { useHydrated } from './useHydrated'

function Probe() {
  return <span>{useHydrated() ? 'ready' : 'waiting'}</span>
}

describe('useHydrated', () => {
  it('turns true once saved progress has been loaded', async () => {
    render(<Probe />)
    expect(screen.getByText('waiting')).toBeInTheDocument()
    await act(async () => {
      await useProgress.persist.rehydrate()
    })
    expect(screen.getByText('ready')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/progress`
Expected: FAIL — модули `./store`, `./migrate`, `./storage`, `./useHydrated` не найдены.

- [ ] **Step 3: Безопасное хранилище**

`lib/progress/storage.ts`:

```ts
import type { StateStorage } from 'zustand/middleware'

export const STORAGE_KEY = 'ailearning:v1'
export const BACKUP_KEY = 'ailearning:backup'

export function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__ailearning_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function createMemoryStorage(): StateStorage {
  const memory = new Map<string, string>()
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  }
}

/** localStorage с защитой: битый JSON уходит в резервную копию, переполнение не роняет приложение. */
export function createSafeStorage(): StateStorage {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return createMemoryStorage()
  return {
    getItem: (key) => {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return null
      try {
        JSON.parse(raw)
        return raw
      } catch {
        window.localStorage.setItem(BACKUP_KEY, raw)
        window.localStorage.removeItem(key)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // квота переполнена: состояние остаётся в памяти до конца сессии
      }
    },
    removeItem: (key) => window.localStorage.removeItem(key),
  }
}
```

- [ ] **Step 4: Нормализация и миграции**

`lib/progress/migrate.ts`:

```ts
import { BACKUP_KEY } from './storage'
import type { ProgressData } from './types'

export const CURRENT_VERSION = 1

const RECORD_KEYS = ['lessons', 'gates', 'code', 'explanations', 'cards', 'customCards'] as const

export function emptyProgress(): ProgressData {
  return { version: 1, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {} }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Берёт из сырых данных только разделы правильной формы; остальное заменяет пустым. */
export function normalizeProgress(raw: unknown): ProgressData {
  const result = emptyProgress()
  if (!isPlainObject(raw)) return result
  for (const key of RECORD_KEYS) {
    const section = raw[key]
    if (isPlainObject(section)) (result as unknown as Record<string, unknown>)[key] = section
  }
  return result
}

function backupRaw(data: unknown): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(BACKUP_KEY, JSON.stringify(data))
  } catch {
    // хранилище недоступно — резервную копию сделать нельзя
  }
}

/** v1 — первая схема. Любая другая версия неизвестна: сохраняем копию и начинаем с чистого листа. */
export function migrateProgress(persisted: unknown, version: number): ProgressData {
  if (version === CURRENT_VERSION) return normalizeProgress(persisted)
  backupRaw(persisted)
  return emptyProgress()
}
```

- [ ] **Step 5: Store**

`lib/progress/store.ts`:

```ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Card } from '@/lib/course/types'
import { CURRENT_VERSION, emptyProgress, migrateProgress, normalizeProgress } from './migrate'
import { addDays, newCard, nextReview } from './scheduler'
import { STORAGE_KEY, createSafeStorage } from './storage'
import type { GateProgress, ProgressData } from './types'

export interface ProgressActions {
  unlockStep(lessonId: string, stepIndex: number): void
  completeLesson(lessonId: string, cardIds: string[], today: string): void
  recordAttempt(gateId: string, correct: boolean, choice?: number): void
  passGate(gateId: string): void
  revealGate(gateId: string, card: Card | undefined, today: string): void
  saveCode(exerciseId: string, code: string): void
  saveExplanation(id: string, text: string): void
  reviewCard(cardId: string, correct: boolean, today: string): void
  exportProgress(): string
  importProgress(json: string): boolean
  resetProgress(): void
}

export type ProgressStore = ProgressData & ProgressActions

const EMPTY_GATE: GateProgress = { passed: false, attempts: 0, revealed: false }

function pickData(s: ProgressData): ProgressData {
  const { version, lessons, gates, code, explanations, cards, customCards } = s
  return { version, lessons, gates, code, explanations, cards, customCards }
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),

      unlockStep: (lessonId, stepIndex) =>
        set((s) => {
          const current = s.lessons[lessonId]
          if (current?.status === 'completed') return {}
          const unlockedStep = Math.max(current?.unlockedStep ?? 0, stepIndex)
          return { lessons: { ...s.lessons, [lessonId]: { status: 'in-progress', unlockedStep } } }
        }),

      completeLesson: (lessonId, cardIds, today) =>
        set((s) => {
          const cards = { ...s.cards }
          for (const id of cardIds) if (!cards[id]) cards[id] = newCard(today)
          return {
            cards,
            lessons: {
              ...s.lessons,
              [lessonId]: {
                status: 'completed',
                unlockedStep: s.lessons[lessonId]?.unlockedStep ?? 0,
                completedAt: new Date().toISOString(),
              },
            },
          }
        }),

      recordAttempt: (gateId, correct, choice) =>
        set((s) => {
          const gate = s.gates[gateId] ?? EMPTY_GATE
          const next: GateProgress = { ...gate, attempts: gate.attempts + 1, passed: gate.passed || correct }
          if (choice !== undefined) next.choice = choice
          return { gates: { ...s.gates, [gateId]: next } }
        }),

      passGate: (gateId) =>
        set((s) => ({ gates: { ...s.gates, [gateId]: { ...(s.gates[gateId] ?? EMPTY_GATE), passed: true } } })),

      revealGate: (gateId, card, today) =>
        set((s) => {
          const gates = { ...s.gates, [gateId]: { ...(s.gates[gateId] ?? EMPTY_GATE), passed: true, revealed: true } }
          if (!card) return { gates }
          return {
            gates,
            customCards: { ...s.customCards, [card.id]: card },
            cards: { ...s.cards, [card.id]: { box: 1, due: addDays(today, 1) } },
          }
        }),

      saveCode: (exerciseId, code) => set((s) => ({ code: { ...s.code, [exerciseId]: code } })),

      saveExplanation: (id, text) => set((s) => ({ explanations: { ...s.explanations, [id]: text } })),

      reviewCard: (cardId, correct, today) =>
        set((s) => ({
          cards: { ...s.cards, [cardId]: nextReview(s.cards[cardId] ?? newCard(today), correct, today) },
        })),

      exportProgress: () => JSON.stringify(pickData(get())),

      importProgress: (json) => {
        try {
          const parsed: unknown = JSON.parse(json)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
          if ((parsed as { version?: unknown }).version !== CURRENT_VERSION) return false
          set(normalizeProgress(parsed))
          return true
        } catch {
          return false
        }
      },

      resetProgress: () => set(emptyProgress()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => createSafeStorage()),
      skipHydration: true,
      partialize: (s) => pickData(s),
      migrate: (persisted, version) => migrateProgress(persisted, version) as unknown as ProgressStore,
      merge: (persisted, current) => ({ ...current, ...normalizeProgress(persisted) }),
    },
  ),
)
```

- [ ] **Step 6: Хук гидратации и гидратор**

`lib/progress/useHydrated.ts`:

```ts
import { useEffect, useState } from 'react'
import { useProgress } from './store'

/**
 * false — на сервере и при первой отрисовке на клиенте (совпадает с серверным HTML);
 * true — когда прогресс из localStorage загружен.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useProgress.persist.hasHydrated())
  useEffect(() => {
    const unsubscribe = useProgress.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useProgress.persist.hasHydrated())
    return unsubscribe
  }, [])
  return hydrated
}
```

`components/progress/ProgressHydrator.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useProgress } from '@/lib/progress/store'

/** Загружает прогресс из localStorage после гидратации страницы (чтобы серверный и клиентский HTML совпали). */
export function ProgressHydrator(): null {
  useEffect(() => {
    void useProgress.persist.rehydrate()
  }, [])
  return null
}
```

- [ ] **Step 7: Запустить тесты**

Run: `npm test -- lib/progress`
Expected: PASS (scheduler, store, useHydrated).

- [ ] **Step 8: Commit**

```bash
git add lib/progress components/progress
git commit -m "feat(progress): persistent progress store with safe storage, migrations and import/export" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Игрушечная модель сквозного примера

Трёхмерное «пространство смыслов» для фразы про кота и забор. Оси: **живое**, **высокое**, **предмет**. Модель упрощённо двухшаговая, и это честно:
1. «он» забирает у прилагательного свойство («высокий» или «уставший»), но не «предметность»;
2. обогащённое «он» ищет слово, у которого есть это свойство и которое является предметом.

Подробно разбирается в уроке 3.4, а в 0.1 показывается как превью.

**Files:**
- Create: `content/attention/toy-model.ts`
- Test: `content/attention/toy-model.test.ts`

**Interfaces:**
- Consumes: `attention`, `matVec`, `add`, `Vec`, `Mat` из `lib/math` (Task 2).
- Produces: `AXES: readonly ['живое', 'высокое', 'предмет']`, `type Variant = 'tall' | 'tired'`, `ADJECTIVE: Record<Variant, string>`, `EMBEDDINGS: Record<string, Vec>`, `W_V1: Mat`, `W_Q: Mat`, `W_K: Mat`, `W_V: Mat`, `sentence(variant: Variant): string[]`, `contextualizePronoun(variant: Variant): Vec`, `interface PronounAttention { tokens: string[]; weights: number[]; target: string }`, `pronounAttention(variant: Variant): PronounAttention`.

- [ ] **Step 1: Написать падающий тест**

`content/attention/toy-model.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { EMBEDDINGS, pronounAttention, sentence, type Variant } from './toy-model'

const VARIANTS: Variant[] = ['tall', 'tired']

describe('toy model of the «он» riddle', () => {
  it('has a 3-number embedding for every token of both sentences', () => {
    for (const v of VARIANTS) for (const token of sentence(v)) expect(EMBEDDINGS[token], token).toHaveLength(3)
  })

  it('makes «он» look at «забор» when the fence is tall', () => {
    const { tokens, weights, target } = pronounAttention('tall')
    const fence = weights[tokens.indexOf('забор')]
    const cat = weights[tokens.indexOf('кот')]
    expect(target).toBe('забор')
    expect(fence).toBeGreaterThan(0.6)
    expect(fence / cat).toBeGreaterThan(5)
  })

  it('makes «он» look at «кот» when the cat is tired', () => {
    const { tokens, weights, target } = pronounAttention('tired')
    const fence = weights[tokens.indexOf('забор')]
    const cat = weights[tokens.indexOf('кот')]
    expect(target).toBe('кот')
    expect(cat).toBeGreaterThan(0.6)
    expect(cat / fence).toBeGreaterThan(5)
  })

  it('produces a probability distribution over the sentence', () => {
    for (const v of VARIANTS) {
      const { weights, tokens } = pronounAttention(v)
      expect(weights).toHaveLength(tokens.length)
      expect(weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1)
    }
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- content/attention/toy-model`
Expected: FAIL — `Failed to resolve import "./toy-model"`.

- [ ] **Step 3: Реализовать модель**

`content/attention/toy-model.ts`:

```ts
import { attention, matVec, add, type Mat, type Vec } from '@/lib/math'

/** Оси игрушечного пространства смыслов (d = 3). */
export const AXES = ['живое', 'высокое', 'предмет'] as const

export type Variant = 'tall' | 'tired'

export const ADJECTIVE: Record<Variant, string> = { tall: 'высоким', tired: 'уставшим' }

const BASE_TOKENS = ['кот', 'не', 'перепрыгнул', 'через', 'забор', 'потому', 'что', 'он', 'был', 'слишком'] as const

/** Векторы слов: [живое, высокое, предмет]. Прилагательные — «свойства», поэтому предметность у них отрицательная. */
export const EMBEDDINGS: Record<string, Vec> = {
  кот: [1, 0, 1],
  забор: [0, 1, 1],
  он: [0, 0, 0.5],
  высоким: [0, 1, -0.5],
  уставшим: [1, 0, -0.5],
  перепрыгнул: [0.3, 0.3, 0],
  не: [0, 0, 0],
  через: [0, 0, 0],
  потому: [0, 0, 0],
  что: [0, 0, 0],
  был: [0, 0, 0],
  слишком: [0, 0, 0],
}

const IDENTITY: Mat = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

/** Шаг 1: «он» перенимает у прилагательного свойство (живое/высокое), но не «предметность». */
export const W_V1: Mat = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
]

/** Шаг 2: запрос ищет совпадение свойства (×3) и предметность (×6); ключ и значение — само слово. */
export const W_Q: Mat = [
  [3, 0, 0],
  [0, 3, 0],
  [0, 0, 6],
]
export const W_K: Mat = IDENTITY
export const W_V: Mat = IDENTITY

export function sentence(variant: Variant): string[] {
  return [...BASE_TOKENS, ADJECTIVE[variant]]
}

/** Вектор «он» после первого шага: «он» + свойство прилагательного. */
export function contextualizePronoun(variant: Variant): Vec {
  return add(EMBEDDINGS['он'], matVec(W_V1, EMBEDDINGS[ADJECTIVE[variant]]))
}

export interface PronounAttention {
  tokens: string[]
  weights: number[]
  target: string
}

/** Внимание обогащённого «он» ко всем словам фразы (одна строка softmax(qKᵀ/√3)). */
export function pronounAttention(variant: Variant): PronounAttention {
  const tokens = sentence(variant)
  const query = matVec(W_Q, contextualizePronoun(variant))
  const keys = tokens.map((t) => matVec(W_K, EMBEDDINGS[t]))
  const values = tokens.map((t) => matVec(W_V, EMBEDDINGS[t]))
  const weights = attention([query], keys, values).weights[0]
  const target = tokens[weights.indexOf(Math.max(...weights))]
  return { tokens, weights, target }
}
```

- [ ] **Step 4: Запустить тест**

Run: `npm test -- content/attention/toy-model`
Expected: PASS (4 tests). Ожидаемые веса: «забор» ≈ 0.64, «кот» ≈ 0.11 для `tall`; симметрично для `tired`.

- [ ] **Step 5: Commit**

```bash
git add content/attention/toy-model.ts content/attention/toy-model.test.ts
git commit -m "feat(content): toy 3D model that resolves the «он» riddle with real attention math" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: MDX-конвейер: шаги из `---`, загрузка урока, страница урока

**Files:**
- Create: `lib/mdx/remark-steps.mjs`, `lib/mdx/remark-steps.d.mts`, `lib/course/lesson-module.ts`, `components/lesson/engine/LessonStep.tsx` (временная версия), `components/lesson/engine/LessonPager.tsx`, `app/courses/[course]/[lesson]/page.tsx`, `content/attention/lessons/0-1-riddle.mdx` (черновик)
- Modify: `next.config.ts`, `mdx-components.tsx`, `content/attention/course.ts`
- Test: `lib/mdx/remark-steps.test.tsx`

**Interfaces:**
- Consumes: реестр курса (Task 3), `Card`, `LessonMetadata` (Task 3).
- Produces:
  - remark-плагин `remarkSteps`: верхнеуровневое содержимое MDX между `---` оборачивается в `<LessonStep index="i" total="n">`; ESM-экспорты остаются на верхнем уровне; пустые шаги не создаются.
  - `LessonModule { default: ComponentType; metadata: LessonMetadata; cards: Card[] }`, `loadLessonModule(courseId: string, slug: string): Promise<LessonModule>`.
  - `LessonStep({ index: string; total: string; children })` — в этой задаче просто `<section data-step={index}>`; гейтинг добавит Task 8.
  - `LessonPager({ courseId, prev?, next? })`.
  - Маршрут `/courses/[course]/[lesson]` со статической генерацией.

- [ ] **Step 1: Написать падающий тест плагина**

`lib/mdx/remark-steps.test.tsx`:

```tsx
// @vitest-environment node
import { evaluate } from '@mdx-js/mdx'
import { createElement, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import remarkSteps from './remark-steps.mjs'

function Step({ index, total, children }: { index: string; total: string; children?: ReactNode }) {
  return createElement('section', { 'data-step': index, 'data-total': total }, children)
}

function Badge({ children }: { children?: ReactNode }) {
  return createElement('mark', null, children)
}

async function render(source: string) {
  const mod = await evaluate(source, { ...runtime, remarkPlugins: [remarkSteps] })
  const html = renderToStaticMarkup(createElement(mod.default, { components: { LessonStep: Step, Badge } }))
  return { html, mod }
}

function stepBody(html: string, index: number): string {
  const match = html.match(new RegExp(`<section data-step="${index}"[^>]*>([\\s\\S]*?)</section>`))
  return match?.[1] ?? ''
}

describe('remarkSteps', () => {
  it('wraps content between --- into numbered steps', async () => {
    const { html } = await render('# Один\n\nтекст\n\n---\n\n## Два\n\nещё')
    expect(html.match(/<section/g)).toHaveLength(2)
    expect(html).toContain('data-total="2"')
    expect(stepBody(html, 0)).toContain('Один')
    expect(stepBody(html, 0)).not.toContain('Два')
    expect(stepBody(html, 1)).toContain('Два')
  })

  it('makes a single step when there is no ---', async () => {
    const { html } = await render('Просто текст.')
    expect(html.match(/<section/g)).toHaveLength(1)
    expect(html).toContain('data-total="1"')
  })

  it('never creates empty steps from leading, trailing or repeated ---', async () => {
    const { html } = await render('---\n\nА\n\n---\n\n---\n\nБ\n\n---\n')
    expect(html.match(/<section/g)).toHaveLength(2)
  })

  it('keeps exports at module level and JSX components inside steps', async () => {
    const { html, mod } = await render('export const cards = [1, 2]\n\n<Badge>важно</Badge>\n\n---\n\nдальше')
    expect(mod.cards).toEqual([1, 2])
    expect(stepBody(html, 0)).toContain('<mark>важно</mark>')
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- lib/mdx`
Expected: FAIL — `Failed to resolve import "./remark-steps.mjs"`.

- [ ] **Step 3: Реализовать плагин и его типы**

`lib/mdx/remark-steps.mjs` (обычный JS: плагин загружается Node-лоадером MDX, TypeScript там не компилируется):

```js
/**
 * remark-плагин: делит верхний уровень MDX-урока по горизонтальным чертам (---)
 * и оборачивает каждую часть в <LessonStep index="i" total="n">.
 * ESM-узлы (import/export) остаются на верхнем уровне. Пустые части отбрасываются.
 */
export default function remarkSteps() {
  return (tree) => {
    const moduleLevel = []
    const groups = [[]]
    for (const node of tree.children) {
      if (node.type === 'mdxjsEsm' || node.type === 'yaml') {
        moduleLevel.push(node)
      } else if (node.type === 'thematicBreak') {
        groups.push([])
      } else {
        groups[groups.length - 1].push(node)
      }
    }
    const steps = groups.filter((group) => group.length > 0)
    tree.children = [
      ...moduleLevel,
      ...steps.map((children, index) => ({
        type: 'mdxJsxFlowElement',
        name: 'LessonStep',
        attributes: [
          { type: 'mdxJsxAttribute', name: 'index', value: String(index) },
          { type: 'mdxJsxAttribute', name: 'total', value: String(steps.length) },
        ],
        children,
      })),
    ]
  }
}
```

`lib/mdx/remark-steps.d.mts`:

```ts
export default function remarkSteps(): (tree: { children: unknown[] }) => void
```

- [ ] **Step 4: Запустить тест**

Run: `npm test -- lib/mdx`
Expected: PASS (4 tests).

- [ ] **Step 5: Подключить плагин к Next.js**

`next.config.ts` — заменить блок `createMDX`:

```ts
const withMDX = createMDX({
  options: {
    // Turbopack принимает плагины только строками; локальный путь резолвится от корня проекта
    remarkPlugins: ['remark-gfm', 'remark-math', './lib/mdx/remark-steps.mjs'],
    rehypePlugins: ['rehype-katex'],
  },
})
```

- [ ] **Step 6: Временный `LessonStep`, реестр MDX-компонентов, загрузчик урока, навигация**

`components/lesson/engine/LessonStep.tsx` (временная версия; гейтинг добавит Task 8):

```tsx
import type { ReactNode } from 'react'

export function LessonStep({ index, children }: { index: string; total: string; children?: ReactNode }) {
  return (
    <section data-step={index} className="lesson-step">
      {children}
    </section>
  )
}
```

`mdx-components.tsx` (полностью):

```tsx
import type { MDXComponents } from 'mdx/types'
import { LessonStep } from '@/components/lesson/engine/LessonStep'

const components: MDXComponents = {
  LessonStep,
}

export function useMDXComponents(): MDXComponents {
  return components
}
```

`lib/course/lesson-module.ts`:

```ts
import type { ComponentType } from 'react'
import type { Card, LessonMetadata } from './types'

export interface LessonModule {
  default: ComponentType
  metadata: LessonMetadata
  cards: Card[]
}

export async function loadLessonModule(courseId: string, slug: string): Promise<LessonModule> {
  const mod = (await import(`@/content/${courseId}/lessons/${slug}.mdx`)) as Partial<LessonModule>
  if (!mod.default || !mod.metadata) {
    throw new Error(`Lesson ${courseId}/${slug} must export default content and \`metadata\``)
  }
  return { default: mod.default, metadata: mod.metadata, cards: mod.cards ?? [] }
}
```

`components/lesson/engine/LessonPager.tsx`:

```tsx
import Link from 'next/link'
import type { FlatLesson } from '@/lib/course/types'

export function LessonPager({ courseId, prev, next }: { courseId: string; prev?: FlatLesson; next?: FlatLesson }) {
  return (
    <nav aria-label="Соседние уроки" className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {prev ? (
        <Link href={`/courses/${courseId}/${prev.slug}`} className="rounded-xl border border-line p-4 hover:border-ink">
          <span className="gate-label">← Предыдущий урок</span>
          <span className="mt-1 block font-serif">
            {prev.id} {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/courses/${courseId}/${next.slug}`}
          className="rounded-xl border border-line p-4 text-right hover:border-ink sm:col-start-2"
        >
          <span className="gate-label">Следующий урок →</span>
          <span className="mt-1 block font-serif">
            {next.id} {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}
```

- [ ] **Step 7: Страница урока**

`app/courses/[course]/[lesson]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LessonPager } from '@/components/lesson/engine/LessonPager'
import { loadLessonModule } from '@/lib/course/lesson-module'
import { findLesson, getCourse, listCourses, neighbors, readyLessons } from '@/lib/course/registry'

type Params = { course: string; lesson: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return listCourses().flatMap((c) => readyLessons(c).map((l) => ({ course: c.id, lesson: l.slug })))
}

async function resolveLesson(params: Promise<Params>) {
  const { course: courseId, lesson: slug } = await params
  const course = getCourse(courseId)
  const lesson = course ? findLesson(course, slug) : undefined
  if (!course || !lesson || lesson.availability !== 'ready') notFound()
  return { course, lesson, mod: await loadLessonModule(course.id, lesson.slug) }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lesson, mod } = await resolveLesson(params)
  return {
    title: `${lesson.id} ${lesson.title}`,
    description: mod.metadata.description,
    openGraph: { title: lesson.title, description: mod.metadata.description, type: 'article' },
  }
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { course, lesson, mod } = await resolveLesson(params)
  const { prev, next } = neighbors(course, lesson.slug)
  const Content = mod.default

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 lg:px-8">
      <article className="min-w-0 flex-1">
        <header className="mx-auto mb-10 max-w-[680px] lg:mx-0">
          <p className="gate-label">
            Модуль {lesson.moduleNumber} · {lesson.moduleTitle} · урок {lesson.id} · {lesson.minutes} мин
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">{lesson.title}</h1>
          <p className="mt-3 text-ink-soft">{mod.metadata.description}</p>
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            {mod.metadata.objectives.map((o) => (
              <li key={o}>✦ {o}</li>
            ))}
          </ul>
        </header>
        <div className="prose-lesson mx-auto max-w-[680px] lg:mx-0">
          <Content />
        </div>
        <div className="mx-auto max-w-[680px] lg:mx-0">
          <LessonPager courseId={course.id} prev={prev} next={next} />
        </div>
      </article>
    </div>
  )
}
```

- [ ] **Step 8: Черновик урока 0.1 и его готовность**

`content/attention/lessons/0-1-riddle.mdx` (черновик; Task 17 заменит его настоящим уроком):

```mdx
export const metadata = {
  description: 'Черновик: проверяем, что урок собирается из шагов и формул.',
  objectives: ['Проверить конвейер MDX'],
}

export const cards = []

## Шаг первый

Формула в строке: $a \cdot b = \sum_i a_i b_i$.

---

## Шаг второй

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$
```

`content/attention/course.ts` — пометить урок 0.1 готовым. Заменить строку модуля 0:

```ts
      lessons: [
        { ...lesson('0.1', '0-1-riddle', 'Загадка «он»', 10), availability: 'ready' },
        lesson('0.2', '0-2-journey-map', 'Карта путешествия', 8),
      ],
```

- [ ] **Step 9: Проверить сборку**

Run: `npm run typecheck && npm test && npm run build`
Expected: всё зелёное; файл `out/courses/attention/0-1-riddle.html` существует.

Run: `grep -c 'data-step="1"' out/courses/attention/0-1-riddle.html && grep -c 'class="katex' out/courses/attention/0-1-riddle.html`
Expected: оба числа ≥ 1 (шаги нарезаны, формулы отрисованы KaTeX).

Если сборка падает на `{` внутри формулы (MDX принял фигурные скобки за выражение), проверить, что `remark-math` стоит в `remarkPlugins` **до** `./lib/mdx/remark-steps.mjs`, и пересобрать.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(lesson): MDX pipeline splitting lessons into steps, lesson route and pager" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Движок урока: шаги, «ворота», прогресс

**Files:**
- Create: `lib/react/use-isomorphic-layout-effect.ts`, `components/lesson/engine/LessonContext.tsx`, `components/lesson/engine/StepContext.ts`, `components/lesson/engine/useGate.ts`, `components/lesson/engine/LessonStatusBadge.tsx`
- Modify: `components/lesson/engine/LessonStep.tsx` (полная замена), `app/courses/[course]/[lesson]/page.tsx`, `app/layout.tsx`
- Test: `components/lesson/engine/LessonStep.test.tsx`

**Interfaces:**
- Consumes: `useProgress`, `useHydrated`, `todayISO` (Tasks 4–5), `lessonsBefore`, `loadLessonModule` (Tasks 3, 7), `ProgressHydrator` (Task 5).
- Produces:
  - `LessonProvider({ lessonId: string; lessonCardIds: string[]; recallCards: Card[]; children })`, `useLesson(): LessonContextValue` (бросает вне провайдера), `useLessonOptional(): LessonContextValue | null`.
  - `StepContext`, `useStep(): { index: number; registerGate(gateId: string): () => void } | null`.
  - `useGate(id: string): GateApi`, где
    `GateApi = { passed: boolean; attempts: number; revealed: boolean; choice?: number; record(correct: boolean, choice?: number): void; pass(): void; reveal(card?: Card): void }`.
    При монтировании «ворота» регистрируются в ближайшем шаге.
  - `LessonStep`: атрибуты `data-step="i"` и `data-state="open" | "teaser" | "locked"`; на текущем шаге кнопка «Дальше →» (или «Завершить урок ✓» на последнем), неактивная, пока не пройдены все «ворота» шага.
  - `useIsomorphicLayoutEffect`.

- [ ] **Step 1: Написать падающий тест**

`components/lesson/engine/LessonStep.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { LessonStep } from './LessonStep'
import { useGate } from '@/components/lesson/engine/useGate'

function FakeGate({ id }: { id: string }) {
  const gate = useGate(id)
  return (
    <button type="button" onClick={() => gate.record(true)}>
      {gate.passed ? 'gate passed' : 'pass gate'}
    </button>
  )
}

function Lesson() {
  return (
    <LessonProvider lessonId="9.1" lessonCardIds={['c1']} recallCards={[]}>
      <LessonStep index="0" total="3">
        <p>Шаг ноль</p>
      </LessonStep>
      <LessonStep index="1" total="3">
        <p>Шаг один</p>
        <FakeGate id="g1" />
      </LessonStep>
      <LessonStep index="2" total="3">
        <p>Шаг два</p>
      </LessonStep>
    </LessonProvider>
  )
}

const step = (i: number) => document.querySelector(`[data-step="${i}"]`)!

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('LessonStep', () => {
  it('shows the first step, a teaser of the second and hides the rest', () => {
    render(<Lesson />)
    expect(step(0)).toHaveAttribute('data-state', 'open')
    expect(step(1)).toHaveAttribute('data-state', 'teaser')
    expect(step(2)).toHaveAttribute('data-state', 'locked')
    expect(step(2)).not.toBeVisible()
  })

  it('unlocks the next step with «Дальше» when the step has no gates', async () => {
    render(<Lesson />)
    await userEvent.click(screen.getByRole('button', { name: 'Дальше →' }))
    expect(step(1)).toHaveAttribute('data-state', 'open')
    expect(useProgress.getState().lessons['9.1'].unlockedStep).toBe(1)
  })

  it('keeps «Дальше» disabled until every gate of the step passes', async () => {
    useProgress.getState().unlockStep('9.1', 1)
    render(<Lesson />)
    const next = screen.getByRole('button', { name: 'Дальше →' })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'pass gate' }))
    expect(next).toBeEnabled()
  })

  it('completes the lesson on the last step and enrolls its cards', async () => {
    useProgress.getState().unlockStep('9.1', 2)
    useProgress.getState().recordAttempt('g1', true)
    render(<Lesson />)
    await userEvent.click(screen.getByRole('button', { name: 'Завершить урок ✓' }))
    expect(useProgress.getState().lessons['9.1'].status).toBe('completed')
    expect(useProgress.getState().cards.c1?.box).toBe(1)
  })

  it('opens every step of a completed lesson and shows no step buttons', () => {
    useProgress.getState().completeLesson('9.1', [], '2026-10-20')
    render(<Lesson />)
    for (const i of [0, 1, 2]) expect(step(i)).toHaveAttribute('data-state', 'open')
    expect(screen.queryByRole('button', { name: 'Дальше →' })).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- components/lesson/engine/LessonStep`
Expected: FAIL — `Failed to resolve import "./LessonContext"`.

- [ ] **Step 3: Контексты и хук «ворот»**

`lib/react/use-isomorphic-layout-effect.ts`:

```ts
import { useEffect, useLayoutEffect } from 'react'

/** useLayoutEffect в браузере, useEffect на сервере (там layout-эффекты не выполняются). */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
```

`components/lesson/engine/LessonContext.tsx`:

```tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'

export interface LessonContextValue {
  lessonId: string
  /** Карточки этого урока: попадут в колоду при завершении. */
  lessonCardIds: string[]
  /** Карточки предыдущих уроков: материал для разминки. */
  recallCards: Card[]
}

const LessonContext = createContext<LessonContextValue | null>(null)

export function LessonProvider({ children, ...value }: LessonContextValue & { children: ReactNode }) {
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
}

export function useLesson(): LessonContextValue {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used inside <LessonProvider>')
  return ctx
}

export function useLessonOptional(): LessonContextValue | null {
  return useContext(LessonContext)
}
```

`components/lesson/engine/StepContext.ts`:

```ts
'use client'

import { createContext, useContext } from 'react'

export interface StepContextValue {
  index: number
  /** Регистрирует «ворота» в шаге; возвращает функцию отмены регистрации. */
  registerGate: (gateId: string) => () => void
}

export const StepContext = createContext<StepContextValue | null>(null)

export function useStep(): StepContextValue | null {
  return useContext(StepContext)
}
```

`components/lesson/engine/useGate.ts`:

```ts
'use client'

import { useCallback } from 'react'
import type { Card } from '@/lib/course/types'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useIsomorphicLayoutEffect } from '@/lib/react/use-isomorphic-layout-effect'
import { useStep } from './StepContext'

export interface GateApi {
  passed: boolean
  attempts: number
  revealed: boolean
  choice?: number
  record: (correct: boolean, choice?: number) => void
  pass: () => void
  reveal: (card?: Card) => void
}

export function useGate(id: string): GateApi {
  const registerGate = useStep()?.registerGate
  useIsomorphicLayoutEffect(() => registerGate?.(id), [registerGate, id])

  const gate = useProgress((s) => s.gates[id])
  const recordAttempt = useProgress((s) => s.recordAttempt)
  const passGate = useProgress((s) => s.passGate)
  const revealGate = useProgress((s) => s.revealGate)

  const record = useCallback((correct: boolean, choice?: number) => recordAttempt(id, correct, choice), [recordAttempt, id])
  const pass = useCallback(() => passGate(id), [passGate, id])
  const reveal = useCallback((card?: Card) => revealGate(id, card, todayISO()), [revealGate, id])

  return {
    passed: gate?.passed ?? false,
    attempts: gate?.attempts ?? 0,
    revealed: gate?.revealed ?? false,
    choice: gate?.choice,
    record,
    pass,
    reveal,
  }
}
```

- [ ] **Step 4: `LessonStep` с гейтингом** (полностью заменить файл)

`components/lesson/engine/LessonStep.tsx`:

```tsx
'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'
import { useLesson } from '@/components/lesson/engine/LessonContext'
import { StepContext } from './StepContext'

export function LessonStep({ index, total, children }: { index: string; total: string; children?: ReactNode }) {
  const i = Number(index)
  const n = Number(total)
  const { lessonId, lessonCardIds } = useLesson()
  const hydrated = useHydrated()
  const lesson = useProgress((s) => s.lessons[lessonId])
  const gates = useProgress((s) => s.gates)
  const unlockStep = useProgress((s) => s.unlockStep)
  const completeLesson = useProgress((s) => s.completeLesson)
  const [gateIds, setGateIds] = useState<string[]>([])

  const registerGate = useCallback((id: string) => {
    setGateIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    return () => setGateIds((ids) => ids.filter((x) => x !== id))
  }, [])
  const stepContext = useMemo(() => ({ index: i, registerGate }), [i, registerGate])

  const completed = lesson?.status === 'completed'
  const unlockedStep = lesson?.unlockedStep ?? 0
  // До загрузки прогресса показываем всё — так совпадает серверный HTML (и его видят поисковики).
  const open = !hydrated || completed || i <= unlockedStep
  const teaser = hydrated && !completed && i === unlockedStep + 1
  const current = hydrated && !completed && i === unlockedStep
  const allPassed = gateIds.every((id) => gates[id]?.passed)
  const isLast = i === n - 1

  function goNext() {
    unlockStep(lessonId, i + 1)
    requestAnimationFrame(() =>
      document.querySelector(`[data-step="${i + 1}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  if (!open && !teaser) {
    return (
      <StepContext.Provider value={stepContext}>
        <section data-step={i} data-state="locked" hidden>
          {children}
        </section>
      </StepContext.Provider>
    )
  }

  return (
    <StepContext.Provider value={stepContext}>
      <section data-step={i} data-state={teaser ? 'teaser' : 'open'} className="lesson-step relative">
        {teaser ? (
          <>
            <div inert aria-hidden className="max-h-44 overflow-hidden opacity-50 blur-[3px] select-none">
              {children}
            </div>
            <div className="lock-pill">🔒 Сначала пройди шаг выше</div>
          </>
        ) : (
          children
        )}
        {current && (
          <div className="step-footer">
            {isLast ? (
              <button
                type="button"
                className="btn-primary"
                disabled={!allPassed}
                onClick={() => completeLesson(lessonId, lessonCardIds, todayISO())}
              >
                Завершить урок ✓
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={!allPassed} onClick={goNext}>
                Дальше →
              </button>
            )}
            {!allPassed && <span className="text-sm text-muted">Ответь на вопрос выше, чтобы продолжить</span>}
          </div>
        )}
      </section>
    </StepContext.Provider>
  )
}
```

- [ ] **Step 5: Запустить тест**

Run: `npm test -- components/lesson/engine/LessonStep`
Expected: PASS (5 tests).

- [ ] **Step 6: Значок «урок пройден», провайдер на странице, гидратор в layout**

`components/lesson/engine/LessonStatusBadge.tsx`:

```tsx
'use client'

import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function LessonStatusBadge({ lessonId }: { lessonId: string }) {
  const hydrated = useHydrated()
  const completed = useProgress((s) => s.lessons[lessonId]?.status === 'completed')
  if (!hydrated || !completed) return null
  return (
    <p className="mt-4 inline-flex rounded-full bg-success-bg px-3 py-1 text-sm text-success">
      ✓ Урок пройден — все шаги открыты, его можно перечитывать как справочник
    </p>
  )
}
```

`app/courses/[course]/[lesson]/page.tsx` — изменить импорты и тело `LessonPage`:

```tsx
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { LessonStatusBadge } from '@/components/lesson/engine/LessonStatusBadge'
import { findLesson, getCourse, lessonsBefore, listCourses, neighbors, readyLessons } from '@/lib/course/registry'
```

```tsx
export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { course, lesson, mod } = await resolveLesson(params)
  const { prev, next } = neighbors(course, lesson.slug)
  const previous = await Promise.all(lessonsBefore(course, lesson.slug).map((l) => loadLessonModule(course.id, l.slug)))
  const Content = mod.default

  return (
    <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 lg:px-8">
      <article className="min-w-0 flex-1">
        <header className="mx-auto mb-10 max-w-[680px] lg:mx-0">
          <p className="gate-label">
            Модуль {lesson.moduleNumber} · {lesson.moduleTitle} · урок {lesson.id} · {lesson.minutes} мин
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">{lesson.title}</h1>
          <p className="mt-3 text-ink-soft">{mod.metadata.description}</p>
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            {mod.metadata.objectives.map((o) => (
              <li key={o}>✦ {o}</li>
            ))}
          </ul>
          <LessonStatusBadge lessonId={lesson.id} />
        </header>
        <LessonProvider
          lessonId={lesson.id}
          lessonCardIds={mod.cards.map((c) => c.id)}
          recallCards={previous.flatMap((m) => m.cards)}
        >
          <div className="prose-lesson mx-auto max-w-[680px] lg:mx-0">
            <Content />
          </div>
        </LessonProvider>
        <div className="mx-auto max-w-[680px] lg:mx-0">
          <LessonPager courseId={course.id} prev={prev} next={next} />
        </div>
      </article>
    </div>
  )
}
```

`app/layout.tsx` — добавить импорт и гидратор в `<body>`:

```tsx
import { ProgressHydrator } from '@/components/progress/ProgressHydrator'
```

```tsx
      <body className="min-h-dvh antialiased">
        <ProgressHydrator />
        {children}
      </body>
```

- [ ] **Step 7: Проверить всё вместе**

Run: `npm run typecheck && npm test && npm run build`
Expected: всё зелёное.

Run: `npm run serve:out` (в фоне), открыть `http://localhost:3100/courses/attention/0-1-riddle`.
Expected: первый шаг открыт, второй размыт с плашкой «🔒 Сначала пройди шаг выше». Кнопка «Дальше →» открывает второй шаг, и после перезагрузки он остаётся открытым. Остановить сервер.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(lesson): progressive steps with gates, lesson context and persisted unlocking" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: «Ворота» вопросов: `Check`, `Predict`, `ExplainBack`

**Files:**
- Create: `lib/parse-number.ts`, `components/lesson/gates/Check.tsx`, `components/lesson/gates/Predict.tsx`, `components/lesson/gates/ExplainBack.tsx`
- Modify: `mdx-components.tsx`
- Test: `lib/parse-number.test.ts`, `components/lesson/gates/gates.test.tsx`

**Interfaces:**
- Consumes: `useGate` (Task 8), `useProgress` (Task 5), `Card` (Task 3).
- Produces:
  - `parseNumber(input: string): number | null` — принимает `0,5`, `−4` (U+2212), пробелы, `+2`, `.5`; иначе `null`.
  - `<Check id question options? answer tolerance? explain? feedback? />`: `question: string`, `options?: string[]` (нет — значит числовой ответ), `answer: number` (индекс варианта или число), `tolerance = 0.01`, `explain?: ReactNode`, `feedback?: string[]` (по вариантам). После 2 ошибок — «Показать ответ» → `reveal(card)` с карточкой `check:<id>`.
  - `<Predict id question options answer?>…</Predict>`: проходится любым ответом; `children` открываются после фиксации прогноза.
  - `<ExplainBack id prompt reference points />`: `reference: ReactNode`, `points: string[]`.

- [ ] **Step 1: Написать падающие тесты**

`lib/parse-number.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseNumber } from './parse-number'

describe('parseNumber', () => {
  it.each([
    ['0,5', 0.5],
    ['0.5', 0.5],
    [' 2 ', 2],
    ['−4', -4],
    ['-4', -4],
    ['+2', 2],
    ['.5', 0.5],
    ['3.', 3],
    ['1 000', 1000],
    ['−4,0', -4],
  ])('reads %j as %d', (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })

  it.each(['', '   ', 'два', '1,2,3', '1e3', '--1'])('rejects %j', (input) => {
    expect(parseNumber(input)).toBeNull()
  })
})
```

`components/lesson/gates/gates.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { Check } from './Check'
import { ExplainBack } from './ExplainBack'
import { Predict } from './Predict'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

const gates = () => useProgress.getState().gates

describe('Check with options', () => {
  const props = {
    id: 'q1',
    question: 'Сколько будет 2 + 2?',
    options: ['3', '4', '5'],
    answer: 1,
    explain: 'Потому что 4.',
    feedback: ['Чуть больше.', '', 'Чуть меньше.'],
  }

  it('passes on the right answer and shows the explanation', async () => {
    render(<Check {...props} />)
    await userEvent.click(screen.getByRole('radio', { name: '4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('✓ Верно!')).toBeInTheDocument()
    expect(screen.getByText('Потому что 4.')).toBeInTheDocument()
    expect(gates().q1.passed).toBe(true)
  })

  it('gives option-specific feedback and offers the answer only after two tries', async () => {
    render(<Check {...props} />)
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('Чуть больше.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Показать ответ' })).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))

    expect(gates().q1).toMatchObject({ passed: true, revealed: true })
    expect(useProgress.getState().customCards['check:q1']).toMatchObject({ kind: 'choice', correct: 1 })
    expect(screen.getByText(/Ответ: 4/)).toBeInTheDocument()
  })
})

describe('Check with a number', () => {
  it('accepts a decimal comma', async () => {
    render(<Check id="q2" question="Половина от единицы?" answer={0.5} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Твой ответ' }), '0,5')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(gates().q2.passed).toBe(true)
  })

  it('asks for a number instead of counting a non-numeric attempt', async () => {
    render(<Check id="q3" question="Сколько?" answer={2} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Твой ответ' }), 'два')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('Введи число, например 0.5 или −2')).toBeInTheDocument()
    expect(gates().q3).toBeUndefined()
  })
})

describe('Predict', () => {
  const question = 'Кто здесь «он»?'

  it('accepts any prediction, then reveals the explanation', async () => {
    render(
      <Predict id="p1" question={question} options={['кот', 'забор']} answer={1}>
        <p>Объяснение</p>
      </Predict>,
    )
    expect(screen.queryByText('Объяснение')).toBeNull()
    expect(screen.getByRole('button', { name: 'Зафиксировать прогноз' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: 'кот' }))
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать прогноз' }))
    expect(screen.getByText('Объяснение')).toBeInTheDocument()
    expect(screen.getByText(/На самом деле — «забор»/)).toBeInTheDocument()
    expect(gates().p1).toMatchObject({ passed: true, choice: 0 })
  })

  it('celebrates a correct prediction', async () => {
    render(<Predict id="p2" question={question} options={['кот', 'забор']} answer={1} />)
    await userEvent.click(screen.getByRole('radio', { name: 'забор' }))
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать прогноз' }))
    expect(screen.getByText('Так и есть!')).toBeInTheDocument()
  })
})

describe('ExplainBack', () => {
  it('needs a real attempt before the reference, then passes on «Готово»', async () => {
    render(<ExplainBack id="e1" prompt="Объясни" reference={<span>Эталон</span>} points={['пункт А']} />)
    const compare = screen.getByRole('button', { name: 'Сравнить с эталоном' })
    expect(compare).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Твоё объяснение' }), 'Короткий, но настоящий ответ')
    expect(compare).toBeEnabled()
    await userEvent.click(compare)
    expect(screen.getByText('Эталон')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Готово, я сравнил' }))
    expect(gates().e1.passed).toBe(true)
    expect(useProgress.getState().explanations.e1).toBe('Короткий, но настоящий ответ')
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/parse-number components/lesson/gates/gates`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: `parseNumber`**

`lib/parse-number.ts`:

```ts
/** Разбирает число, введённое человеком: «0,5», «−4» (типографский минус), «1 000». */
export function parseNumber(input: string): number | null {
  const cleaned = input
    .replace(/[\s ]/g, '')
    .replace(/[−–]/g, '-')
    .replace(',', '.')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null
  return Number(cleaned)
}
```

- [ ] **Step 4: `Check`**

`components/lesson/gates/Check.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'
import { parseNumber } from '@/lib/parse-number'
import { useGate } from '@/components/lesson/engine/useGate'

export interface CheckProps {
  id: string
  question: string
  /** Варианты ответа; если не заданы — ответ вводится числом. */
  options?: string[]
  /** Индекс верного варианта или верное число. */
  answer: number
  tolerance?: number
  explain?: ReactNode
  /** Пояснение для каждого неверного варианта. */
  feedback?: string[]
}

export function Check({ id, question, options, answer, tolerance = 0.01, explain, feedback }: CheckProps) {
  const gate = useGate(id)
  const [selected, setSelected] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState<'wrong' | 'not-a-number' | null>(null)
  const solved = gate.passed

  function submit() {
    if (options) {
      if (selected === null) return
      const correct = selected === answer
      setVerdict(correct ? null : 'wrong')
      gate.record(correct)
      return
    }
    const value = parseNumber(text)
    if (value === null) {
      setVerdict('not-a-number')
      return
    }
    const correct = Math.abs(value - answer) <= tolerance
    setVerdict(correct ? null : 'wrong')
    gate.record(correct)
  }

  function revealAnswer() {
    const card: Card = options
      ? { id: `check:${id}`, kind: 'choice', prompt: question, options, correct: answer, answer: options[answer] }
      : { id: `check:${id}`, kind: 'flip', prompt: question, answer: String(answer) }
    gate.reveal(card)
  }

  const answerText = options ? options[answer] : String(answer)
  const wrongText =
    (options && selected !== null && feedback?.[selected]) || 'Пока нет. Подумай ещё раз — ты справишься.'

  return (
    <div className="gate-card" data-gate="check" data-passed={solved}>
      <p className="gate-label">Проверь себя</p>
      <p className="gate-question">{question}</p>

      {options ? (
        <div role="radiogroup" aria-label={question} className="mt-3 flex flex-col gap-2">
          {options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected === i}
              className="option-btn"
              data-selected={selected === i}
              data-right={solved && i === answer}
              disabled={solved}
              onClick={() => {
                setSelected(i)
                setVerdict(null)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          aria-label="Твой ответ"
          className="text-input"
          value={solved && text === '' ? answerText : text}
          disabled={solved}
          onChange={(e) => {
            setText(e.target.value)
            setVerdict(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
      )}

      {!solved && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={options ? selected === null : text.trim() === ''}
          >
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={revealAnswer}>
              Показать ответ
            </button>
          )}
        </div>
      )}

      {!solved && verdict === 'wrong' && (
        <p role="status" className="feedback-wrong">
          {wrongText}
        </p>
      )}
      {!solved && verdict === 'not-a-number' && (
        <p role="status" className="feedback-wrong">
          Введи число, например 0.5 или −2
        </p>
      )}
      {solved && (
        <div role="status" className="feedback-right">
          <p className="m-0">
            {gate.revealed ? `Ответ: ${answerText}. Этот вопрос вернётся к тебе на повторении.` : '✓ Верно!'}
          </p>
          {explain && <div className="mt-2 text-ink">{explain}</div>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: `Predict`**

`components/lesson/gates/Predict.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'

export interface PredictProps {
  id: string
  question: string
  options: string[]
  /** Верный вариант, если он есть (тогда после прогноза покажем, угадал ли ученик). */
  answer?: number
  children?: ReactNode
}

export function Predict({ id, question, options, answer, children }: PredictProps) {
  const gate = useGate(id)
  const [selected, setSelected] = useState<number | null>(null)
  const committed = gate.passed
  const choice = committed ? (gate.choice ?? null) : selected

  return (
    <div className="gate-card" data-gate="predict" data-passed={committed}>
      <p className="gate-label">Предскажи</p>
      <p className="gate-question">{question}</p>
      <div role="radiogroup" aria-label={question} className="mt-3 flex flex-col gap-2">
        {options.map((option, i) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={choice === i}
            className="option-btn"
            data-selected={choice === i}
            data-right={committed && answer === i}
            disabled={committed}
            onClick={() => setSelected(i)}
          >
            {option}
          </button>
        ))}
      </div>

      {!committed && (
        <button
          type="button"
          className="btn-primary mt-3"
          disabled={selected === null}
          onClick={() => selected !== null && gate.record(true, selected)}
        >
          Зафиксировать прогноз
        </button>
      )}

      {committed && (
        <div className="mt-4">
          {choice !== null && (
            <p className="text-sm text-ink-soft">
              Твой прогноз: «{options[choice]}».{' '}
              {answer !== undefined &&
                (choice === answer ? (
                  <strong className="text-success">Так и есть!</strong>
                ) : (
                  <>
                    На самом деле — «{options[answer]}». Ошибиться в прогнозе полезно: так объяснение запомнится
                    лучше.
                  </>
                ))}
            </p>
          )}
          <div className="mt-3">{children}</div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: `ExplainBack`**

`components/lesson/gates/ExplainBack.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { useProgress } from '@/lib/progress/store'
import { useGate } from '@/components/lesson/engine/useGate'

const MIN_LENGTH = 20

export interface ExplainBackProps {
  id: string
  prompt: string
  reference: ReactNode
  points: string[]
}

export function ExplainBack({ id, prompt, reference, points }: ExplainBackProps) {
  const gate = useGate(id)
  const text = useProgress((s) => s.explanations[id]) ?? ''
  const saveExplanation = useProgress((s) => s.saveExplanation)
  const [compared, setCompared] = useState(false)
  const [checked, setChecked] = useState<boolean[]>(() => points.map(() => false))
  const showReference = compared || gate.passed
  const canCompare = text.trim().length >= MIN_LENGTH

  return (
    <div className="gate-card" data-gate="explain" data-passed={gate.passed}>
      <p className="gate-label">Объясни своими словами</p>
      <p className="gate-question">{prompt}</p>
      <textarea
        aria-label="Твоё объяснение"
        className="text-area"
        rows={5}
        value={text}
        placeholder="Пиши так, будто объясняешь другу…"
        onChange={(e) => saveExplanation(id, e.target.value)}
      />

      {!showReference && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" disabled={!canCompare} onClick={() => setCompared(true)}>
            Сравнить с эталоном
          </button>
          {!canCompare && <span className="text-xs text-muted">Хотя бы пара предложений — от 20 символов.</span>}
        </div>
      )}

      {showReference && (
        <div className="mt-4 rounded-lg bg-paper-deep p-4">
          <p className="gate-label">Эталон</p>
          <div className="mt-1 text-[15px] leading-relaxed">{reference}</div>
          <p className="gate-label mt-4">Отметь, что ты упомянул</p>
          <ul className="mt-2 list-none space-y-1 p-0">
            {points.map((point, i) => (
              <li key={point}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked[i]}
                    onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  />
                  {point}
                </label>
              </li>
            ))}
          </ul>
          {!gate.passed && (
            <button type="button" className="btn-primary mt-4" onClick={gate.pass}>
              Готово, я сравнил
            </button>
          )}
          {checked.some((v) => !v) && (
            <p className="mt-2 text-xs text-muted">
              Пропустил пункт — не беда: перечитай эталон и допиши своё объяснение.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Зарегистрировать компоненты для MDX** (полностью заменить `mdx-components.tsx`)

```tsx
import type { MDXComponents } from 'mdx/types'
import { Check } from '@/components/lesson/gates/Check'
import { ExplainBack } from '@/components/lesson/gates/ExplainBack'
import { LessonStep } from '@/components/lesson/engine/LessonStep'
import { Predict } from '@/components/lesson/gates/Predict'

const components: MDXComponents = {
  LessonStep,
  Check,
  Predict,
  ExplainBack,
}

export function useMDXComponents(): MDXComponents {
  return components
}
```

- [ ] **Step 8: Запустить тесты**

Run: `npm test -- lib/parse-number components/lesson/gates/gates`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(lesson): Check, Predict and ExplainBack gates with forgiving number input" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Разминка, итог урока и страница повторения

**Files:**
- Create: `lib/plural.ts`, `components/review/CardView.tsx`, `components/lesson/gates/Recall.tsx`, `components/lesson/blocks/Summary.tsx`, `components/review/ReviewDeck.tsx`, `app/review/page.tsx`
- Modify: `mdx-components.tsx`
- Test: `lib/plural.test.ts`, `components/lesson/gates/recall.test.tsx`, `components/review/ReviewDeck.test.tsx`

**Interfaces:**
- Consumes: `useGate`, `useLesson` (Task 8), `useProgress`, `useHydrated`, `pickRecallCards`, `todayISO`, `isDue` (Tasks 4–5), `loadLessonModule`, `listCourses`, `readyLessons` (Tasks 3, 7).
- Produces:
  - `plural(n: number, forms: readonly [string, string, string]): string` — русские формы: 1 карточка, 2 карточки, 5 карточек.
  - `<CardView card onAnswer={(correct: boolean) => void} />` — карточка flip («Показать ответ» → «Помню ✓» / «Не помню ✗») или choice.
  - `<Recall id />` — «ворота» разминки; без карточек проходится автоматически.
  - `<Summary points cards />`.
  - `<ReviewDeck cards />` и страница `/review` с экспортом/импортом прогресса.

- [ ] **Step 1: Написать падающие тесты**

`lib/plural.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { plural } from './plural'

const forms = ['карточка', 'карточки', 'карточек'] as const

describe('plural', () => {
  it.each([
    [0, 'карточек'],
    [1, 'карточка'],
    [2, 'карточки'],
    [4, 'карточки'],
    [5, 'карточек'],
    [11, 'карточек'],
    [12, 'карточек'],
    [14, 'карточек'],
    [21, 'карточка'],
    [22, 'карточки'],
    [25, 'карточек'],
    [101, 'карточка'],
    [111, 'карточек'],
  ])('%i → %s', (n, word) => {
    expect(plural(n, forms)).toBe(word)
  })
})
```

`components/lesson/gates/recall.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Card } from '@/lib/course/types'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { Recall } from './Recall'
import { Summary } from '@/components/lesson/blocks/Summary'

const cards: Card[] = [
  { id: 'c-a', kind: 'flip', prompt: 'Вопрос А', answer: 'Ответ А' },
  { id: 'c-b', kind: 'choice', prompt: 'Вопрос Б', options: ['да', 'нет'], correct: 0, answer: 'Да.' },
]

function renderRecall(recallCards: Card[]) {
  return render(
    <LessonProvider lessonId="9.2" lessonCardIds={[]} recallCards={recallCards}>
      <Recall id="r1" />
    </LessonProvider>,
  )
}

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('Recall', () => {
  it('passes by itself when there is nothing to recall yet (deep link to an early lesson)', async () => {
    renderRecall([])
    expect(await screen.findByText(/Разминки пока нет/)).toBeInTheDocument()
    expect(useProgress.getState().gates.r1?.passed).toBe(true)
  })

  it('shows due cards and passes once all of them are answered', async () => {
    useProgress.setState({
      cards: { 'c-a': { box: 1, due: '2000-01-01' }, 'c-b': { box: 1, due: '2000-01-01' } },
    })
    renderRecall(cards)
    expect(await screen.findByText('Вопрос А')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    await userEvent.click(screen.getByRole('button', { name: 'Помню ✓' }))
    expect(useProgress.getState().gates.r1?.passed).toBeFalsy()
    await userEvent.click(screen.getByRole('button', { name: 'да' }))
    expect(useProgress.getState().gates.r1?.passed).toBe(true)
    expect(useProgress.getState().cards['c-a'].box).toBe(2)
    expect(useProgress.getState().cards['c-b'].box).toBe(2)
  })

  it('falls back to earlier cards even if none were scheduled yet', async () => {
    renderRecall(cards)
    expect(await screen.findAllByText(/Вопрос [АБ]/)).toHaveLength(2)
  })
})

describe('Summary', () => {
  it('lists the points and says how many cards will go to the deck', () => {
    render(
      <LessonProvider lessonId="9.3" lessonCardIds={['c-a', 'c-b']} recallCards={[]}>
        <Summary points={['Первый вывод', 'Второй вывод']} cards={cards} />
      </LessonProvider>,
    )
    expect(screen.getByText('Первый вывод')).toBeInTheDocument()
    expect(screen.getByText(/2 карточки попадут в колоду/)).toBeInTheDocument()
  })
})
```

`components/review/ReviewDeck.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Card } from '@/lib/course/types'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { ReviewDeck } from './ReviewDeck'

const cards: Card[] = [
  { id: 'c-a', kind: 'flip', prompt: 'Вопрос А', answer: 'Ответ А' },
  { id: 'c-z', kind: 'flip', prompt: 'Не сегодня', answer: '…' },
]

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('ReviewDeck', () => {
  it('shows only due cards and finishes the session', async () => {
    useProgress.setState({
      cards: { 'c-a': { box: 1, due: '2000-01-01' }, 'c-z': { box: 2, due: '2999-01-01' } },
    })
    render(<ReviewDeck cards={cards} />)
    expect(await screen.findByText('Вопрос А')).toBeInTheDocument()
    expect(screen.queryByText('Не сегодня')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    await userEvent.click(screen.getByRole('button', { name: 'Помню ✓' }))
    await userEvent.click(screen.getByRole('button', { name: 'Следующая карточка →' }))
    expect(screen.getByText(/На сегодня всё/)).toBeInTheDocument()
    expect(useProgress.getState().cards['c-a'].box).toBe(2)
  })

  it('includes cards created from revealed answers', async () => {
    useProgress
      .getState()
      .revealGate('q', { id: 'check:q', kind: 'flip', prompt: 'Забытый вопрос', answer: '42' }, '1999-12-31')
    render(<ReviewDeck cards={[]} />)
    expect(await screen.findByText('Забытый вопрос')).toBeInTheDocument()
  })

  it('downloads progress as a JSON file', async () => {
    const createObjectURL = vi.fn(() => 'blob:progress')
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = vi.fn()
    render(<ReviewDeck cards={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Скачать прогресс' }))
    expect(createObjectURL).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/plural components/lesson/gates/recall components/review`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: `plural` и `CardView`**

`lib/plural.ts`:

```ts
/** Русская форма слова для числа: plural(5, ['карточка', 'карточки', 'карточек']) → 'карточек'. */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod100 > 10 && mod100 < 20) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}
```

`components/review/CardView.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { Card } from '@/lib/course/types'

export function CardView({ card, onAnswer }: { card: Card; onAnswer: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  function answer(correct: boolean) {
    if (done) return
    setDone(true)
    onAnswer(correct)
  }

  return (
    <div className="recall-card" data-done={done}>
      <p className="m-0 font-serif text-base">{card.prompt}</p>

      {card.kind === 'choice' && card.options ? (
        <div className="mt-3 flex flex-col gap-2">
          {card.options.map((option, i) => (
            <button
              key={option}
              type="button"
              className="option-btn"
              disabled={done}
              data-selected={picked === i}
              data-right={done && i === card.correct}
              onClick={() => {
                setPicked(i)
                answer(i === card.correct)
              }}
            >
              {option}
            </button>
          ))}
          {done && <p className="m-0 text-sm text-ink-soft">{card.answer}</p>}
        </div>
      ) : !revealed ? (
        <button type="button" className="btn-ghost mt-3" onClick={() => setRevealed(true)}>
          Показать ответ
        </button>
      ) : (
        <div className="mt-3">
          <p className="m-0 rounded-lg bg-paper-deep p-3 text-sm">{card.answer}</p>
          {!done && (
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => answer(true)}>
                Помню ✓
              </button>
              <button type="button" className="btn-ghost" onClick={() => answer(false)}>
                Не помню ✗
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: `Recall` и `Summary`**

`components/lesson/gates/Recall.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { Card } from '@/lib/course/types'
import { pickRecallCards, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'
import { CardView } from '@/components/review/CardView'
import { useLesson } from '@/components/lesson/engine/LessonContext'
import { useGate } from '@/components/lesson/engine/useGate'

export function Recall({ id }: { id: string }) {
  const { passed, pass } = useGate(id)
  const { recallCards } = useLesson()
  const hydrated = useHydrated()
  const reviewCard = useProgress((s) => s.reviewCard)
  const [picked, setPicked] = useState<Card[] | null>(null)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [answered, setAnswered] = useState(0)

  // Карточки выбираются один раз, после загрузки прогресса: дальнейшие ответы не меняют набор.
  useEffect(() => {
    if (!hydrated || picked !== null) return
    const { cards: states, customCards, gates } = useProgress.getState()
    if (gates[id]?.passed) {
      setAlreadyDone(true)
      setPicked([])
      return
    }
    const pool = new Map<string, Card>()
    for (const card of [...recallCards, ...Object.values(customCards)]) pool.set(card.id, card)
    const ids = pickRecallCards([...pool.keys()], states, todayISO(), id)
    setPicked(ids.map((cardId) => pool.get(cardId)).filter((c): c is Card => c !== undefined))
  }, [hydrated, picked, recallCards, id])

  useEffect(() => {
    if (picked?.length === 0 && !passed) pass()
  }, [picked, passed, pass])

  function onAnswer(card: Card, correct: boolean) {
    reviewCard(card.id, correct, todayISO())
    const count = answered + 1
    setAnswered(count)
    if (picked && count >= picked.length) pass()
  }

  return (
    <div className="gate-card" data-gate="recall" data-passed={passed}>
      <p className="gate-label">Разминка · вспомни, не подглядывая</p>
      {picked === null && <p className="mt-2 text-sm text-muted">Подбираю карточки из прошлых уроков…</p>}
      {alreadyDone && <p className="mt-2 text-sm text-success">✓ Разминка этого урока уже пройдена.</p>}
      {picked?.length === 0 && !alreadyDone && (
        <p className="mt-2 text-sm text-ink-soft">
          Разминки пока нет: карточки появятся, когда ты пройдёшь первые уроки.
        </p>
      )}
      {picked && picked.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {picked.map((card) => (
            <CardView key={card.id} card={card} onAnswer={(correct) => onAnswer(card, correct)} />
          ))}
        </div>
      )}
      {passed && picked && picked.length > 0 && (
        <p className="feedback-right">✓ Разминка пройдена. Карточки перенесены в расписание повторений.</p>
      )}
    </div>
  )
}
```

`components/lesson/blocks/Summary.tsx`:

```tsx
'use client'

import type { Card } from '@/lib/course/types'
import { plural } from '@/lib/plural'
import { useProgress } from '@/lib/progress/store'
import { useLesson } from '@/components/lesson/engine/LessonContext'

export function Summary({ points, cards }: { points: string[]; cards: Card[] }) {
  const { lessonId } = useLesson()
  const completed = useProgress((s) => s.lessons[lessonId]?.status === 'completed')
  const n = cards.length

  return (
    <div className="summary-card">
      <p className="gate-label">Итог урока</p>
      <ul className="mt-2">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-4 mb-0 text-sm text-ink-soft">
        🗂{' '}
        {completed
          ? `${n} ${plural(n, ['карточка добавлена', 'карточки добавлены', 'карточек добавлено'])} в колоду повторения.`
          : `После завершения урока ${n} ${plural(n, ['карточка попадёт', 'карточки попадут', 'карточек попадут'])} в колоду повторения.`}
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Колода повторения и её страница**

`components/review/ReviewDeck.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { CardView } from '@/components/review/CardView'
import type { Card } from '@/lib/course/types'
import { plural } from '@/lib/plural'
import { isDue, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ReviewDeck({ cards }: { cards: Card[] }) {
  const hydrated = useHydrated()
  const states = useProgress((s) => s.cards)
  const customCards = useProgress((s) => s.customCards)
  const reviewCard = useProgress((s) => s.reviewCard)
  const exportProgress = useProgress((s) => s.exportProgress)
  const importProgress = useProgress((s) => s.importProgress)
  const [session, setSession] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const today = todayISO()

  const byId = useMemo(
    () => new Map([...cards, ...Object.values(customCards)].map((card) => [card.id, card])),
    [cards, customCards],
  )

  // Набор карточек на сессию фиксируется в начале, чтобы ответы не меняли очередь на ходу.
  useEffect(() => {
    if (!hydrated || session !== null) return
    const current = useProgress.getState().cards
    setSession([...byId.keys()].filter((cardId) => current[cardId] && isDue(current[cardId], todayISO())))
  }, [hydrated, session, byId])

  const card = session && index < session.length ? byId.get(session[index]) : undefined
  const upcoming = Object.entries(states)
    .filter(([cardId, state]) => byId.has(cardId) && state.due > today)
    .map(([, state]) => state.due)
    .sort()[0]

  function download() {
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `ailearning-progress-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = importProgress(await file.text())
    setMessage(ok ? 'Прогресс загружен. Обнови страницу, чтобы увидеть изменения.' : 'Не получилось: это не файл прогресса учебника.')
  }

  return (
    <div>
      {!hydrated || session === null ? (
        <p className="text-muted">Загружаю колоду…</p>
      ) : card ? (
        <div>
          <p className="gate-label">
            Карточка {index + 1} из {session.length}
          </p>
          <div className="mt-3">
            <CardView
              key={card.id}
              card={card}
              onAnswer={(correct) => {
                reviewCard(card.id, correct, todayISO())
                setAnswered(true)
              }}
            />
          </div>
          {answered && (
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                setIndex((i) => i + 1)
                setAnswered(false)
              }}
            >
              Следующая карточка →
            </button>
          )}
        </div>
      ) : (
        <div className="summary-card">
          <p className="m-0 font-serif text-xl">
            {session.length > 0
              ? `На сегодня всё! 🎉 Повторено ${session.length} ${plural(session.length, ['карточка', 'карточки', 'карточек'])}.`
              : 'На сегодня всё! 🎉'}
          </p>
          <p className="mt-2 mb-0 text-ink-soft">
            {upcoming
              ? `Следующее повторение — ${formatDate(upcoming)}.`
              : 'Пройди урок до конца — его карточки появятся в колоде.'}
          </p>
        </div>
      )}

      <section className="mt-14 border-t border-line pt-6">
        <h2 className="font-serif text-xl">Резервная копия</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Прогресс хранится только в этом браузере. Скачай файл, чтобы перенести его на другое устройство или не потерять.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost" onClick={download}>
            Скачать прогресс
          </button>
          <label className="btn-ghost cursor-pointer">
            Загрузить из файла
            <input type="file" accept="application/json" className="sr-only" onChange={upload} />
          </label>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm text-ink-soft">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
```

`app/review/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { ReviewDeck } from '@/components/review/ReviewDeck'
import { loadLessonModule } from '@/lib/course/lesson-module'
import { listCourses, readyLessons } from '@/lib/course/registry'

export const metadata: Metadata = {
  title: 'Повторение',
  description: 'Интервальное повторение карточек из пройденных уроков.',
}

export default async function ReviewPage() {
  const modules = await Promise.all(
    listCourses().flatMap((course) => readyLessons(course).map((l) => loadLessonModule(course.id, l.slug))),
  )
  return (
    <main className="mx-auto max-w-[680px] px-4 py-12">
      <p className="gate-label">Интервальное повторение</p>
      <h1 className="mt-2 font-serif text-4xl">Повторение</h1>
      <p className="mt-3 text-ink-soft">
        Карточки возвращаются через 1, 3, 7, 16 и 35 дней. Отвечай по памяти — именно это укрепляет знания.
      </p>
      <div className="mt-8">
        <ReviewDeck cards={modules.flatMap((m) => m.cards)} />
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Зарегистрировать `Recall` и `Summary` для MDX**

В `mdx-components.tsx` добавить импорты и ключи (итоговый объект):

```tsx
import { Recall } from '@/components/lesson/gates/Recall'
import { Summary } from '@/components/lesson/blocks/Summary'
```

```tsx
const components: MDXComponents = {
  LessonStep,
  Check,
  Predict,
  ExplainBack,
  Recall,
  Summary,
}
```

- [ ] **Step 7: Запустить тесты и сборку**

Run: `npm test && npm run build`
Expected: PASS; в `out/review.html` есть заголовок «Повторение».

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(review): recall warm-up, lesson summary and spaced-repetition review page" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Контентные блоки: крючок, примеры, уровни, термины, заметки

**Files:**
- Create: `lib/theme/concepts.ts`, `content/glossary.ts`, `components/lesson/blocks/Hook.tsx`, `components/lesson/blocks/WorkedExample.tsx`, `components/lesson/gates/Faded.tsx`, `components/lesson/blocks/Levels.tsx`, `components/lesson/blocks/Term.tsx`, `components/lesson/blocks/Sidenote.tsx`, `components/lesson/blocks/C.tsx`
- Modify: `mdx-components.tsx`
- Test: `components/lesson/blocks/content-blocks.test.tsx`

**Interfaces:**
- Consumes: `useGate`, `useLessonOptional` (Task 8), `parseNumber` (Task 9), `attentionCourse`, `findLessonById` (Task 3), `useProgress` (Task 5).
- Produces:
  - `CONCEPTS: Record<ConceptKey, { ink: string; glow: string; label: string }>`, `type ConceptKey = 'query' | 'key' | 'value' | 'focus' | 'target' | 'a' | 'b' | 'result'`.
  - `interface GlossaryEntry { id: string; term: string; short: string; lessonId: string }`, `GLOSSARY: Record<string, GlossaryEntry>`.
  - `<Hook title?>`, `<WorkedExample title?>` (каждый дочерний блок — шаг), `<Faded id title? steps={FadedStep[]} />` с `FadedStep = { text: string; answer?: number; tolerance?: number }`, `<Levels><Level title>…</Level></Levels>`, `<Term id>`, `<Sidenote>`, `<C k>`.

- [ ] **Step 1: Написать падающие тесты**

`components/lesson/blocks/content-blocks.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { GLOSSARY } from '@/content/glossary'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { Faded } from '@/components/lesson/gates/Faded'
import { Level, Levels } from './Levels'
import { Term } from './Term'
import { WorkedExample } from './WorkedExample'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('Faded', () => {
  const steps = [{ text: '2·3 =', answer: 6 }, { text: '(−1)·4 =', answer: -4 }, { text: 'Сумма готова' }]

  it('checks every blank and accepts a comma and a typographic minus', async () => {
    render(<Faded id="f1" steps={steps} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 1' }), '6')
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 2' }), '−3')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('не то')).toBeInTheDocument()
    expect(useProgress.getState().gates.f1.passed).toBe(false)

    const second = screen.getByRole('textbox', { name: 'Пропуск в шаге 2' })
    await userEvent.clear(second)
    await userEvent.type(second, '−4,0')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(useProgress.getState().gates.f1.passed).toBe(true)
  })
})

describe('WorkedExample', () => {
  it('reveals the solution one step at a time', async () => {
    render(
      <WorkedExample title="Пример">
        <p>Шаг А</p>
        <p>Шаг Б</p>
        <p>Шаг В</p>
      </WorkedExample>,
    )
    expect(screen.getByText('Шаг А')).toBeInTheDocument()
    expect(screen.queryByText('Шаг Б')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Следующий шаг (2/3)' }))
    expect(screen.getByText('Шаг Б')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Показать всё' }))
    expect(screen.getByText('Шаг В')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Следующий шаг/ })).toBeNull()
  })
})

describe('Levels', () => {
  it('switches between explanation levels', async () => {
    render(
      <Levels>
        <Level title="История">
          <p>сказка</p>
        </Level>
        <Level title="Алгебра">
          <p>формула</p>
        </Level>
      </Levels>,
    )
    expect(screen.getByRole('tab', { name: 'История' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('сказка')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Алгебра' }))
    expect(screen.getByText('формула')).toBeInTheDocument()
    expect(screen.queryByText('сказка')).toBeNull()
  })
})

describe('Term', () => {
  it('opens a definition and closes it with Escape', async () => {
    render(
      <p>
        Это <Term id="vector">вектор</Term>.
      </p>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'вектор' }))
    expect(screen.getByRole('dialog', { name: 'Вектор' })).toHaveTextContent(GLOSSARY.vector.short)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('points to the lesson where a not-yet-studied term is explained', async () => {
    render(<Term id="dot-product">скалярное произведение</Term>)
    await userEvent.click(screen.getByRole('button', { name: 'скалярное произведение' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Подробно — в уроке 1.3')
  })

  it('renders plain text for an unknown term', () => {
    render(<Term id="nope">слово</Term>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('слово')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- components/lesson/blocks/content-blocks`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Цвета понятий и глоссарий**

`lib/theme/concepts.ts`:

```ts
/** Цвет понятия одинаков в тексте (ink — на бумаге) и в сценах (glow — в обсерватории). */
export const CONCEPTS = {
  query: { ink: '#0e7490', glow: '#22d3ee', label: 'запрос' },
  key: { ink: '#c2410c', glow: '#fb923c', label: 'ключ' },
  value: { ink: '#6d28d9', glow: '#a78bfa', label: 'значение' },
  focus: { ink: '#0e7490', glow: '#22d3ee', label: 'фокус' },
  target: { ink: '#c2410c', glow: '#fb923c', label: 'цель' },
  a: { ink: '#0e7490', glow: '#22d3ee', label: 'a' },
  b: { ink: '#c2410c', glow: '#fb923c', label: 'b' },
  result: { ink: '#3f6212', glow: '#a3e635', label: 'результат' },
} as const

export type ConceptKey = keyof typeof CONCEPTS
```

`content/glossary.ts`:

```ts
export interface GlossaryEntry {
  id: string
  term: string
  short: string
  /** Урок курса «attention», где термин вводится. */
  lessonId: string
}

const entries: GlossaryEntry[] = [
  {
    id: 'attention',
    term: 'Внимание (attention)',
    short: 'Механизм, который для каждого слова решает, на какие другие слова смотреть и насколько сильно. Сердце трансформера.',
    lessonId: '0.1',
  },
  {
    id: 'language-model',
    term: 'Языковая модель',
    short: 'Программа, которая по началу текста предсказывает следующее слово (токен). ChatGPT и Claude — языковые модели.',
    lessonId: '0.1',
  },
  {
    id: 'transformer',
    term: 'Трансформер',
    short: 'Архитектура нейросети из статьи «Attention Is All You Need» (2017), построенная на внимании. Основа GPT, Claude и других моделей.',
    lessonId: '0.2',
  },
  {
    id: 'retrieval-practice',
    term: 'Эффект тестирования',
    short: 'Попытка вспомнить ответ по памяти укрепляет знание сильнее, чем повторное чтение.',
    lessonId: '0.2',
  },
  {
    id: 'spaced-repetition',
    term: 'Интервальное повторение',
    short: 'Повторение материала через растущие промежутки времени: 1, 3, 7, 16, 35 дней.',
    lessonId: '0.2',
  },
  {
    id: 'vector',
    term: 'Вектор',
    short: 'Стрелка из начала координат и одновременно список чисел — её координат. Например, [2, 1, 2].',
    lessonId: '1.1',
  },
  {
    id: 'coordinate',
    term: 'Координата',
    short: 'Одно число в векторе: насколько сдвинуться вдоль своей оси (X, Y, Z…).',
    lessonId: '1.1',
  },
  {
    id: 'dimension',
    term: 'Размерность',
    short: 'Сколько чисел в векторе. У стрелки в нашем 3D-мире — 3, у слова в статье 2017 года — 512.',
    lessonId: '1.1',
  },
  {
    id: 'vector-length',
    term: 'Длина вектора',
    short: 'Насколько далеко уходит стрелка: √(x² + y² + z²).',
    lessonId: '1.1',
  },
  {
    id: 'vector-addition',
    term: 'Сложение векторов',
    short: 'Приставить хвост второй стрелки к голове первой; в числах — сложить координаты попарно.',
    lessonId: '1.2',
  },
  {
    id: 'scalar-multiplication',
    term: 'Умножение на число',
    short: 'Растягивает или сжимает стрелку; отрицательное число ещё и разворачивает её.',
    lessonId: '1.2',
  },
  {
    id: 'weighted-sum',
    term: 'Взвешенная сумма',
    short: 'Смесь векторов с весами: w₁·v₁ + w₂·v₂ + … Так внимание собирает итоговый вектор слова.',
    lessonId: '1.2',
  },
  {
    id: 'dot-product',
    term: 'Скалярное произведение',
    short: 'a·b = a₁b₁ + a₂b₂ + a₃b₃. Большое, если стрелки смотрят в одну сторону, и 0, если они перпендикулярны.',
    lessonId: '1.3',
  },
  {
    id: 'cosine-similarity',
    term: 'Косинусная похожесть',
    short: 'Скалярное произведение, делённое на длины векторов: от −1 до 1, зависит только от направления.',
    lessonId: '1.3',
  },
  {
    id: 'matrix',
    term: 'Матрица',
    short: 'Таблица чисел, которая превращает одни векторы в другие.',
    lessonId: '1.4',
  },
  {
    id: 'softmax',
    term: 'Softmax',
    short: 'Превращает любые числа в вероятности, которые в сумме дают 1.',
    lessonId: '1.6',
  },
  {
    id: 'embedding',
    term: 'Эмбеддинг',
    short: 'Вектор, которым модель представляет слово: точка в «пространстве смыслов».',
    lessonId: '2.2',
  },
]

export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(entries.map((e) => [e.id, e]))
```

- [ ] **Step 4: Простые блоки — `Hook`, `Sidenote`, `C`**

`components/lesson/blocks/Hook.tsx`:

```tsx
import type { ReactNode } from 'react'

export function Hook({ title = 'Загадка', children }: { title?: string; children?: ReactNode }) {
  return (
    <div className="hook">
      <p className="gate-label m-0">🧩 {title}</p>
      <div>{children}</div>
    </div>
  )
}
```

`components/lesson/blocks/Sidenote.tsx`:

```tsx
import type { ReactNode } from 'react'

/** Заметка на полях: справа от текста на широких экранах, внутри текста на узких. */
export function Sidenote({ children }: { children?: ReactNode }) {
  return <aside className="sidenote">{children}</aside>
}
```

`components/lesson/blocks/C.tsx`:

```tsx
import type { ReactNode } from 'react'
import { CONCEPTS, type ConceptKey } from '@/lib/theme/concepts'

/** Цветной термин: тот же цвет, что у объекта в сцене (сигналинг по Майеру). */
export function C({ k, children }: { k: ConceptKey; children?: ReactNode }) {
  const concept = CONCEPTS[k]
  return (
    <span className="concept" style={{ color: concept.ink, borderBottomColor: concept.glow }}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: `WorkedExample`, `Faded`, `Levels`, `Term`**

`components/lesson/blocks/WorkedExample.tsx`:

```tsx
'use client'

import { Children, useState, type ReactNode } from 'react'

/** Разобранный пример: каждый дочерний блок MDX — шаг; шаги открываются по одному. */
export function WorkedExample({ title, children }: { title?: string; children?: ReactNode }) {
  const steps = Children.toArray(children).filter((child) => !(typeof child === 'string' && child.trim() === ''))
  const [shown, setShown] = useState(1)

  return (
    <div className="worked">
      <p className="gate-label m-0">Разобранный пример</p>
      {title && <p className="gate-question">{title}</p>}
      <ol className="mt-3 list-none space-y-3 p-0">
        {steps.slice(0, shown).map((step, i) => (
          <li key={i} className="worked-step">
            {step}
          </li>
        ))}
      </ol>
      {shown < steps.length && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setShown(shown + 1)}>
            Следующий шаг ({shown + 1}/{steps.length})
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShown(steps.length)}>
            Показать всё
          </button>
        </div>
      )}
    </div>
  )
}
```

`components/lesson/gates/Faded.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { parseNumber } from '@/lib/parse-number'
import { useGate } from '@/components/lesson/engine/useGate'

export interface FadedStep {
  text: string
  /** Если задан — в шаге есть пропуск ▢, который заполняет ученик. */
  answer?: number
  tolerance?: number
}

export function Faded({ id, title, steps }: { id: string; title?: string; steps: FadedStep[] }) {
  const gate = useGate(id)
  const [values, setValues] = useState<string[]>(() => steps.map(() => ''))
  const [wrong, setWrong] = useState<boolean[]>(() => steps.map(() => false))
  const solved = gate.passed

  function check() {
    const results = steps.map((step, i) => {
      if (step.answer === undefined) return true
      const value = parseNumber(values[i])
      return value !== null && Math.abs(value - step.answer) <= (step.tolerance ?? 0.01)
    })
    setWrong(results.map((ok) => !ok))
    gate.record(results.every(Boolean))
  }

  return (
    <div className="gate-card" data-gate="faded" data-passed={solved}>
      <p className="gate-label m-0">Реши сам · часть шагов уже сделана</p>
      {title && <p className="gate-question">{title}</p>}
      <ol className="mt-3 list-none space-y-2 p-0">
        {steps.map((step, i) => (
          <li key={i} className="flex flex-wrap items-center gap-3 font-mono text-[15px]">
            <span>{step.text}</span>
            {step.answer !== undefined && (
              <label className="flex items-center gap-2">
                <span className="text-muted">▢ =</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Пропуск в шаге ${i + 1}`}
                  className="text-input mt-0 w-24"
                  value={solved && values[i] === '' ? String(step.answer) : values[i]}
                  disabled={solved}
                  onChange={(e) => setValues((vs) => vs.map((v, j) => (j === i ? e.target.value : v)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') check()
                  }}
                />
                {wrong[i] && !solved && <span className="text-sm text-error">не то</span>}
              </label>
            )}
          </li>
        ))}
      </ol>
      {!solved && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={check}>
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={() => gate.reveal()}>
              Показать ответы
            </button>
          )}
        </div>
      )}
      {solved && (
        <p role="status" className="feedback-right">
          {gate.revealed
            ? 'Ответы подставлены. Пройди по шагам ещё раз и проверь каждый.'
            : '✓ Все пропуски заполнены верно!'}
        </p>
      )}
    </div>
  )
}
```

`components/lesson/blocks/Levels.tsx`:

```tsx
'use client'

import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react'

export function Level({ children }: { title: string; children?: ReactNode }) {
  return <>{children}</>
}

/** Одна идея на трёх уровнях: История → Геометрия → Алгебра (concreteness fading). */
export function Levels({ children }: { children?: ReactNode }) {
  const levels = Children.toArray(children).filter(isValidElement) as ReactElement<{
    title: string
    children?: ReactNode
  }>[]
  const [active, setActive] = useState(0)

  return (
    <div className="levels">
      <div role="tablist" aria-label="Уровень объяснения" className="levels-tabs">
        {levels.map((level, i) => (
          <button
            key={level.props.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            className="levels-tab"
            onClick={() => setActive(i)}
          >
            {level.props.title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="levels-panel">
        {levels[active]}
      </div>
    </div>
  )
}
```

`components/lesson/blocks/Term.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { attentionCourse } from '@/content/attention/course'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById } from '@/lib/course/registry'
import { useProgress } from '@/lib/progress/store'
import { useLessonOptional } from '@/components/lesson/engine/LessonContext'

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const popoverId = useId()
  const current = useLessonOptional()
  const lesson = entry ? findLessonById(attentionCourse, entry.lessonId) : undefined
  const studied = useProgress((s) => (lesson ? s.lessons[lesson.id]?.status === 'completed' : false))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  if (!entry) return <>{children}</>

  const known = studied || current?.lessonId === lesson?.id

  return (
    <span ref={rootRef} className="relative">
      <button
        type="button"
        className="term"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <span id={popoverId} role="dialog" aria-label={entry.term} className="term-popover">
          <span className="block font-serif text-base font-semibold">{entry.term}</span>
          <span className="mt-1 block text-sm">{entry.short}</span>
          {lesson &&
            (known || lesson.availability !== 'ready' ? (
              <span className="mt-2 block text-xs text-muted">
                {known ? `Урок ${lesson.id}: ${lesson.title}` : `Подробно — в уроке ${lesson.id} (скоро)`}
              </span>
            ) : (
              <Link href={`/courses/attention/${lesson.slug}`} className="mt-2 block text-xs text-ink-cyan underline">
                Подробно — в уроке {lesson.id}: {lesson.title}
              </Link>
            ))}
        </span>
      )}
    </span>
  )
}
```

Тест «not-yet-studied» ожидает текст «Подробно — в уроке 1.3». На этом этапе урок 1.3 ещё `soon`, поэтому срабатывает ветка `(скоро)`, и текст содержит нужную подстроку. После Task 19 урок станет `ready`: ветка поменяется на ссылку, а подстрока «Подробно — в уроке 1.3» в ней сохранится.

- [ ] **Step 6: Зарегистрировать компоненты для MDX**

В `mdx-components.tsx` добавить импорты и ключи (итоговый объект):

```tsx
import { C } from '@/components/lesson/blocks/C'
import { Faded } from '@/components/lesson/gates/Faded'
import { Hook } from '@/components/lesson/blocks/Hook'
import { Level, Levels } from '@/components/lesson/blocks/Levels'
import { Sidenote } from '@/components/lesson/blocks/Sidenote'
import { Term } from '@/components/lesson/blocks/Term'
import { WorkedExample } from '@/components/lesson/blocks/WorkedExample'
```

```tsx
const components: MDXComponents = {
  LessonStep,
  Check,
  Predict,
  ExplainBack,
  Recall,
  Summary,
  Hook,
  WorkedExample,
  Faded,
  Levels,
  Level,
  Term,
  Sidenote,
  C,
}
```

- [ ] **Step 7: Запустить тесты**

Run: `npm test -- components/lesson/blocks/content-blocks`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(lesson): hook, worked/faded examples, explanation levels, glossary terms and sidenotes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: «Обсерватория»: ленивые 3D-сцены с запасным вариантом

**Files:**
- Create: `lib/webgl.ts`, `components/viz/stage/Observatory.tsx`, `components/viz/stage/stage-context.ts`, `components/viz/stage/InfoCard.tsx`, `components/viz/stage/SceneCanvas.tsx`, `components/viz/stage/Stage.tsx`, `components/viz/stage/StageFallbackNote.tsx`
- Test: `components/viz/stage/stage.test.tsx`

**Interfaces:**
- Produces:
  - `detectWebGL(): boolean`.
  - `<Observatory caption? hint? wide? footer?>` — тёмная рамка (используется и SVG-визуализациями).
  - `interface StageInfo { title: string; body: ReactNode }`; `StageInfoContext`; `useStageInfo(): { show(info: StageInfo): void; hide(): void } | null`.
  - `<InfoCard info onClose />`.
  - `<Stage height? caption? hint? fallback controls? camera? frameloop? wide?>{R3F-сцена}</Stage>`: canvas монтируется лениво (IntersectionObserver, rootMargin 200px); без WebGL или при потере контекста показывается `fallback`, а `controls` (DOM) видны всегда.
  - `<StageFallbackNote />` — стандартный текст запасного варианта.

- [ ] **Step 1: Написать падающий тест**

`components/viz/stage/stage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InfoCard } from './InfoCard'
import { Stage } from '@/components/viz/stage/Stage'

describe('Stage', () => {
  it('shows the fallback and keeps DOM controls when WebGL is unavailable', async () => {
    render(
      <Stage caption="Подпись" fallback={<p>Без 3D</p>} controls={<button type="button">Поле</button>}>
        <group />
      </Stage>,
    )
    expect(await screen.findByText('Без 3D')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Поле' })).toBeInTheDocument()
    expect(screen.getByText('Подпись')).toBeInTheDocument()
    expect(screen.queryByText(/чтобы вращать/)).toBeNull()
  })
})

describe('InfoCard', () => {
  it('shows the title and body and can be closed', async () => {
    const onClose = vi.fn()
    render(<InfoCard info={{ title: 'Вектор', body: 'v = [1, 2, 3]' }} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Вектор' })).toHaveTextContent('v = [1, 2, 3]')
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- components/viz/stage/stage`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Реализовать**

`lib/webgl.ts`:

```ts
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
```

`components/viz/stage/Observatory.tsx`:

```tsx
import type { ReactNode } from 'react'

/** Тёмное «окно» для интерактивных сцен: сразу видно, что здесь можно трогать. */
export function Observatory({
  caption,
  hint,
  wide,
  footer,
  children,
}: {
  caption?: ReactNode
  hint?: string
  wide?: boolean
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    <figure className={`observatory-figure ${wide ? 'breakout' : ''}`}>
      <div className="observatory">
        {hint && <span className="observatory-hint">{hint}</span>}
        {children}
        {footer && <div className="observatory-footer">{footer}</div>}
      </div>
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  )
}
```

`components/viz/stage/stage-context.ts`:

```ts
'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface StageInfo {
  title: string
  body: ReactNode
}

export interface StageInfoApi {
  show: (info: StageInfo) => void
  hide: () => void
}

export const StageInfoContext = createContext<StageInfoApi | null>(null)

/** Доступ к информационной карточке сцены (R3F v9 автоматически пробрасывает контекст внутрь Canvas). */
export function useStageInfo(): StageInfoApi | null {
  return useContext(StageInfoContext)
}
```

`components/viz/stage/InfoCard.tsx`:

```tsx
import type { StageInfo } from '@/components/viz/stage/stage-context'

export function InfoCard({ info, onClose }: { info: StageInfo; onClose: () => void }) {
  return (
    <div role="dialog" aria-label={info.title} className="info-card">
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 font-mono text-xs tracking-wider text-glow-cyan uppercase">{info.title}</p>
        <button type="button" aria-label="Закрыть" className="text-space-muted hover:text-space-text" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mt-1 text-sm text-space-text">{info.body}</div>
    </div>
  )
}
```

`components/viz/stage/SceneCanvas.tsx`:

```tsx
'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

export interface SceneCanvasProps {
  camera?: [number, number, number]
  frameloop?: 'demand' | 'always'
  onContextLost: () => void
  children?: ReactNode
}

export default function SceneCanvas({ camera = [5, 4, 6], frameloop = 'demand', onContextLost, children }: SceneCanvasProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 2]}
      camera={{ position: camera, fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost()
        })
      }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      {children}
      <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={18} />
    </Canvas>
  )
}
```

`components/viz/stage/StageFallbackNote.tsx`:

```tsx
export function StageFallbackNote() {
  return (
    <p className="m-0">
      3D-сцена недоступна в этом браузере. Меняй числа в полях ниже — всё работает так же, просто без картинки.
    </p>
  )
}
```

`components/viz/stage/Stage.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { detectWebGL } from '@/lib/webgl'
import { InfoCard } from './InfoCard'
import { Observatory } from '@/components/viz/stage/Observatory'
import { StageInfoContext, type StageInfo } from '@/components/viz/stage/stage-context'

function StageLoading() {
  return <div className="flex h-full items-center justify-center font-mono text-xs text-space-muted">Загружаю 3D…</div>
}

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false, loading: StageLoading })

export interface StageProps {
  height?: number
  caption?: ReactNode
  hint?: string
  /** Что показать без WebGL. */
  fallback: ReactNode
  /** DOM-управление под сценой (поля, ползунки) — работает и без WebGL. */
  controls?: ReactNode
  camera?: [number, number, number]
  frameloop?: 'demand' | 'always'
  wide?: boolean
  children?: ReactNode
}

export function Stage({
  height = 360,
  caption,
  hint = '⟲ потяни фон, чтобы вращать',
  fallback,
  controls,
  camera,
  frameloop,
  wide,
  children,
}: StageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [lost, setLost] = useState(false)
  const [info, setInfo] = useState<StageInfo | null>(null)
  const infoApi = useMemo(() => ({ show: setInfo, hide: () => setInfo(null) }), [])

  useEffect(() => {
    setWebgl(detectWebGL())
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  let body: ReactNode
  if (webgl === false || lost) {
    body = (
      <div className="stage-fallback">
        {lost && (
          <p className="m-0">
            3D-сцена отключилась.{' '}
            <button type="button" className="stage-chip" onClick={() => setLost(false)}>
              Перезапустить
            </button>
          </p>
        )}
        {fallback}
      </div>
    )
  } else if (webgl && inView) {
    body = (
      <SceneCanvas camera={camera} frameloop={frameloop} onContextLost={() => setLost(true)}>
        {children}
      </SceneCanvas>
    )
  } else {
    body = <StageLoading />
  }

  return (
    <StageInfoContext.Provider value={infoApi}>
      <Observatory caption={caption} hint={webgl && !lost ? hint : undefined} wide={wide} footer={controls}>
        <div ref={ref} style={{ height }} className="relative">
          {body}
          {info && <InfoCard info={info} onClose={() => setInfo(null)} />}
        </div>
      </Observatory>
    </StageInfoContext.Provider>
  )
}
```

- [ ] **Step 4: Запустить тест**

Run: `npm test -- components/viz/stage/stage`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(viz): lazy WebGL stage with observatory frame, info cards and no-WebGL fallback" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Дуги внимания (`AttentionArcs`)

**Files:**
- Create: `components/viz/attention/AttentionArcs.tsx`
- Modify: `mdx-components.tsx`
- Test: `components/viz/attention/AttentionArcs.test.tsx`

**Interfaces:**
- Consumes: `pronounAttention`, `ADJECTIVE`, `Variant` (Task 6), `CONCEPTS` (Task 11), `Observatory` (Task 12).
- Produces: `arcPath(x1: number, x2: number, baseline: number): string`; `<AttentionArcs initial? showWeights? caption? />` — SVG-дуги от «он» ко всем словам; толщина ∝ весу; переключатель «высоким / уставшим»; `aria-label` называет главную цель внимания.

- [ ] **Step 1: Написать падающий тест**

`components/viz/attention/AttentionArcs.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AttentionArcs, arcPath } from './AttentionArcs'

describe('arcPath', () => {
  it('builds a quadratic arc above the baseline', () => {
    expect(arcPath(100, 300, 150)).toBe('M 100 150 Q 200 54 300 150')
  })

  it('caps the arc height for distant words', () => {
    expect(arcPath(0, 1000, 150)).toBe('M 0 150 Q 500 30 1000 150')
  })
})

describe('AttentionArcs', () => {
  it('says where «он» looks and updates when the adjective changes', async () => {
    render(<AttentionArcs />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/«забор»/)
    await userEvent.click(screen.getByRole('radio', { name: 'уставшим' }))
    expect(screen.getByRole('img')).toHaveAccessibleName(/«кот»/)
  })

  it('draws one arc from «он» to every other word', () => {
    const { container } = render(<AttentionArcs />)
    expect(container.querySelectorAll('path')).toHaveLength(10)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- components/viz/attention/AttentionArcs`
Expected: FAIL — `Failed to resolve import "./AttentionArcs"`.

- [ ] **Step 3: Реализовать**

`components/viz/attention/AttentionArcs.tsx`:

```tsx
'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ADJECTIVE, pronounAttention, type Variant } from '@/content/attention/toy-model'
import { CONCEPTS } from '@/lib/theme/concepts'
import { Observatory } from '@/components/viz/stage/Observatory'

const CHAR = 9.4
const PAD = 20
const BASELINE = 190

export function arcPath(x1: number, x2: number, baseline: number): string {
  const h = Math.min(120, Math.abs(x2 - x1) * 0.42 + 12)
  return `M ${x1} ${baseline} Q ${(x1 + x2) / 2} ${baseline - h} ${x2} ${baseline}`
}

const percent = (w: number) => `${Math.round(w * 100)}%`

export function AttentionArcs({
  initial = 'tall',
  showWeights = false,
  caption,
}: {
  initial?: Variant
  showWeights?: boolean
  caption?: ReactNode
}) {
  const [variant, setVariant] = useState<Variant>(initial)
  const [hovered, setHovered] = useState<number | null>(null)
  const { tokens, weights, target } = useMemo(() => pronounAttention(variant), [variant])

  const focus = tokens.indexOf('он')
  const widths = tokens.map((t) => t.length * CHAR + PAD)
  const xs = widths.map((w, i) => widths.slice(0, i).reduce((s, x) => s + x, 0) + w / 2)
  const width = widths.reduce((s, w) => s + w, 0)
  const label = `«он» сильнее всего смотрит на «${target}» — ${percent(weights[tokens.indexOf(target)])} внимания`

  const footer = (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Конец фразы">
      <span className="font-mono text-xs text-space-muted">…потому что он был слишком</span>
      {(['tall', 'tired'] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={variant === v}
          className="stage-chip"
          data-active={variant === v}
          onClick={() => setVariant(v)}
        >
          {ADJECTIVE[v]}
        </button>
      ))}
      <span className="ml-auto font-mono text-xs text-space-muted">наведи на слово — увидишь %</span>
    </div>
  )

  return (
    <Observatory wide caption={caption} footer={footer}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} 230`} role="img" aria-label={label} className="block w-full min-w-[640px] px-2">
          {tokens.map((token, i) =>
            i === focus ? null : (
              <path
                key={i}
                d={arcPath(xs[focus], xs[i], BASELINE - 24)}
                fill="none"
                strokeLinecap="round"
                stroke={token === target ? CONCEPTS.target.glow : CONCEPTS.focus.glow}
                style={{
                  strokeWidth: 1 + weights[i] * 14,
                  opacity: hovered === null || hovered === i ? 0.3 + weights[i] * 0.7 : 0.1,
                  transition: 'stroke-width 0.6s ease, opacity 0.3s ease',
                }}
              />
            ),
          )}
          {tokens.map((token, i) => (
            <g key={i} onPointerEnter={() => setHovered(i)} onPointerLeave={() => setHovered(null)}>
              <text
                x={xs[i]}
                y={BASELINE}
                textAnchor="middle"
                fontSize="15"
                className="font-mono"
                fontWeight={i === focus || token === target ? 700 : 400}
                fill={i === focus ? CONCEPTS.focus.glow : token === target ? CONCEPTS.target.glow : '#dbe6ff'}
                opacity={i === focus || weights[i] > 0.05 ? 1 : 0.55}
              >
                {token}
              </text>
              {(showWeights || hovered === i) && i !== focus && (
                <text x={xs[i]} y={BASELINE + 24} textAnchor="middle" fontSize="12" fill="#7c8db5" className="font-mono">
                  {percent(weights[i])}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </Observatory>
  )
}
```

- [ ] **Step 4: Зарегистрировать для MDX**

В `mdx-components.tsx` добавить `import { AttentionArcs } from '@/components/viz/attention/AttentionArcs'` и ключ `AttentionArcs` в объект `components`.

- [ ] **Step 5: Запустить тест**

Run: `npm test -- components/viz/attention/AttentionArcs`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(viz): interactive attention arcs for the «он» riddle" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 14: 3D-векторы: стрелки, перетаскивание, сложение, скалярное произведение

R3F-модули (`VectorScene` и всё, что внутри `three/`) подключаются **только** через `next/dynamic`. Так three.js не попадает в основной бандл страницы урока и грузится, лишь когда сцена появилась на экране (требование Performance ≥ 85). DOM-часть (поля координат, показания) лёгкая и работает без WebGL.

**Files:**
- Create: `lib/viz/vector-helpers.ts`, `components/viz/vectors/three/Arrow3D.tsx`, `components/viz/vectors/three/Axes3D.tsx`, `components/viz/vectors/three/DragHandle.tsx`, `components/viz/vectors/VectorScene.tsx`, `components/viz/vectors/LazyVectorScene.tsx`, `components/viz/vectors/VectorInputs.tsx`, `components/viz/vectors/VectorSpace3D.tsx`, `components/viz/vectors/VectorTask.tsx`, `components/viz/vectors/VectorOps3D.tsx`, `components/viz/vectors/DotProduct3D.tsx`
- Modify: `mdx-components.tsx`
- Test: `lib/viz/vector-helpers.test.ts`, `components/viz/vectors/vectors.test.tsx`

**Interfaces:**
- Consumes: `lib/math` (Task 2), `parseNumber` (Task 9), `CONCEPTS` (Task 11), `Stage`, `StageFallbackNote`, `useStageInfo`, `StageInfo` (Task 12), `useGate` (Task 8).
- Produces:
  - `BOUND = 4`; `snapVec(v: Vec, step?: number, bound?: number): Vec`; `formatNum(x: number): string`; `formatVec(v: Vec): string`; `vecEquals(a: Vec, b: Vec, eps?: number): boolean`; `type DotRelation = 'same' | 'perpendicular' | 'opposite'`; `describeDot(d: number, eps?: number): DotRelation`; `DOT_RELATION_TEXT: Record<DotRelation, string>`; `dotBreakdown(a: Vec, b: Vec): string`; `arcPoints(a: Vec, b: Vec, radius?: number, segments?: number): Vec[] | null`.
  - `interface VectorSpec { id: string; value: Vec; color: string; label: string; from?: Vec; draggable?: boolean; info?: StageInfo }`; `<VectorScene vectors onChange? arc? />` (R3F); `LazyVectorScene` (то же через `next/dynamic`).
  - `<VectorInputs label color value onChange disabled? />` — поля с `aria-label` вида «v, координата x».
  - MDX-компоненты: `<VectorSpace3D initial? label? caption? />`, `<VectorTask id target start? />` («ворота»), `<VectorOps3D mode="add" | "scale" a? b? caption? />`, `<DotProduct3D a? b? caption? />`.

- [ ] **Step 1: Написать падающие тесты**

`lib/viz/vector-helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { arcPoints, describeDot, dotBreakdown, formatNum, formatVec, snapVec, vecEquals } from './vector-helpers'

describe('snapVec', () => {
  it('rounds to the grid step and clamps to the bounds', () => {
    expect(snapVec([1.26, -0.24, 9])).toEqual([1.5, 0, 4])
    expect(snapVec([-7, 0.74, 2.25])).toEqual([-4, 0.5, 2.5])
  })

  it('never returns negative zero', () => {
    expect(Object.is(snapVec([-0.1])[0], -0)).toBe(false)
  })
})

describe('formatting', () => {
  it('prints short, readable numbers', () => {
    expect(formatNum(1 / 3)).toBe('0.33')
    expect(formatNum(-0)).toBe('0')
    expect(formatNum(Number.NaN)).toBe('—')
    expect(formatVec([1, 0.5, -2])).toBe('[1, 0.5, -2]')
  })
})

describe('vecEquals', () => {
  it('compares within a tolerance', () => {
    expect(vecEquals([2, 1, 3], [2.004, 1, 3], 0.01)).toBe(true)
    expect(vecEquals([2, 1, 3], [2, 1], 0.01)).toBe(false)
  })
})

describe('dot product helpers', () => {
  it('describes the sign of the dot product', () => {
    expect(describeDot(4)).toBe('same')
    expect(describeDot(0)).toBe('perpendicular')
    expect(describeDot(-0.5)).toBe('opposite')
  })

  it('spells out the computation', () => {
    expect(dotBreakdown([2, -1, 0], [3, 4, 5])).toBe('2·3 + (-1)·4 + 0·5 = 2')
  })

  it('builds an angle arc between two directions', () => {
    const points = arcPoints([1, 0, 0], [0, 1, 0])!
    expect(points).toHaveLength(25)
    expect(points[0][0]).toBeCloseTo(0.8)
    expect(points[24][1]).toBeCloseTo(0.8)
  })

  it('skips the arc for parallel or zero vectors', () => {
    expect(arcPoints([1, 0, 0], [2, 0, 0])).toBeNull()
    expect(arcPoints([0, 0, 0], [1, 0, 0])).toBeNull()
  })
})
```

`components/viz/vectors/vectors.test.tsx` (в jsdom нет WebGL, поэтому проверяем именно запасной режим с DOM-полями):

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { DotProduct3D } from './DotProduct3D'
import { VectorTask } from './VectorTask'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

async function setField(name: string, value: string) {
  const field = screen.getByRole('textbox', { name })
  await userEvent.clear(field)
  await userEvent.type(field, `${value}{Enter}`)
}

describe('VectorTask without WebGL', () => {
  it('can be solved with the coordinate fields alone', async () => {
    render(<VectorTask id="vt" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('v, координата x', '2')
    await setField('v, координата z', '3')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(useProgress.getState().gates.vt.passed).toBe(true)
  })

  it('explains what is off after a wrong try', async () => {
    render(<VectorTask id="vt2" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText(/Пока \[1, 1, 1\]/)).toBeInTheDocument()
  })
})

describe('DotProduct3D without WebGL', () => {
  it('updates the readout when a coordinate changes', async () => {
    render(<DotProduct3D a={[1, 0, 0]} b={[0, 1, 0]} />)
    expect(screen.getByText('a·b = 1·0 + 0·1 + 0·0 = 0')).toBeInTheDocument()
    expect(screen.getByText(/перпендикулярны/)).toBeInTheDocument()
    await setField('b, координата x', '2')
    expect(screen.getByText('a·b = 1·2 + 0·1 + 0·0 = 2')).toBeInTheDocument()
    expect(screen.getByText(/смотрят в одну сторону/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/viz components/viz/vectors/vectors`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Вспомогательные функции**

`lib/viz/vector-helpers.ts`:

```ts
import { add, dot, norm, scale, type Vec } from '@/lib/math'

/** Половина размера видимого пространства сцены (координаты от −4 до 4). */
export const BOUND = 4

export function snapVec(v: Vec, step = 0.5, bound = BOUND): Vec {
  return v.map((x) => {
    const clamped = Math.max(-bound, Math.min(bound, Math.round(x / step) * step))
    return clamped === 0 ? 0 : clamped
  })
}

export function formatNum(x: number): string {
  if (!Number.isFinite(x)) return '—'
  const rounded = Math.round(x * 100) / 100
  return String(rounded === 0 ? 0 : rounded)
}

export function formatVec(v: Vec): string {
  return `[${v.map(formatNum).join(', ')}]`
}

export function vecEquals(a: Vec, b: Vec, eps = 1e-9): boolean {
  return a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= eps)
}

export type DotRelation = 'same' | 'perpendicular' | 'opposite'

export function describeDot(d: number, eps = 1e-9): DotRelation {
  if (Math.abs(d) <= eps) return 'perpendicular'
  return d > 0 ? 'same' : 'opposite'
}

export const DOT_RELATION_TEXT: Record<DotRelation, string> = {
  same: 'смотрят в одну сторону: a·b > 0',
  perpendicular: 'перпендикулярны: a·b = 0',
  opposite: 'смотрят в разные стороны: a·b < 0',
}

function signed(x: number): string {
  return x < 0 ? `(${formatNum(x)})` : formatNum(x)
}

/** «2·3 + (-1)·4 + 0·5 = 2» — вычисление скалярного произведения по шагам. */
export function dotBreakdown(a: Vec, b: Vec): string {
  const terms = a.map((x, i) => `${signed(x)}·${signed(b[i])}`)
  return `${terms.join(' + ')} = ${formatNum(dot(a, b))}`
}

/** Точки дуги угла между векторами (на сфере радиуса radius); null, если угла нет. */
export function arcPoints(a: Vec, b: Vec, radius = 0.8, segments = 24): Vec[] | null {
  const na = norm(a)
  const nb = norm(b)
  if (na === 0 || nb === 0) return null
  const ua = scale(a, 1 / na)
  const ub = scale(b, 1 / nb)
  if (Math.abs(dot(ua, ub)) > 0.9999) return null
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments
    const p = add(scale(ua, 1 - t), scale(ub, t))
    return scale(p, radius / norm(p))
  })
}
```

- [ ] **Step 4: R3F-примитивы**

`components/viz/vectors/three/Arrow3D.tsx`:

```tsx
'use client'

import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import type { Vec } from '@/lib/math'

export function pad3(v: Vec): [number, number, number] {
  return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0]
}

export function Arrow3D({
  from = [0, 0, 0],
  to,
  color,
  radius = 0.045,
  onClick,
}: {
  from?: Vec
  to: Vec
  color: string
  radius?: number
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const { length, start, quaternion } = useMemo(() => {
    const s = new Vector3(...pad3(from))
    const dir = new Vector3(...pad3(to)).sub(s)
    const q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      dir.length() > 0 ? dir.clone().normalize() : new Vector3(0, 1, 0),
    )
    return { length: dir.length(), start: s, quaternion: q }
  }, [from, to])

  if (length < 1e-6) {
    return (
      <mesh position={pad3(from)} onClick={onClick}>
        <sphereGeometry args={[radius * 2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    )
  }

  const head = Math.min(0.3, length * 0.35)
  const shaft = length - head
  return (
    <group position={start} quaternion={quaternion} onClick={onClick}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]}>
        <coneGeometry args={[radius * 2.6, head, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
```

`components/viz/vectors/three/Axes3D.tsx`:

```tsx
'use client'

import { Html, Line } from '@react-three/drei'
import { BOUND } from '@/lib/viz/vector-helpers'

const AXES = [
  { name: 'X', dir: [1, 0, 0] },
  { name: 'Y', dir: [0, 1, 0] },
  { name: 'Z', dir: [0, 0, 1] },
] as const

export function Axes3D({ bound = BOUND }: { bound?: number }) {
  return (
    <group>
      <gridHelper args={[bound * 2, bound * 2, '#2a3768', '#161d45']} />
      {AXES.map(({ name, dir }) => {
        const end = dir.map((d) => d * bound) as [number, number, number]
        const start = dir.map((d) => -d * bound) as [number, number, number]
        return (
          <group key={name}>
            <Line points={[start, end]} color="#5b6b9a" lineWidth={1} />
            <Html position={end} center className="axis-label">
              {name}
            </Html>
          </group>
        )
      })}
    </group>
  )
}
```

`components/viz/vectors/three/DragHandle.tsx`:

```tsx
'use client'

import { useCursor } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useState } from 'react'
import { Plane, Vector3 } from 'three'
import type { Vec } from '@/lib/math'
import { snapVec } from '@/lib/viz/vector-helpers'
import { pad3 } from './Arrow3D'

/** Светящийся шарик на кончике стрелки: тянется в плоскости экрана, координаты прилипают к сетке 0.5. */
export function DragHandle({ position, color, onDrag }: { position: Vec; color: string; onDrag: (v: Vec) => void }) {
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null
  const camera = useThree((s) => s.camera)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const plane = useMemo(() => new Plane(), [])
  const hit = useMemo(() => new Vector3(), [])
  useCursor(hover || dragging, dragging ? 'grabbing' : 'grab')

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const normal = new Vector3()
    camera.getWorldDirection(normal)
    plane.setFromNormalAndCoplanarPoint(normal, new Vector3(...pad3(position)))
    if (controls) controls.enabled = false
    setDragging(true)
  }

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    if (!dragging) return
    e.stopPropagation()
    if (e.ray.intersectPlane(plane, hit)) onDrag(snapVec([hit.x, hit.y, hit.z]))
  }

  function onPointerEnd(e: ThreeEvent<PointerEvent>) {
    if (!dragging) return
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (controls) controls.enabled = true
    setDragging(false)
  }

  const active = hover || dragging
  return (
    <mesh
      position={pad3(position)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <sphereGeometry args={[active ? 0.17 : 0.13, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.9 : 0.5} />
    </mesh>
  )
}
```

- [ ] **Step 5: Сцена векторов и её ленивая обёртка**

`components/viz/vectors/VectorScene.tsx`:

```tsx
'use client'

import { Html, Line } from '@react-three/drei'
import type { ReactNode } from 'react'
import { add, sub, type Vec } from '@/lib/math'
import { formatVec } from '@/lib/viz/vector-helpers'
import { useStageInfo, type StageInfo } from '@/components/viz/stage/stage-context'
import { Arrow3D, pad3 } from './three/Arrow3D'
import { Axes3D } from './three/Axes3D'
import { DragHandle } from './three/DragHandle'

export interface VectorSpec {
  id: string
  value: Vec
  color: string
  label: string
  /** Начало стрелки (по умолчанию — начало координат). */
  from?: Vec
  draggable?: boolean
  info?: StageInfo
}

export function VectorScene({
  vectors,
  onChange,
  arc,
  children,
}: {
  vectors: VectorSpec[]
  onChange?: (id: string, value: Vec) => void
  arc?: { points: Vec[]; color: string } | null
  children?: ReactNode
}) {
  const info = useStageInfo()
  return (
    <>
      <Axes3D />
      {vectors.map((v) => {
        const from = v.from ?? [0, 0, 0]
        const tip = add(from, v.value)
        return (
          <group key={v.id}>
            <Arrow3D
              from={from}
              to={tip}
              color={v.color}
              onClick={(e) => {
                e.stopPropagation()
                info?.show(v.info ?? { title: v.label, body: `${v.label} = ${formatVec(v.value)}` })
              }}
            />
            <Html position={pad3(tip)} className="vector-label" style={{ color: v.color, transform: 'translate(10px, -20px)' }}>
              {v.label}
            </Html>
            {v.draggable && onChange && (
              <DragHandle position={tip} color={v.color} onDrag={(p) => onChange(v.id, sub(p, from))} />
            )}
          </group>
        )
      })}
      {arc && <Line points={arc.points.map(pad3)} color={arc.color} lineWidth={2} />}
      {children}
    </>
  )
}
```

`components/viz/vectors/LazyVectorScene.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'

/** three.js и drei загружаются только вместе со сценой, а не с основным бандлом урока. */
export const LazyVectorScene = dynamic(() => import('./VectorScene').then((m) => m.VectorScene), { ssr: false })
```

- [ ] **Step 6: Поля координат**

`components/viz/vectors/VectorInputs.tsx`:

```tsx
'use client'

import { Fragment, useState } from 'react'
import type { Vec } from '@/lib/math'
import { parseNumber } from '@/lib/parse-number'
import { BOUND, formatNum } from '@/lib/viz/vector-helpers'

const AXIS_NAMES = ['x', 'y', 'z']

function NumberField({
  value,
  label,
  disabled,
  onCommit,
}: {
  value: number
  label: string
  disabled?: boolean
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  function commit() {
    const parsed = parseNumber(text)
    if (parsed === null) return
    const clamped = Math.max(-BOUND, Math.min(BOUND, parsed))
    onCommit(clamped)
    setText(formatNum(clamped))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      className="stage-input"
      disabled={disabled}
      value={focused ? text : formatNum(value)}
      onFocus={() => {
        setText(formatNum(value))
        setFocused(true)
      }}
      onBlur={() => {
        commit()
        setFocused(false)
      }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}

export function VectorInputs({
  label,
  color,
  value,
  onChange,
  disabled,
}: {
  label: string
  color: string
  value: Vec
  onChange: (v: Vec) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
      <span className="font-semibold" style={{ color }}>
        {label} =
      </span>
      <span className="text-space-muted">[</span>
      {value.map((x, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-space-muted">,</span>}
          <NumberField
            value={x}
            label={`${label}, координата ${AXIS_NAMES[i]}`}
            disabled={disabled}
            onCommit={(n) => onChange(value.map((y, j) => (j === i ? n : y)))}
          />
        </Fragment>
      ))}
      <span className="text-space-muted">]</span>
    </div>
  )
}
```

- [ ] **Step 7: MDX-компоненты векторов**

`components/viz/vectors/VectorSpace3D.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { norm, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

export function VectorSpace3D({ initial = [2, 1, 2], label = 'v', caption }: { initial?: Vec; label?: string; caption?: ReactNode }) {
  const [v, setV] = useState<Vec>(initial)
  const color = CONCEPTS.a.glow
  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div>
          <VectorInputs label={label} color={color} value={v} onChange={setV} />
          <p className="readout">
            длина |{label}| = {formatNum(norm(v))}
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          {
            id: 'v',
            value: v,
            color,
            label,
            draggable: true,
            info: {
              title: `Вектор ${label}`,
              body: `${formatVec(v)}: ${formatNum(v[0])} по X, ${formatNum(v[1])} по Y, ${formatNum(v[2])} по Z.`,
            },
          },
        ]}
        onChange={(_, next) => setV(next)}
      />
    </Stage>
  )
}
```

`components/viz/vectors/VectorTask.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'
import type { Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec, vecEquals } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

export function VectorTask({ id, target, start = [0, 0, 0] }: { id: string; target: Vec; start?: Vec }) {
  const gate = useGate(id)
  const [v, setV] = useState<Vec>(start)
  const [wrong, setWrong] = useState(false)
  const solved = gate.passed
  const shown = gate.revealed ? target : v
  const color = CONCEPTS.a.glow

  function update(next: Vec) {
    setV(next)
    setWrong(false)
  }

  function check() {
    const ok = vecEquals(v, target, 0.01)
    setWrong(!ok)
    gate.record(ok)
  }

  return (
    <div className="gate-card" data-gate="vector-task" data-passed={solved}>
      <p className="gate-label m-0">Задание</p>
      <p className="gate-question">Поставь стрелку v в точку {formatVec(target)}</p>
      <Stage
        height={300}
        fallback={<StageFallbackNote />}
        controls={<VectorInputs label="v" color={color} value={shown} onChange={update} disabled={solved} />}
      >
        <LazyVectorScene
          vectors={[{ id: 'v', value: shown, color, label: 'v', draggable: !solved }]}
          onChange={(_, next) => update(next)}
        />
      </Stage>
      {!solved && (
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={check}>
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={() => gate.reveal()}>
              Показать ответ
            </button>
          )}
        </div>
      )}
      {wrong && !solved && (
        <p role="status" className="feedback-wrong">
          Пока {formatVec(v)}. Сравни каждую координату с целью: x — вправо, y — вверх, z — к тебе.
        </p>
      )}
      {solved && (
        <p role="status" className="feedback-right">
          {gate.revealed
            ? `Вот так: ${formatNum(target[0])} по X, ${formatNum(target[1])} по Y, ${formatNum(target[2])} по Z.`
            : '✓ Точно в цель!'}
        </p>
      )}
    </div>
  )
}
```

`components/viz/vectors/VectorOps3D.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { add, scale, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import type { VectorSpec } from './VectorScene'
import { VectorInputs } from './VectorInputs'

const A = CONCEPTS.a.glow
const B = CONCEPTS.b.glow
const R = CONCEPTS.result.glow

export function VectorOps3D({
  mode,
  a: a0 = [2, 0, 1],
  b: b0 = [0, 2, 1],
  caption,
}: {
  mode: 'add' | 'scale'
  a?: Vec
  b?: Vec
  caption?: ReactNode
}) {
  const [a, setA] = useState<Vec>(a0)
  const [b, setB] = useState<Vec>(b0)
  const [k, setK] = useState(2)

  if (mode === 'add') {
    const sum = add(a, b)
    const vectors: VectorSpec[] = [
      { id: 'a', value: a, color: A, label: 'a', draggable: true },
      { id: 'b', value: b, color: B, label: 'b', draggable: true },
      { id: 'b-moved', value: b, from: a, color: B, label: '' },
      {
        id: 'sum',
        value: sum,
        color: R,
        label: 'a + b',
        info: { title: 'Сумма a + b', body: `Пройди по a, потом по b — окажешься в ${formatVec(sum)}.` },
      },
    ]
    return (
      <Stage
        caption={caption}
        fallback={<StageFallbackNote />}
        controls={
          <div className="space-y-1.5">
            <VectorInputs label="a" color={A} value={a} onChange={setA} />
            <VectorInputs label="b" color={B} value={b} onChange={setB} />
            <p className="readout">
              a + b = {formatVec(a)} + {formatVec(b)} = <span style={{ color: R }}>{formatVec(sum)}</span>
            </p>
          </div>
        }
      >
        <LazyVectorScene vectors={vectors} onChange={(id, v) => (id === 'a' ? setA(v) : setB(v))} />
      </Stage>
    )
  }

  const scaled = scale(a, k)
  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-1.5">
          <VectorInputs label="a" color={A} value={a} onChange={setA} />
          <label className="flex items-center gap-3 font-mono text-sm">
            k = {formatNum(k)}
            <input
              type="range"
              min={-2}
              max={3}
              step={0.5}
              value={k}
              aria-label="Множитель k"
              className="accent-[#a3e635]"
              onChange={(e) => setK(Number(e.target.value))}
            />
          </label>
          <p className="readout">
            {formatNum(k)}·{formatVec(a)} = <span style={{ color: R }}>{formatVec(scaled)}</span>
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          { id: 'a', value: a, color: A, label: 'a', draggable: true },
          { id: 'ka', value: scaled, color: R, label: `${formatNum(k)}·a` },
        ]}
        onChange={(_, v) => setA(v)}
      />
    </Stage>
  )
}
```

`components/viz/vectors/DotProduct3D.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { angleDeg, dot, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { DOT_RELATION_TEXT, arcPoints, describeDot, dotBreakdown, formatNum } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

const RELATION_COLOR = { same: '#a3e635', perpendicular: '#e2e8f0', opposite: '#fb7185' } as const

export function DotProduct3D({
  a: a0 = [2, 1, 0],
  b: b0 = [1, 2, 0],
  caption,
}: {
  a?: Vec
  b?: Vec
  caption?: ReactNode
}) {
  const [a, setA] = useState<Vec>(a0)
  const [b, setB] = useState<Vec>(b0)
  const relation = describeDot(dot(a, b))
  const angle = angleDeg(a, b)
  const points = arcPoints(a, b)
  const color = RELATION_COLOR[relation]

  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-1.5">
          <VectorInputs label="a" color={CONCEPTS.a.glow} value={a} onChange={setA} />
          <VectorInputs label="b" color={CONCEPTS.b.glow} value={b} onChange={setB} />
          <p className="readout">a·b = {dotBreakdown(a, b)}</p>
          <p className="readout">
            угол θ = {Number.isNaN(angle) ? '—' : `${formatNum(angle)}°`} ·{' '}
            <span style={{ color }}>{DOT_RELATION_TEXT[relation]}</span>
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          { id: 'a', value: a, color: CONCEPTS.a.glow, label: 'a', draggable: true },
          { id: 'b', value: b, color: CONCEPTS.b.glow, label: 'b', draggable: true },
        ]}
        onChange={(id, v) => (id === 'a' ? setA(v) : setB(v))}
        arc={points ? { points, color } : null}
      />
    </Stage>
  )
}
```

- [ ] **Step 8: Зарегистрировать для MDX**

В `mdx-components.tsx` добавить импорты и ключи:

```tsx
import { DotProduct3D } from '@/components/viz/vectors/DotProduct3D'
import { VectorOps3D } from '@/components/viz/vectors/VectorOps3D'
import { VectorSpace3D } from '@/components/viz/vectors/VectorSpace3D'
import { VectorTask } from '@/components/viz/vectors/VectorTask'
```

```tsx
  VectorSpace3D,
  VectorTask,
  VectorOps3D,
  DotProduct3D,
```

- [ ] **Step 9: Запустить тесты и проверку типов**

Run: `npm test -- lib/viz components/viz && npm run typecheck`
Expected: PASS, без ошибок типов.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(viz): draggable 3D vectors, vector operations and dot-product explorer with DOM fallback" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Упражнения с кодом: TypeScript в Web Worker

**Files:**
- Create: `lib/code/types.ts`, `lib/code/approx-equal.ts`, `lib/code/execute.ts`, `content/attention/exercises/dot.ts`, `content/attention/exercises/index.ts`, `components/code/runner.worker.ts`, `components/code/useRunner.ts`, `components/code/CodeEditor.tsx`, `components/code/CodeExercise.tsx`
- Modify: `mdx-components.tsx`
- Test: `lib/code/approx-equal.test.ts`, `lib/code/execute.test.ts`, `content/attention/exercises/exercises.test.ts`, `components/code/CodeExercise.test.tsx`

**Interfaces:**
- Consumes: `lib/math` (Task 2), `useGate` (Task 8), `useProgress` (Task 5), `plural` (Task 10).
- Produces:
  - `lib/code/types.ts`: `ExerciseTest { name; args: unknown[]; expected: unknown; tolerance? }`, `HelperName = 'dot' | 'matVec' | 'matMul' | 'transpose' | 'softmax'`, `ExerciseDef { id; title; entry; prompt; starter; tests; hints: string[]; solution; helpers?: HelperName[] }`, `TestResult { name; pass; expectedText; actualText?; error? }`, `ExecutionResult = { status: 'ok'; results: TestResult[] } | { status: 'compile-error'; message } | { status: 'runtime-error'; message } | { status: 'timeout' }`.
  - `approxEqual(actual: unknown, expected: unknown, tolerance: number): boolean`.
  - `compileSource(source: string): string`, `formatValue(value: unknown): string`, `executeExercise(source: string, exercise: ExerciseDef): ExecutionResult`.
  - `EXERCISES: Record<string, ExerciseDef>` (пока `dot`).
  - `RUN_TIMEOUT_MS = 2000`, `useRunner(timeoutMs?): (source: string, exerciseId: string) => Promise<ExecutionResult>`.
  - `<CodeEditor value onChange onRun? ariaLabel />`, `<CodeExercise id />` («ворота» `code:<id>`; корневой элемент с `data-exercise="<id>"`).

- [ ] **Step 1: Типы**

`lib/code/types.ts`:

```ts
export interface ExerciseTest {
  name: string
  args: unknown[]
  expected: unknown
  tolerance?: number
}

export type HelperName = 'dot' | 'matVec' | 'matMul' | 'transpose' | 'softmax'

export interface ExerciseDef {
  id: string
  title: string
  /** Имя функции, которую пишет ученик. */
  entry: string
  prompt: string
  starter: string
  tests: ExerciseTest[]
  hints: string[]
  solution: string
  /** Эталонные функции из lib/math, доступные в коде ученика. */
  helpers?: HelperName[]
}

export interface TestResult {
  name: string
  pass: boolean
  expectedText: string
  actualText?: string
  error?: string
}

export type ExecutionResult =
  | { status: 'ok'; results: TestResult[] }
  | { status: 'compile-error'; message: string }
  | { status: 'runtime-error'; message: string }
  | { status: 'timeout' }
```

- [ ] **Step 2: Написать падающие тесты**

`lib/code/approx-equal.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { approxEqual } from './approx-equal'

describe('approxEqual', () => {
  it('compares numbers within the tolerance', () => {
    expect(approxEqual(0.1 + 0.2, 0.3, 1e-9)).toBe(true)
    expect(approxEqual(32.0000001, 32, 1e-6)).toBe(true)
    expect(approxEqual(1, 1.1, 0.01)).toBe(false)
  })

  it('treats -0 and 0 as equal', () => {
    expect(approxEqual(-0, 0, 1e-6)).toBe(true)
  })

  it('compares arrays element by element, including nested ones (matrices)', () => {
    expect(approxEqual([1, [2, 3]], [1, [2, 3.0000001]], 1e-6)).toBe(true)
    expect(approxEqual([[1, 2]], [[1, 3]], 1e-6)).toBe(false)
  })

  it('rejects different lengths and shapes', () => {
    expect(approxEqual([1, 2], [1, 2, 3], 1e-6)).toBe(false)
    expect(approxEqual([1], 1, 1e-6)).toBe(false)
    expect(approxEqual(1, [1], 1e-6)).toBe(false)
  })

  it('never throws on whatever student code returns', () => {
    for (const bad of [undefined, null, '32', Number.NaN, {}, () => 32, Number.POSITIVE_INFINITY]) {
      expect(approxEqual(bad, 32, 1e-6)).toBe(false)
    }
  })
})
```

`lib/code/execute.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { executeExercise } from './execute'
import type { ExerciseDef } from './types'

const exercise: ExerciseDef = {
  id: 'sum',
  title: 'sum',
  entry: 'sum',
  prompt: '',
  starter: '',
  solution: '',
  hints: [],
  tests: [
    { name: 'sum([1, 2]) = 3', args: [[1, 2]], expected: 3 },
    { name: 'sum([]) = 0', args: [[]], expected: 0 },
  ],
}

describe('executeExercise', () => {
  it('runs TypeScript and reports every test', () => {
    expect(executeExercise('function sum(xs: number[]): number { return xs.reduce((s, x) => s + x, 0) }', exercise)).toEqual({
      status: 'ok',
      results: [
        { name: 'sum([1, 2]) = 3', pass: true, expectedText: '3', actualText: '3' },
        { name: 'sum([]) = 0', pass: true, expectedText: '0', actualText: '0' },
      ],
    })
  })

  it('accepts an exported function', () => {
    expect(executeExercise('export function sum(xs: number[]) { return 3 }', exercise).status).toBe('ok')
  })

  it('reports syntax errors', () => {
    expect(executeExercise('function sum(xs: number[] { return 0 }', exercise).status).toBe('compile-error')
  })

  it('reports a missing function by name', () => {
    expect(executeExercise('function total() { return 0 }', exercise)).toMatchObject({
      status: 'runtime-error',
      message: expect.stringContaining('sum'),
    })
  })

  it('reports errors thrown while the code is loading', () => {
    expect(executeExercise('throw new Error("boom")\nfunction sum() { return 0 }', exercise)).toEqual({
      status: 'runtime-error',
      message: 'boom',
    })
  })

  it('turns an exception inside one test into a failed test, not a crash', () => {
    const result = executeExercise('function sum(xs: number[]) { if (xs.length === 0) throw new Error("пусто"); return 3 }', exercise)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.results[0].pass).toBe(true)
    expect(result.results[1]).toMatchObject({ pass: false, error: 'пусто' })
  })

  it('isolates tests from arguments mutated by student code', () => {
    const twice: ExerciseDef = {
      ...exercise,
      tests: [
        { name: 'a', args: [[1, 2]], expected: 3 },
        { name: 'b', args: [[1, 2]], expected: 3 },
      ],
    }
    const result = executeExercise('function sum(xs: number[]) { const s = xs[0] + xs[1]; xs.push(100); return s }', twice)
    expect(result.status === 'ok' && result.results.every((t) => t.pass)).toBe(true)
    expect(twice.tests[0].args).toEqual([[1, 2]])
  })

  it('fails tests, without crashing, when the wrong type is returned', () => {
    const result = executeExercise('function sum() { return "3" }', exercise)
    expect(result.status === 'ok' && result.results.map((t) => t.pass)).toEqual([false, false])
    expect(result.status === 'ok' && result.results[0].actualText).toBe('"3"')
  })

  it('provides helper functions declared by the exercise', () => {
    const usesDot: ExerciseDef = {
      ...exercise,
      entry: 'twice',
      helpers: ['dot'],
      tests: [{ name: 't', args: [[1, 2], [3, 4]], expected: 22 }],
    }
    const result = executeExercise('function twice(a: number[], b: number[]) { return 2 * dot(a, b) }', usesDot)
    expect(result.status === 'ok' && result.results[0].pass).toBe(true)
  })
})
```

`content/attention/exercises/exercises.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { executeExercise } from '@/lib/code/execute'
import { EXERCISES } from './index'

describe.each(Object.values(EXERCISES))('exercise $id', (exercise) => {
  it('reference solution passes every test', () => {
    const result = executeExercise(exercise.solution, exercise)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') for (const t of result.results) expect(t.pass, t.name).toBe(true)
  })

  it('starter code fails at least one test (the exercise is not solved by itself)', () => {
    const result = executeExercise(exercise.starter, exercise)
    expect(result.status !== 'ok' || result.results.some((t) => !t.pass)).toBe(true)
  })

  it('has hints and a starter with the right function name', () => {
    expect(exercise.hints.length).toBeGreaterThan(0)
    expect(exercise.starter).toContain(`function ${exercise.entry}(`)
  })
})
```

`components/code/CodeExercise.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { CodeExercise } from './CodeExercise'

const { run } = vi.hoisted(() => ({ run: vi.fn() }))

vi.mock('./useRunner', () => ({ useRunner: () => run, RUN_TIMEOUT_MS: 2000 }))
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel: string }) => (
    <textarea aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const green = { status: 'ok', results: [{ name: 't1', pass: true, expectedText: '32', actualText: '32' }] }
const red = { status: 'ok', results: [{ name: 't1', pass: false, expectedText: '32', actualText: '0' }] }

beforeEach(() => {
  useProgress.setState(emptyProgress())
  run.mockReset()
})

describe('CodeExercise', () => {
  it('passes the gate when every test is green', async () => {
    run.mockResolvedValue(green)
    render(<CodeExercise id="dot" />)
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    expect(await screen.findByText('1 из 1 теста пройдено')).toBeInTheDocument()
    expect(useProgress.getState().gates['code:dot'].passed).toBe(true)
  })

  it('shows expected vs actual and offers the solution after three failed runs', async () => {
    run.mockResolvedValue(red)
    render(<CodeExercise id="dot" />)
    const runButton = screen.getByRole('button', { name: '▶ Запустить тесты' })
    await userEvent.click(runButton)
    expect(await screen.findByText('ожидалось 32, получено 0')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Показать решение' })).toBeNull()
    await userEvent.click(runButton)
    await userEvent.click(runButton)
    await userEvent.click(await screen.findByRole('button', { name: 'Показать решение' }))
    expect(useProgress.getState().gates['code:dot']).toMatchObject({ passed: true, revealed: true })
  })

  it('explains a timeout as a probable infinite loop', async () => {
    run.mockResolvedValue({ status: 'timeout' })
    render(<CodeExercise id="dot" />)
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    expect(await screen.findByText(/Похоже на бесконечный цикл/)).toBeInTheDocument()
  })

  it('saves edits to progress', async () => {
    render(<CodeExercise id="dot" />)
    const editor = screen.getByRole('textbox', { name: 'Код: Напиши dot(a, b)' })
    await userEvent.clear(editor)
    await userEvent.type(editor, 'x')
    expect(useProgress.getState().code.dot).toBe('x')
  })
})
```

- [ ] **Step 3: Запустить тесты и убедиться, что они падают**

Run: `npm test -- lib/code content/attention/exercises components/code`
Expected: FAIL — модули не найдены.

- [ ] **Step 4: Заготовка `approxEqual`**

`lib/code/approx-equal.ts`:

```ts
/**
 * Сравнивает ответ кода ученика с ожидаемым: числа — с допуском, массивы (и матрицы) — поэлементно.
 * Не должна бросать исключений ни на каком входе: код ученика может вернуть что угодно.
 */
export function approxEqual(actual: unknown, expected: unknown, tolerance: number): boolean {
  // 🧑‍🎓 Вклад ученика (Step 5)
  throw new Error('approxEqual: not implemented yet')
}
```

- [ ] **Step 5: 🧑‍🎓 Вклад ученика — `approxEqual`**

**Остановиться и попросить пользователя** реализовать тело `approxEqual` (5–10 строк, рекурсия). Контекст для просьбы:
- Тесты из Step 2 фиксируют поведение: допуск для чисел, поэлементное сравнение вложенных массивов, `false` (а не исключение) для `undefined`, строк, `NaN`, `Infinity`, функций.
- **Решение за учеником — абсолютный или относительный допуск.** Абсолютный (`|a − e| ≤ tol`) прост и хорош для вероятностей softmax (числа от 0 до 1), но слишком строг для больших чисел вроде произведений матриц (~10⁴). Относительный (`|a − e| ≤ tol·max(1, |e|)`) масштабируется, но около нуля ведёт себя хуже. Оба варианта проходят текущие тесты, а выбор повлияет на будущие упражнения `matMul` и `softmax`.

Если пользователь откажется, вставить эталон (абсолютный допуск):

```ts
  if (typeof expected === 'number') {
    return typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, i) => approxEqual(actual[i], item, tolerance))
    )
  }
  return Object.is(actual, expected)
```

- [ ] **Step 6: Исполнитель кода**

`lib/code/execute.ts`:

```ts
import { transform } from 'sucrase'
import { dot, matMul, matVec, softmax, transpose } from '@/lib/math'
import { approxEqual } from './approx-equal'
import type { ExecutionResult, ExerciseDef, HelperName, TestResult } from './types'

const HELPERS: Record<HelperName, unknown> = { dot, matVec, matMul, transpose, softmax }

/** TypeScript → JavaScript. `export` убираем: код выполняется как тело функции, а не как модуль. */
export function compileSource(source: string): string {
  const withoutExports = source.replace(/^(\s*)export\s+(default\s+)?/gm, '$1')
  return transform(withoutExports, { transforms: ['typescript'] }).code
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** Короткое текстовое представление значения для отчёта «ожидалось / получено». */
export function formatValue(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(Math.round(value * 10000) / 10000)
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`
  if (typeof value === 'function') return '[функция]'
  if (value === undefined) return 'undefined'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function executeExercise(source: string, exercise: ExerciseDef): ExecutionResult {
  let code: string
  try {
    code = compileSource(source)
  } catch (e) {
    return { status: 'compile-error', message: errorMessage(e) }
  }

  const names = exercise.helpers ?? []
  let fn: unknown
  try {
    const factory = new Function(
      'helpers',
      `"use strict";\nconst { ${names.join(', ')} } = helpers;\n${code}\nreturn typeof ${exercise.entry} === 'function' ? ${exercise.entry} : undefined;`,
    )
    fn = factory(Object.fromEntries(names.map((n) => [n, HELPERS[n]])))
  } catch (e) {
    return { status: 'runtime-error', message: errorMessage(e) }
  }
  if (typeof fn !== 'function') {
    return { status: 'runtime-error', message: `Не нашёл функцию ${exercise.entry}. Проверь, что она так и называется.` }
  }

  const results: TestResult[] = exercise.tests.map((test) => {
    const expectedText = formatValue(test.expected)
    try {
      // structuredClone: если код ученика испортит аргументы, следующие тесты этого не увидят
      const actual: unknown = (fn as (...args: unknown[]) => unknown)(...structuredClone(test.args))
      return {
        name: test.name,
        pass: approxEqual(actual, test.expected, test.tolerance ?? 1e-6),
        expectedText,
        actualText: formatValue(actual),
      }
    } catch (e) {
      return { name: test.name, pass: false, expectedText, error: errorMessage(e) }
    }
  })
  return { status: 'ok', results }
}
```

- [ ] **Step 7: Упражнение `dot`**

`content/attention/exercises/dot.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'

export const dotExercise: ExerciseDef = {
  id: 'dot',
  title: 'Напиши dot(a, b)',
  entry: 'dot',
  prompt: 'Скалярное произведение: перемножь координаты попарно и сложи результаты.',
  starter: `function dot(a: number[], b: number[]): number {
  // Перемножь a[i] и b[i] для каждого i и сложи всё вместе.
  return 0
}
`,
  tests: [
    { name: 'dot([1, 2, 3], [4, 5, 6]) = 32', args: [[1, 2, 3], [4, 5, 6]], expected: 32 },
    { name: 'перпендикулярные: dot([1, 0, 0], [0, 1, 0]) = 0', args: [[1, 0, 0], [0, 1, 0]], expected: 0 },
    { name: 'отрицательные: dot([2, -1], [-3, 4]) = -10', args: [[2, -1], [-3, 4]], expected: -10 },
    { name: 'дроби: dot([0.5, 0.5], [2, 2]) = 2', args: [[0.5, 0.5], [2, 2]], expected: 2 },
    { name: 'пустые векторы: dot([], []) = 0', args: [[], []], expected: 0 },
  ],
  hints: [
    'Заведи переменную sum = 0 и пройди циклом по индексам i от 0 до a.length − 1.',
    'На каждом шаге прибавляй к sum произведение a[i] * b[i].',
    'После цикла верни sum.',
  ],
  solution: `function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}
`,
}
```

`content/attention/exercises/index.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'
import { dotExercise } from './dot'

export const EXERCISES: Record<string, ExerciseDef> = {
  [dotExercise.id]: dotExercise,
}
```

- [ ] **Step 8: Worker, хук запуска, редактор, компонент упражнения**

`components/code/runner.worker.ts`:

```ts
import { EXERCISES } from '@/content/attention/exercises'
import { executeExercise } from '@/lib/code/execute'
import type { ExecutionResult } from '@/lib/code/types'

interface RunRequest {
  requestId: number
  exerciseId: string
  source: string
}

// Типы lib "webworker" конфликтуют с "dom" в общем tsconfig, поэтому описываем нужное вручную.
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null
  postMessage: (message: { requestId: number; result: ExecutionResult }) => void
}

ctx.onmessage = (event) => {
  const { requestId, exerciseId, source } = event.data
  const exercise = EXERCISES[exerciseId]
  const result: ExecutionResult = exercise
    ? executeExercise(source, exercise)
    : { status: 'runtime-error', message: `Неизвестное упражнение: ${exerciseId}` }
  ctx.postMessage({ requestId, result })
}
```

`components/code/useRunner.ts`:

```ts
'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ExecutionResult } from '@/lib/code/types'

export const RUN_TIMEOUT_MS = 2000

let nextRequestId = 1

/** Запускает код ученика в отдельном Web Worker. Зависший код останавливается по таймауту. */
export function useRunner(timeoutMs = RUN_TIMEOUT_MS): (source: string, exerciseId: string) => Promise<ExecutionResult> {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  return useCallback(
    (source: string, exerciseId: string) =>
      new Promise<ExecutionResult>((resolve) => {
        workerRef.current ??= new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
        const worker = workerRef.current
        const requestId = nextRequestId++

        const finish = (result: ExecutionResult, killWorker: boolean) => {
          clearTimeout(timer)
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          if (killWorker) {
            worker.terminate()
            workerRef.current = null
          }
          resolve(result)
        }
        const onMessage = (e: MessageEvent<{ requestId: number; result: ExecutionResult }>) => {
          if (e.data.requestId === requestId) finish(e.data.result, false)
        }
        const onError = (e: ErrorEvent) =>
          finish({ status: 'runtime-error', message: e.message || 'Не удалось запустить проверку кода' }, true)
        const timer = setTimeout(() => finish({ status: 'timeout' }, true), timeoutMs)

        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', onError)
        worker.postMessage({ requestId, exerciseId, source })
      }),
    [timeoutMs],
  )
}
```

`components/code/CodeEditor.tsx`:

```tsx
'use client'

import { javascript } from '@codemirror/lang-javascript'
import { Prec } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { EditorView, basicSetup } from 'codemirror'
import { useEffect, useRef } from 'react'

export function CodeEditor({
  value,
  onChange,
  onRun,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  ariaLabel: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onRunRef = useRef(onRun)

  useEffect(() => {
    onChangeRef.current = onChange
    onRunRef.current = onRun
  })

  useEffect(() => {
    if (!host.current) return
    const editor = new EditorView({
      parent: host.current,
      doc: value,
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        oneDark,
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                onRunRef.current?.()
                return true
              },
            },
          ]),
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
      ],
    })
    view.current = editor
    return () => editor.destroy()
    // Редактор создаётся один раз; внешние изменения value синхронизирует эффект ниже.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const editor = view.current
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className="code-editor" />
}
```

`components/code/CodeExercise.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'
import { EXERCISES } from '@/content/attention/exercises'
import type { ExecutionResult, ExerciseDef } from '@/lib/code/types'
import { plural } from '@/lib/plural'
import { useProgress } from '@/lib/progress/store'
import { CodeEditor } from './CodeEditor'
import { useRunner } from './useRunner'

function RunReport({ result }: { result: ExecutionResult }) {
  if (result.status === 'timeout') {
    return (
      <p role="status" className="feedback-wrong">
        Похоже на бесконечный цикл: код работал дольше 2 секунд и был остановлен.
      </p>
    )
  }
  if (result.status === 'compile-error') {
    return (
      <p role="status" className="feedback-wrong">
        Ошибка в синтаксисе: {result.message}
      </p>
    )
  }
  if (result.status === 'runtime-error') {
    return (
      <p role="status" className="feedback-wrong">
        Ошибка при запуске: {result.message}
      </p>
    )
  }
  const passed = result.results.filter((t) => t.pass).length
  const total = result.results.length
  return (
    <div role="status" className="mt-4">
      <p className={`m-0 text-sm font-semibold ${passed === total ? 'text-success' : 'text-error'}`}>
        {passed} из {total} {plural(total, ['теста', 'тестов', 'тестов'])} пройдено
      </p>
      <ul className="mt-2 list-none space-y-1 p-0 font-mono text-[13px]">
        {result.results.map((t) => (
          <li key={t.name} className={t.pass ? 'text-success' : 'text-error'}>
            {t.pass ? '✓' : '✗'} {t.name}
            {!t.pass && (
              <span className="block pl-5 text-ink-soft">
                {t.error ? `ошибка: ${t.error}` : `ожидалось ${t.expectedText}, получено ${t.actualText}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CodeExerciseView({ exercise }: { exercise: ExerciseDef }) {
  const gate = useGate(`code:${exercise.id}`)
  const saved = useProgress((s) => s.code[exercise.id])
  const saveCode = useProgress((s) => s.saveCode)
  const run = useRunner()
  const source = saved ?? exercise.starter
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [running, setRunning] = useState(false)
  const [failedRuns, setFailedRuns] = useState(0)
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  async function runTests() {
    setRunning(true)
    const next = await run(source, exercise.id)
    setRunning(false)
    setResult(next)
    if (next.status === 'ok' && next.results.every((t) => t.pass)) gate.pass()
    else setFailedRuns((n) => n + 1)
  }

  return (
    <div className="gate-card" data-gate="code" data-exercise={exercise.id} data-passed={gate.passed}>
      <p className="gate-label m-0">Напиши код</p>
      <p className="gate-question">{exercise.title}</p>
      <p className="mt-1 mb-0 text-sm text-ink-soft">{exercise.prompt}</p>
      {exercise.helpers && exercise.helpers.length > 0 && (
        <p className="mt-1 mb-0 text-xs text-muted">Можно пользоваться: {exercise.helpers.join(', ')}</p>
      )}

      <div className="observatory mt-4 p-3">
        <CodeEditor
          value={source}
          onChange={(code) => saveCode(exercise.id, code)}
          onRun={runTests}
          ariaLabel={`Код: ${exercise.title}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={runTests} disabled={running}>
          {running ? 'Проверяю…' : '▶ Запустить тесты'}
        </button>
        <span className="text-xs text-muted">Ctrl + Enter</span>
        {hints < exercise.hints.length && (
          <button type="button" className="btn-ghost" onClick={() => setHints(hints + 1)}>
            Подсказка ({hints + 1}/{exercise.hints.length})
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => saveCode(exercise.id, exercise.starter)}>
          Сбросить код
        </button>
        {failedRuns >= 3 && !showSolution && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setShowSolution(true)
              if (!gate.passed) gate.reveal()
            }}
          >
            Показать решение
          </button>
        )}
      </div>

      {hints > 0 && (
        <ol className="mt-3 text-sm">
          {exercise.hints.slice(0, hints).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      )}

      {result && <RunReport result={result} />}

      {gate.passed && !gate.revealed && (
        <p role="status" className="feedback-right">
          ✓ Все тесты зелёные. Эта функция теперь твоя — она ещё пригодится.
        </p>
      )}

      {showSolution && (
        <div className="mt-4">
          <p className="gate-label">Решение</p>
          <pre className="observatory overflow-x-auto p-4 font-mono text-[13px]">{exercise.solution}</pre>
          <button type="button" className="btn-ghost mt-2" onClick={() => saveCode(exercise.id, exercise.solution)}>
            Вставить в редактор
          </button>
        </div>
      )}
    </div>
  )
}

export function CodeExercise({ id }: { id: string }) {
  const exercise = EXERCISES[id]
  if (!exercise) return <p className="feedback-wrong">Упражнение «{id}» не найдено.</p>
  return <CodeExerciseView exercise={exercise} />
}
```

- [ ] **Step 9: Зарегистрировать для MDX**

В `mdx-components.tsx` добавить `import { CodeExercise } from '@/components/code/CodeExercise'` и ключ `CodeExercise`.

- [ ] **Step 10: Запустить тесты и сборку**

Run: `npm test -- lib/code content/attention/exercises components/code && npm run typecheck && npm run build`
Expected: PASS; сборка успешна (Turbopack собрал worker отдельным чанком: в `out/_next/static` есть файл с `runner.worker` в имени или в содержимом).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(code): TypeScript exercises executed in a Web Worker with tests, hints and timeout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Каркас сайта: шапка, навигация, главная, карта курса, глоссарий

**Files:**
- Create: `components/layout/TopBar.tsx`, `components/layout/ReviewBadge.tsx`, `components/course/CourseNav.tsx`, `components/layout/StorageBanner.tsx`, `components/course/ContinueButton.tsx`, `components/course/CourseCard.tsx`, `components/course/CourseMap.tsx`, `content/home/word-cloud.ts`, `components/viz/words/WordCloudScene.tsx`, `components/viz/words/WordCloud3D.tsx`, `app/courses/[course]/page.tsx`, `app/glossary/page.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/courses/[course]/[lesson]/page.tsx`, `mdx-components.tsx`
- Test: `components/course/course.test.tsx`

**Interfaces:**
- Consumes: реестр и типы курса (Task 3), `useProgress`, `useHydrated`, `isDue`, `todayISO`, `isLocalStorageAvailable` (Tasks 4–5), `Stage` (Task 12), `GLOSSARY` (Task 11), `plural` (Task 10), `SITE` (Task 1).
- Produces: `<TopBar />`, `<ReviewBadge />`, `<CourseNavList course currentSlug? />`, `<CourseNav />`, `<MobileCourseNav />`, `<StorageBanner />`, `<ContinueButton course />`, `<CourseCard course />`, `<CourseMap courseId? />` (MDX-компонент), `<WordCloud3D />`; страницы `/`, `/courses/[course]`, `/glossary`, `sitemap.xml`, `robots.txt`, 404.

- [ ] **Step 1: Написать падающий тест**

`components/course/course.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { attentionCourse } from '@/content/attention/course'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { CourseMap } from '@/components/course/CourseMap'
import { ContinueButton } from './ContinueButton'
import { CourseNavList } from './CourseNav'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('CourseNavList', () => {
  it('shows statuses and ignores progress for lessons that no longer exist', async () => {
    useProgress.setState({
      lessons: {
        '0.1': { status: 'completed', unlockedStep: 3 },
        '9.9': { status: 'completed', unlockedStep: 1 },
      },
    })
    await useProgress.persist.rehydrate()
    render(<CourseNavList course={attentionCourse} currentSlug="0-1-riddle" />)
    expect(screen.getByRole('link', { name: /0\.1 Загадка/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('пройден')).toBeInTheDocument()
    expect(screen.getAllByText('скоро').length).toBeGreaterThan(0)
  })
})

describe('ContinueButton', () => {
  it('invites a newcomer to start with the first lesson', async () => {
    await useProgress.persist.rehydrate()
    render(<ContinueButton course={attentionCourse} />)
    expect(screen.getByRole('link', { name: /Начать с первого урока/ })).toHaveAttribute(
      'href',
      '/courses/attention/0-1-riddle',
    )
  })
})

describe('CourseMap', () => {
  it('expands a module to show its lessons', async () => {
    render(<CourseMap />)
    await userEvent.click(screen.getByRole('button', { name: /Математика как язык/ }))
    expect(screen.getByText(/1\.1 Вектор: стрелка и список чисел/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- components/layout`
Expected: FAIL — модули не найдены.

- [ ] **Step 3: Навигация и служебные элементы**

`components/course/CourseNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import type { CourseMeta } from '@/lib/course/types'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

function StatusDot({ status }: { status?: string }) {
  const label = status === 'completed' ? 'пройден' : status === 'in-progress' ? 'в процессе' : 'не начат'
  const style =
    status === 'completed' ? 'bg-success' : status === 'in-progress' ? 'bg-glow-cyan' : 'border border-muted'
  return <span aria-label={label} title={label} className={`inline-block h-2 w-2 shrink-0 rounded-full ${style}`} />
}

export function CourseNavList({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)

  return (
    <div className="text-sm">
      {course.modules.map((m) => (
        <div key={m.id} className="mb-5">
          <p className="gate-label">
            {m.number}. {m.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {m.lessons.map((l) => {
              if (l.availability !== 'ready') {
                return (
                  <li key={l.id} className="flex items-center gap-2 px-2 py-1 text-muted">
                    <span aria-hidden className="inline-block h-2 w-2 shrink-0" />
                    {l.id} {l.title}
                    <span className="ml-auto text-[10px] tracking-wider uppercase">скоро</span>
                  </li>
                )
              }
              const current = l.slug === currentSlug
              return (
                <li key={l.id}>
                  <Link
                    href={`/courses/${course.id}/${l.slug}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-paper-deep ${current ? 'bg-paper-deep font-semibold' : ''}`}
                  >
                    <StatusDot status={hydrated ? lessons[l.id]?.status : undefined} />
                    {l.id} {l.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function CourseNav({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  return (
    <nav aria-label="Содержание курса" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
        <CourseNavList course={course} currentSlug={currentSlug} />
      </div>
    </nav>
  )
}

export function MobileCourseNav({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  return (
    <details className="mb-8 rounded-xl border border-line bg-card p-4 lg:hidden">
      <summary className="cursor-pointer font-semibold">Содержание курса</summary>
      <div className="mt-4">
        <CourseNavList course={course} currentSlug={currentSlug} />
      </div>
    </details>
  )
}
```

`components/layout/ReviewBadge.tsx`:

```tsx
'use client'

import { isDue, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function ReviewBadge() {
  const hydrated = useHydrated()
  const due = useProgress((s) => Object.values(s.cards).filter((c) => isDue(c, todayISO())).length)
  if (!hydrated || due === 0) return null
  return (
    <span aria-label={`карточек к повторению: ${due}`} className="rounded-full bg-glow-orange px-1.5 text-[11px] font-semibold text-ink">
      {due}
    </span>
  )
}
```

`components/layout/TopBar.tsx`:

```tsx
import Link from 'next/link'
import { ReviewBadge } from './ReviewBadge'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-glow-cyan shadow-[0_0_10px_var(--color-glow-cyan)]"
          />
          Учебник ИИ
        </Link>
        <nav aria-label="Основное меню" className="flex items-center gap-5 text-sm">
          <Link href="/courses/attention" className="hover:underline">
            Курс
          </Link>
          <Link href="/review" className="flex items-center gap-1.5 hover:underline">
            Повторение <ReviewBadge />
          </Link>
          <Link href="/glossary" className="hover:underline">
            Глоссарий
          </Link>
        </nav>
      </div>
    </header>
  )
}
```

`components/layout/StorageBanner.tsx`:

```tsx
'use client'

import { useSyncExternalStore } from 'react'
import { isLocalStorageAvailable } from '@/lib/progress/storage'

let cached: boolean | undefined
const getSnapshot = () => (cached ??= isLocalStorageAvailable())
const subscribe = () => () => {}

export function StorageBanner() {
  const available = useSyncExternalStore(subscribe, getSnapshot, () => true)
  if (available) return null
  return (
    <div role="alert" className="bg-error-bg px-4 py-2 text-center text-sm text-error">
      Браузер не даёт сохранять данные (приватный режим?) — прогресс пропадёт после закрытия вкладки.
    </div>
  )
}
```

`components/course/ContinueButton.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { nextLessonToStudy } from '@/lib/course/registry'
import type { CourseMeta } from '@/lib/course/types'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function ContinueButton({ course }: { course: CourseMeta }) {
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)
  const lesson = nextLessonToStudy(course, hydrated ? lessons : {})
  if (!lesson) return null
  const started = hydrated && Object.keys(lessons).length > 0
  return (
    <Link href={`/courses/${course.id}/${lesson.slug}`} className="btn-primary px-5 py-3 text-base">
      {started ? `Продолжить: ${lesson.id} ${lesson.title}` : 'Начать с первого урока'} →
    </Link>
  )
}
```

`components/course/CourseCard.tsx`:

```tsx
import Link from 'next/link'
import { plural } from '@/lib/plural'
import { flatLessons } from '@/lib/course/registry'
import type { CourseMeta } from '@/lib/course/types'

export function CourseCard({ course }: { course: CourseMeta }) {
  const all = flatLessons(course)
  const ready = all.filter((l) => l.availability === 'ready').length
  const modules = course.modules.length
  return (
    <Link href={`/courses/${course.id}`} className="group block rounded-2xl border border-line bg-card p-6 transition hover:border-ink">
      <p className="gate-label">Курс 1</p>
      <h3 className="mt-2 font-serif text-2xl">{course.title}</h3>
      <p className="mt-2 text-ink-soft">{course.subtitle}</p>
      <p className="mt-4 text-sm text-muted">
        {modules} {plural(modules, ['модуль', 'модуля', 'модулей'])} · {all.length}{' '}
        {plural(all.length, ['урок', 'урока', 'уроков'])} · готово {ready}
      </p>
      <span className="mt-4 inline-block text-sm font-semibold group-hover:underline">Открыть программу →</span>
    </Link>
  )
}
```

- [ ] **Step 4: Карта курса (используется на странице курса и в уроке 0.2)**

`components/course/CourseMap.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getCourse } from '@/lib/course/registry'
import { LEVEL_LABEL } from '@/lib/course/types'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function CourseMap({ courseId = 'attention' }: { courseId?: string }) {
  const course = getCourse(courseId)
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)
  const [open, setOpen] = useState<string | null>(null)
  if (!course) return null

  return (
    <ol className="relative my-8 list-none space-y-3 p-0 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-line">
      {course.modules.map((m) => {
        const hasReady = m.lessons.some((l) => l.availability === 'ready')
        const done = hydrated ? m.lessons.filter((l) => lessons[l.id]?.status === 'completed').length : 0
        const expanded = open === m.id
        return (
          <li key={m.id} className="relative m-0 pl-14">
            <span
              aria-hidden
              className={`absolute top-3 left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 font-serif text-lg ${
                done === m.lessons.length ? 'border-success bg-success-bg' : hasReady ? 'border-ink bg-card' : 'border-line bg-paper'
              }`}
            >
              {m.number}
            </span>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : m.id)}
              className="w-full rounded-xl border border-line bg-card p-4 text-left transition hover:border-ink"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-lg">{m.title}</span>
                <span className="text-xs text-muted">
                  {LEVEL_LABEL[m.level]} · {done}/{m.lessons.length}
                </span>
              </span>
              <span className="mt-1 block text-sm text-ink-soft">{m.description}</span>
            </button>
            {expanded && (
              <ul className="mt-2 list-none space-y-1 p-0 pl-2">
                {m.lessons.map((l) => (
                  <li key={l.id} className="m-0 text-sm">
                    {l.availability === 'ready' ? (
                      <Link className="text-ink-cyan underline" href={`/courses/${course.id}/${l.slug}`}>
                        {l.id} {l.title}
                      </Link>
                    ) : (
                      <span className="text-muted">
                        {l.id} {l.title} · скоро
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
```

В `mdx-components.tsx` добавить `import { CourseMap } from '@/components/course/CourseMap'` и ключ `CourseMap`.

- [ ] **Step 5: 3D-облако слов для главной**

`content/home/word-cloud.ts`:

```ts
export type WordGroup = 'animals' | 'objects' | 'feelings' | 'actions'

export const GROUPS: Record<WordGroup, { label: string; color: string }> = {
  animals: { label: 'животные', color: '#22d3ee' },
  objects: { label: 'предметы', color: '#fb923c' },
  feelings: { label: 'чувства', color: '#a78bfa' },
  actions: { label: 'действия', color: '#a3e635' },
}

export const WORDS: { word: string; group: WordGroup; pos: [number, number, number] }[] = [
  { word: 'кот', group: 'animals', pos: [2.2, 1.0, 0.4] },
  { word: 'котёнок', group: 'animals', pos: [2.5, 1.3, -0.1] },
  { word: 'собака', group: 'animals', pos: [2.7, 0.6, 0.9] },
  { word: 'тигр', group: 'animals', pos: [1.9, 1.6, 1.0] },
  { word: 'лошадь', group: 'animals', pos: [3.0, 0.3, 0.2] },
  { word: 'забор', group: 'objects', pos: [-2.3, -0.5, 1.4] },
  { word: 'стол', group: 'objects', pos: [-2.7, -0.9, 0.8] },
  { word: 'стул', group: 'objects', pos: [-2.0, -1.2, 1.9] },
  { word: 'дверь', group: 'objects', pos: [-2.9, -0.2, 2.0] },
  { word: 'окно', group: 'objects', pos: [-2.4, 0.1, 2.4] },
  { word: 'радость', group: 'feelings', pos: [0.3, -1.9, -2.2] },
  { word: 'грусть', group: 'feelings', pos: [-0.4, -2.3, -2.6] },
  { word: 'страх', group: 'feelings', pos: [0.7, -2.6, -1.8] },
  { word: 'любовь', group: 'feelings', pos: [0.0, -1.5, -2.9] },
  { word: 'бежать', group: 'actions', pos: [-0.6, 2.4, -1.5] },
  { word: 'прыгать', group: 'actions', pos: [-1.1, 2.0, -1.0] },
  { word: 'перепрыгнуть', group: 'actions', pos: [-0.9, 2.7, -1.9] },
  { word: 'идти', group: 'actions', pos: [-0.2, 2.8, -1.1] },
]
```

`components/viz/words/WordCloudScene.tsx`:

```tsx
'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { GROUPS, WORDS, type WordGroup } from '@/content/home/word-cloud'

export function WordCloudScene({ rotate }: { rotate: boolean }) {
  const cloud = useRef<Group>(null)
  const [hovered, setHovered] = useState<WordGroup | null>(null)

  useFrame((_, delta) => {
    if (rotate && cloud.current) cloud.current.rotation.y += delta * 0.08
  })

  return (
    <group ref={cloud}>
      {WORDS.map(({ word, group, pos }) => {
        const dim = hovered !== null && hovered !== group
        const color = GROUPS[group].color
        return (
          <group key={word} position={pos}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(group)
              }}
              onPointerOut={() => setHovered(null)}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={dim ? 0.1 : 0.8}
                transparent
                opacity={dim ? 0.3 : 1}
              />
            </mesh>
            <Html center className="vector-label" style={{ color, opacity: dim ? 0.25 : 1, transform: 'translateY(-16px)' }}>
              {word}
            </Html>
          </group>
        )
      })}
    </group>
  )
}
```

`components/viz/words/WordCloud3D.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'
import { GROUPS } from '@/content/home/word-cloud'
import { Stage } from '@/components/viz/stage/Stage'

const LazyWordCloudScene = dynamic(() => import('./WordCloudScene').then((m) => m.WordCloudScene), { ssr: false })

const QUERY = '(prefers-reduced-motion: reduce)'
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function WordCloud3D() {
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
  const legend = (
    <div className="flex flex-wrap gap-4 font-mono text-xs">
      {Object.values(GROUPS).map((g) => (
        <span key={g.label} style={{ color: g.color }}>
          ● {g.label}
        </span>
      ))}
    </div>
  )
  return (
    <Stage
      height={420}
      frameloop="always"
      camera={[6, 3, 7]}
      caption="Каждое слово — точка в пространстве смыслов. Похожие слова живут рядом. Подробно — в модуле 2."
      fallback={<p className="m-0">Здесь вращается облако слов: животные, предметы, чувства и действия собираются в свои «районы».</p>}
      controls={legend}
    >
      <LazyWordCloudScene rotate={!reducedMotion} />
    </Stage>
  )
}
```

- [ ] **Step 6: Страницы**

`app/page.tsx` (полностью заменить):

```tsx
import Link from 'next/link'
import { ContinueButton } from '@/components/course/ContinueButton'
import { CourseCard } from '@/components/course/CourseCard'
import { WordCloud3D } from '@/components/viz/words/WordCloud3D'
import { getCourse } from '@/lib/course/registry'

export default function Home() {
  const course = getCourse('attention')!
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-20">
        <div className="self-center">
          <p className="gate-label">Интерактивный учебник</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.05] lg:text-6xl">
            Как машина научилась <em className="text-ink-cyan">обращать внимание</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            От «что такое стрелка» до статьи «Attention Is All You Need» — с 3D-сценами, задачами и кодом, который ты
            напишешь сам.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ContinueButton course={course} />
            <Link href="/courses/attention" className="btn-ghost px-5 py-3 text-base">
              Программа курса
            </Link>
          </div>
        </div>
        <WordCloud3D />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <h2 className="font-serif text-3xl">Курсы</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <CourseCard course={course} />
          <div className="rounded-2xl border border-dashed border-line p-6">
            <p className="gate-label">Скоро</p>
            <h3 className="mt-2 font-serif text-2xl text-muted">Как модели учатся</h3>
            <p className="mt-2 text-muted">Градиентный спуск, обратное распространение ошибки и обучение маленькой модели в браузере.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
```

`app/courses/[course]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContinueButton } from '@/components/course/ContinueButton'
import { CourseMap } from '@/components/course/CourseMap'
import { flatLessons, getCourse, listCourses, readyLessons } from '@/lib/course/registry'
import { plural } from '@/lib/plural'

type Params = { course: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return listCourses().map((c) => ({ course: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const course = getCourse((await params).course)
  return course ? { title: course.title, description: course.subtitle } : {}
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const course = getCourse((await params).course)
  if (!course) notFound()
  const total = flatLessons(course).length
  const ready = readyLessons(course).length
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12">
      <p className="gate-label">Курс 1</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">{course.title}</h1>
      <p className="mt-4 text-lg text-ink-soft">{course.subtitle}</p>
      <p className="mt-3 text-sm text-muted">
        {course.modules.length} {plural(course.modules.length, ['модуль', 'модуля', 'модулей'])} · {total}{' '}
        {plural(total, ['урок', 'урока', 'уроков'])} · готово {ready}
      </p>
      <div className="mt-6">
        <ContinueButton course={course} />
      </div>
      <CourseMap courseId={course.id} />
    </main>
  )
}
```

`app/glossary/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById, getCourse } from '@/lib/course/registry'

export const metadata: Metadata = { title: 'Глоссарий', description: 'Термины курса с короткими определениями.' }

export default function GlossaryPage() {
  const course = getCourse('attention')!
  const entries = Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term, 'ru'))
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12">
      <p className="gate-label">Справочник</p>
      <h1 className="mt-2 font-serif text-4xl">Глоссарий</h1>
      <dl className="mt-8 divide-y divide-line">
        {entries.map((entry) => {
          const lesson = findLessonById(course, entry.lessonId)
          return (
            <div key={entry.id} id={entry.id} className="py-4">
              <dt className="font-serif text-lg">{entry.term}</dt>
              <dd className="mt-1 text-ink-soft">
                {entry.short}
                {lesson && (
                  <span className="mt-1 block text-xs text-muted">
                    {lesson.availability === 'ready' ? (
                      <Link className="text-ink-cyan underline" href={`/courses/${course.id}/${lesson.slug}`}>
                        Урок {lesson.id}: {lesson.title}
                      </Link>
                    ) : (
                      `Урок ${lesson.id}: ${lesson.title} (скоро)`
                    )}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </main>
  )
}
```

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { listCourses, readyLessons } from '@/lib/course/registry'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/glossary', ...listCourses().flatMap((c) => [`/courses/${c.id}`, ...readyLessons(c).map((l) => `/courses/${c.id}/${l.slug}`)])]
  return pages.map((path) => ({ url: new URL(path, SITE.url).toString() }))
}
```

`app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: new URL('/sitemap.xml', SITE.url).toString() }
}
```

`app/not-found.tsx`:

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[680px] px-4 py-24 text-center">
      <p className="gate-label">404</p>
      <h1 className="mt-2 font-serif text-4xl">Такой страницы нет</h1>
      <p className="mt-3 text-ink-soft">Возможно, этот урок ещё в работе.</p>
      <Link href="/courses/attention" className="btn-primary mt-6">
        К программе курса
      </Link>
    </main>
  )
}
```

- [ ] **Step 7: Layout и навигация на странице урока**

`app/layout.tsx` — тело `RootLayout` (импорты `TopBar`, `StorageBanner` добавить):

```tsx
import { StorageBanner } from '@/components/layout/StorageBanner'
import { TopBar } from '@/components/layout/TopBar'
```

```tsx
    <html lang="ru" className={`${literata.variable} ${plex.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ProgressHydrator />
        <StorageBanner />
        <TopBar />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-8 text-center text-xs text-muted">
          Учебник ИИ · по статье Vaswani et al., «Attention Is All You Need» (NeurIPS 2017)
        </footer>
      </body>
    </html>
```

`app/courses/[course]/[lesson]/page.tsx` — добавить импорт и навигацию:

```tsx
import { CourseNav, MobileCourseNav } from '@/components/course/CourseNav'
```

Внутри корневого `<div className="mx-auto flex max-w-7xl gap-10 …">` первым дочерним элементом вставить `<CourseNav course={course} currentSlug={lesson.slug} />`, а первым элементом внутри `<article>` (до `<header>`) — `<MobileCourseNav course={course} currentSlug={lesson.slug} />`.

- [ ] **Step 8: Запустить тесты и сборку**

Run: `npm test && npm run typecheck && npm run build`
Expected: всё зелёное; в `out/` есть `index.html`, `courses/attention.html`, `glossary.html`, `sitemap.xml`, `robots.txt`, `404.html`.

Run: `npm run serve:out` (в фоне), открыть `http://localhost:3100/`.
Expected: на главной вращается облако слов, наведение на слово подсвечивает его группу; ссылки «Курс», «Повторение», «Глоссарий» работают; на странице урока слева видна навигация. Остановить сервер.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(site): top bar, course navigation, home with 3D word cloud, course map and glossary" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 17: Тесты целостности контента, игра «следующее слово», урок 0.1

**Files:**
- Create: `content/content.test.ts`, `components/lesson/gates/NextWordGame.tsx`, `components/lesson/gates/NextWordGame.test.tsx`
- Modify: `content/attention/lessons/0-1-riddle.mdx` (полная замена черновика), `mdx-components.tsx`

**Interfaces:**
- Consumes: реестр курса (Task 3), `remarkSteps` (Task 7), `GLOSSARY` (Task 11), `EXERCISES` (Task 15), `useGate` (Task 8).
- Produces: `<NextWordGame id rounds={WordRound[]} />` с `WordRound = { context: string; options: string[]; answers: number[]; note: string }` («ворота»: проходятся, когда сыграны все раунды); тест целостности, который проверяет каждый готовый урок.

- [ ] **Step 1: Написать тест целостности контента**

`content/content.test.ts`:

```ts
// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '@/content/attention/exercises'
import { GLOSSARY } from '@/content/glossary'
import { flatLessons, getCourse } from '@/lib/course/registry'
import remarkSteps from '@/lib/mdx/remark-steps.mjs'

const course = getCourse('attention')!
const lessonsDir = path.join(process.cwd(), 'content/attention/lessons')
const ready = flatLessons(course).filter((l) => l.availability === 'ready')
const firstLessonId = flatLessons(course)[0].id
const GATE_TAGS = ['Predict', 'Check', 'Recall', 'ExplainBack', 'Faded', 'VectorTask', 'NextWordGame', 'CodeExercise']

const sourceOf = (slug: string) => readFileSync(path.join(lessonsDir, `${slug}.mdx`), 'utf8')
const count = (src: string, tag: string) => (src.match(new RegExp(`<${tag}[\\s>/]`, 'g')) ?? []).length
const compile = (src: string) => evaluate(src, { ...runtime, remarkPlugins: [remarkGfm, remarkMath, remarkSteps] })

describe('course content integrity', () => {
  it('has an MDX file for every ready lesson and no orphan files', () => {
    const files = readdirSync(lessonsDir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''))
      .sort()
    expect(files).toEqual(ready.map((l) => l.slug).sort())
  })

  for (const lesson of ready) {
    describe(`${lesson.id} ${lesson.title}`, () => {
      const src = sourceOf(lesson.slug)

      it('exports metadata and review cards', async () => {
        const mod = await compile(src)
        expect(typeof mod.metadata?.description).toBe('string')
        expect(mod.metadata.objectives.length).toBeGreaterThan(0)
        expect(mod.cards.length).toBeGreaterThanOrEqual(2)
        for (const card of mod.cards) {
          expect(card.id).toMatch(/^c-/)
          if (card.kind === 'choice') {
            expect(card.options.length).toBeGreaterThan(1)
            expect(card.correct).toBeTypeOf('number')
          }
        }
      })

      it('contains the required building blocks', () => {
        if (lesson.kind === 'lesson') {
          expect(count(src, 'Predict')).toBeGreaterThanOrEqual(1)
          expect(count(src, 'Check')).toBeGreaterThanOrEqual(2)
        } else {
          expect(count(src, 'Check') + count(src, 'Faded') + count(src, 'CodeExercise')).toBeGreaterThanOrEqual(3)
        }
        expect(count(src, 'Summary')).toBe(1)
        expect(count(src, 'Recall')).toBe(lesson.id === firstLessonId ? 0 : 1)
      })

      it('imports nothing (components come from mdx-components.tsx)', () => {
        expect(src).not.toMatch(/^import\s/m)
      })

      it('references only existing glossary terms and exercises', () => {
        for (const [, id] of src.matchAll(/<Term id="([^"]+)"/g)) expect(GLOSSARY[id], `unknown term ${id}`).toBeDefined()
        for (const [, id] of src.matchAll(/<CodeExercise id="([^"]+)"/g)) expect(EXERCISES[id], `unknown exercise ${id}`).toBeDefined()
      })
    })
  }

  it('uses unique gate ids and card ids across the course', async () => {
    const gateIds: string[] = []
    const cardIds: string[] = []
    for (const lesson of ready) {
      const src = sourceOf(lesson.slug)
      for (const tag of GATE_TAGS) {
        for (const [, id] of src.matchAll(new RegExp(`<${tag}\\b[^>]*?\\bid="([^"]+)"`, 'g'))) gateIds.push(`${tag}:${id}`)
      }
      const mod = await compile(src)
      cardIds.push(...mod.cards.map((c: { id: string }) => c.id))
    }
    expect(new Set(gateIds).size).toBe(gateIds.length)
    expect(new Set(cardIds).size).toBe(cardIds.length)
  })
})
```

- [ ] **Step 2: Запустить тест и убедиться, что он падает**

Run: `npm test -- content/content`
Expected: FAIL — черновик урока 0.1 из Task 7 не содержит `Predict`, `Check`, `Summary`, а `cards` пуст.

- [ ] **Step 3: Тест и реализация `NextWordGame`**

`components/lesson/gates/NextWordGame.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { NextWordGame } from './NextWordGame'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('NextWordGame', () => {
  it('comments every guess and passes after the last round', async () => {
    render(
      <NextWordGame
        id="nw"
        rounds={[
          { context: 'Я пью горячий…', options: ['чай', 'снег'], answers: [0], note: 'Напиток.' },
          { context: 'Он открыл…', options: ['дверь', 'книгу'], answers: [0, 1], note: 'Подходит всё.' },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'снег' }))
    expect(screen.getByText(/чаще говорят «чай»/)).toBeInTheDocument()
    expect(useProgress.getState().gates.nw?.passed).toBeFalsy()
    await userEvent.click(screen.getByRole('button', { name: 'книгу' }))
    expect(screen.getByText(/✓ Подходит всё/)).toBeInTheDocument()
    expect(useProgress.getState().gates.nw.passed).toBe(true)
  })
})
```

`components/lesson/gates/NextWordGame.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'

export interface WordRound {
  context: string
  options: string[]
  /** Индексы вариантов, которые считаются хорошими продолжениями. */
  answers: number[]
  note: string
}

/** Мини-игра «угадай следующее слово»: показывает, как контекст сужает выбор. */
export function NextWordGame({ id, rounds }: { id: string; rounds: WordRound[] }) {
  const gate = useGate(id)
  const [picks, setPicks] = useState<(number | null)[]>(() => rounds.map(() => null))

  function pick(round: number, option: number) {
    if (picks[round] !== null) return
    const next = picks.map((p, i) => (i === round ? option : p))
    setPicks(next)
    if (next.every((p) => p !== null)) gate.pass()
  }

  return (
    <div className="gate-card" data-gate="next-word" data-passed={gate.passed}>
      <p className="gate-label m-0">Игра · угадай следующее слово</p>
      <ol className="mt-3 list-none space-y-5 p-0">
        {rounds.map((round, r) => {
          const picked = picks[r]
          const good = picked !== null && round.answers.includes(picked)
          return (
            <li key={round.context} className="m-0">
              <p className="m-0 font-serif text-lg">
                {round.context} <span className="text-muted">▁▁▁</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Варианты для «${round.context}»`}>
                {round.options.map((option, i) => (
                  <button
                    key={option}
                    type="button"
                    className="option-btn w-auto"
                    disabled={picked !== null}
                    data-selected={picked === i}
                    data-right={picked !== null && round.answers.includes(i)}
                    onClick={() => pick(r, i)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {picked !== null && (
                <p className={`mt-2 mb-0 text-sm ${good ? 'text-success' : 'text-ink-soft'}`}>
                  {good ? '✓ ' : `Можно и так, но чаще говорят «${round.options[round.answers[0]]}». `}
                  {round.note}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

В `mdx-components.tsx` добавить `import { NextWordGame } from '@/components/lesson/gates/NextWordGame'` и ключ `NextWordGame`.

- [ ] **Step 4: Урок 0.1 «Загадка «он»»** (полностью заменить `content/attention/lessons/0-1-riddle.mdx`)

````mdx
export const metadata = {
  description: 'Одна загадка, которую человек решает за долю секунды, а машине для неё нужен особый механизм — внимание.',
  objectives: [
    'Увидеть, почему понять «он» трудно для машины',
    'Узнать, что делает языковая модель на каждом шаге',
    'Впервые посмотреть на внимание в работе',
  ],
}

export const cards = [
  {
    id: 'c-0-1-next-word',
    kind: 'flip',
    prompt: 'Что делает языковая модель вроде ChatGPT на каждом шаге?',
    answer: 'Угадывает следующее слово (точнее, токен), глядя на все предыдущие.',
  },
  {
    id: 'c-0-1-grammar',
    kind: 'choice',
    prompt: 'Почему во фразе про кота и забор «он» нельзя распознать по грамматике?',
    options: ['«Кот» и «забор» — оба мужского рода', 'В фразе нет глагола', '«Он» всегда означает человека'],
    correct: 0,
    answer: 'Оба слова мужского рода, поэтому решает только смысл.',
  },
  {
    id: 'c-0-1-attention',
    kind: 'flip',
    prompt: 'Что такое внимание (attention) — одним предложением?',
    answer: 'Механизм, который для каждого слова решает, на какие другие слова смотреть и насколько сильно.',
  },
]

<Hook title="Загадка">

Прочитай фразу и ответь, не задумываясь:

> Кот не перепрыгнул через забор, потому что **он** был слишком **высоким**.

</Hook>

<Predict id="0-1-predict-tall" question="Кто здесь «он»?" options={['кот', 'забор']} answer={1}>

Конечно, забор: высоким бывает забор, который кот не смог перепрыгнуть. Ты ответил быстрее, чем дочитал вопрос.

</Predict>

---

## Меняем одно слово

> Кот не перепрыгнул через забор, потому что **он** был слишком **уставшим**.

<Predict id="0-1-predict-tired" question="А теперь кто «он»?" options={['кот', 'забор']} answer={0}>

Теперь кот: заборы не устают. Изменилось **одно последнее слово** — и «он» указывает уже на другой предмет.

</Predict>

Заметь, что сейчас сделал твой мозг. Чтобы понять одно маленькое «он», ты:

1. нашёл в фразе кандидатов — «кот» и «забор»;
2. посмотрел на слово в самом конце — «высоким» или «уставшим»;
3. вспомнил, что знаешь о мире: заборы бывают высокими, а коты устают;
4. связал «он» с подходящим кандидатом.

И всё это — за долю секунды и совершенно незаметно.

---

## Почему машине трудно

Для компьютера фраза — просто цепочка значков. Грамматика тут не поможет: «кот» и «забор» оба мужского рода, так что «он» подходит к обоим. По-английски то же самое: *The cat didn't jump over the fence because **it** was too tall* — «it» может быть и котом, и забором.

Решает **смысл другого слова**, и стоит оно далеко от «он». Значит, машине нужен способ для каждого слова **посмотреть на остальные слова** и решить, какие из них важны прямо сейчас. Этот способ называется <Term id="attention">вниманием</Term> (attention). Ему посвящён весь курс.

<Check
  id="0-1-check-grammar"
  question="Почему грамматика не помогает понять, кто такой «он»?"
  options={['«Кот» и «забор» — оба мужского рода', 'В фразе нет глагола', 'Местоимение стоит в конце фразы']}
  answer={0}
  feedback={['', 'Глаголы есть: «перепрыгнул», «был». Дело не в них.', 'Позиция ни при чём: важно, с каким словом «он» согласуется.']}
  explain="Оба кандидата мужского рода, поэтому форма слова ничего не подсказывает. Подсказывает только смысл."
/>

---

## Посмотри, как это делает модель

Ниже — маленькая модель, которую мы **соберём сами** к уроку 3.4. Дуги показывают, куда «смотрит» слово **он**: чем толще дуга, тем сильнее внимание. Переключи конец фразы.

<AttentionArcs caption="Переключай «высоким / уставшим» и следи за самой толстой дугой." />

<Sidenote>Это игрушечная модель: каждое слово в ней — всего 3 числа. В статье 2017 года — 512 чисел на слово, в современных моделях — тысячи. Принцип тот же.</Sidenote>

<Check
  id="0-1-check-arcs"
  question="Что происходит с дугами, когда «высоким» меняется на «уставшим»?"
  options={['Самая толстая дуга переезжает от «забора» к «коту»', 'Ничего: дуги зависят только от порядка слов', 'Все дуги становятся одинаковыми']}
  answer={0}
  explain="Модель смотрит на смысл слов, а не только на их порядок. Поэтому одно слово в конце меняет всю картину внимания."
/>

---

## Игра: угадай следующее слово

ChatGPT, Claude и другие <Term id="language-model">языковые модели</Term> на каждом шаге делают одно и то же: **угадывают следующее слово**. Попробуй сам.

<NextWordGame
  id="0-1-next-word"
  rounds={[
    { context: 'Я пью горячий…', options: ['чай', 'снег', 'забор'], answers: [0], note: '«Пью» и «горячий» почти однозначно ведут к напитку.' },
    { context: 'Он открыл…', options: ['дверь', 'книгу', 'глаза', 'окно'], answers: [0, 1, 2, 3], note: 'Подходит всё! Когда контекста мало, вариантов много.' },
    { context: 'В комнате было душно, и он открыл…', options: ['книгу', 'глаза', 'окно', 'дверь'], answers: [2, 3], note: 'Всё решило слово «душно», хотя оно стоит в самом начале. Нужно было понять, на что обратить внимание.' },
  ]}
/>

Чтобы угадывать хорошо, мало помнить слова — нужно понимать, **на какие из них смотреть**. Вот почему внимание стало сердцем современных моделей.

---

<ExplainBack
  id="0-1-explain"
  prompt="Объясни другу лет десяти: почему компьютеру трудно понять, кто такой «он» во фразе про кота и забор?"
  reference="Компьютер видит фразу как цепочку значков. По грамматике «он» не определить: «кот» и «забор» оба мужского рода. Всё решает смысл слова в конце: «высоким» — значит забор, «уставшим» — значит кот. Чтобы это учесть, нужно связать «он» с далёкими словами. Нужен механизм, который для каждого слова решает, на какие другие слова смотреть, — это и есть внимание."
  points={['грамматика не помогает: оба слова мужского рода', 'решает смысл слова в конце фразы', 'нужно «смотреть» на другие слова, даже далёкие, — это внимание']}
/>

---

## Итог

<Summary
  points={[
    'Понять «он» можно только по смыслу других слов — грамматика не помогает.',
    'Языковая модель на каждом шаге угадывает следующее слово.',
    'Внимание — способ для каждого слова решить, на какие другие слова смотреть.',
  ]}
  cards={cards}
/>
````

- [ ] **Step 5: Запустить тесты и сборку**

Run: `npm test && npm run build`
Expected: PASS (включая `content/content.test.ts` для урока 0.1); сборка успешна.

Run: `npm run serve:out` (в фоне), пройти `http://localhost:3100/courses/attention/0-1-riddle` от начала до «Завершить урок ✓».
Expected: каждый шаг открывается после ответа; дуги переключаются; после завершения на `/review` видно «Следующее повторение — …». Остановить сервер.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(content): lesson 0.1 «Загадка «он»», next-word game and content integrity tests" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Урок 0.2 «Карта путешествия»

**Files:**
- Create: `content/attention/lessons/0-2-journey-map.mdx`
- Modify: `content/attention/course.ts`

**Interfaces:**
- Consumes: все MDX-компоненты из Tasks 9–17; `CourseMap` (Task 16).

- [ ] **Step 1: Пометить урок готовым — тест должен упасть**

В `content/attention/course.ts` заменить `lesson('0.2', '0-2-journey-map', 'Карта путешествия', 8)` на:

```ts
        { ...lesson('0.2', '0-2-journey-map', 'Карта путешествия', 8), availability: 'ready' },
```

Run: `npm test -- content/content`
Expected: FAIL — нет файла `0-2-journey-map.mdx`.

- [ ] **Step 2: Написать урок** (`content/attention/lessons/0-2-journey-map.mdx`)

````mdx
export const metadata = {
  description: 'Девять остановок от «что такое стрелка» до статьи и ChatGPT — и как учиться по этому учебнику, чтобы запомнить надолго.',
  objectives: [
    'Увидеть весь путь курса целиком',
    'Понять, почему путь начинается с математики',
    'Узнать, как учиться эффективно: вспоминать, повторять, предсказывать',
  ],
}

export const cards = [
  {
    id: 'c-0-2-retrieval',
    kind: 'flip',
    prompt: 'Почему вспоминать по памяти полезнее, чем перечитывать?',
    answer: 'Каждое извлечение из памяти укрепляет её (эффект тестирования), а перечитывание создаёт иллюзию, что всё знаешь.',
  },
  {
    id: 'c-0-2-spacing',
    kind: 'choice',
    prompt: 'Как повторять материал, чтобы помнить долго?',
    options: ['Каждый день одно и то же', 'Через растущие интервалы: 1, 3, 7, 16 дней…', 'Один раз — прямо перед экзаменом'],
    correct: 1,
    answer: 'Через растущие интервалы: это интервальное повторение.',
  },
  {
    id: 'c-0-2-start',
    kind: 'flip',
    prompt: 'С чего начинается путь к пониманию внимания и почему?',
    answer: 'С математики: модель видит слова как векторы (стрелки), а внимание — это несколько простых операций над ними.',
  },
]

<Recall id="0-2-recall" />

---

<Hook title="Куда мы идём">

В прошлом уроке ты видел дуги внимания. К концу курса ты сможешь объяснить **каждое число** в них, посчитать его вручную и написать код, который их строит.

</Hook>

<Predict id="0-2-predict-start" question="С чего, по-твоему, стоит начать путь к пониманию внимания?" options={['Сразу с формулы из статьи', 'С математики: стрелки и числа', 'С истории нейросетей']} answer={1}>

С математики. Модель видит каждое слово как **стрелку в пространстве** — вектор, а внимание — это несколько простых операций над такими стрелками. Когда они станут привычными, формула из статьи прочитается как обычное предложение.

</Predict>

---

## Карта путешествия

Нажми на любую остановку, чтобы увидеть её уроки.

<CourseMap />

К концу курса ты сможешь:

- объяснить загадку «он» на трёх уровнях: история, геометрия, алгебра;
- вручную посчитать внимание для трёх слов;
- написать на TypeScript функции `dot`, `softmax`, `attention` и собрать мини-<Term id="transformer">трансформер</Term>;
- прочитать статью «Attention Is All You Need» и понять в ней каждую формулу.

---

## Как учиться по этому учебнику

Учебник устроен по результатам исследований памяти. Четыре правила:

1. **Вспоминай, а не перечитывай.** Попытка достать ответ из памяти укрепляет её сильнее, чем повторное чтение. Это <Term id="retrieval-practice">эффект тестирования</Term>. Поэтому вопросы здесь встречаются через каждые пару шагов.
2. **Повторяй с растущими интервалами.** Карточки из итогов уроков вернутся к тебе через 1, 3, 7, 16 и 35 дней. Это <Term id="spaced-repetition">интервальное повторение</Term>: каждый раз, когда ты почти забыл и всё-таки вспомнил, память становится прочнее.
3. **Сначала предскажи.** Перед каждым опытом тебя спросят: «Как думаешь, что будет?» Ошибиться нормально и даже полезно: удивление делает объяснение запоминающимся.
4. **Объясняй своими словами.** Сможешь объяснить другу — значит, понял.

<Sidenote>Если интересно глубже: Dunlosky и коллеги (2013) сравнили десять популярных способов учиться. Высшую оценку получили только два: самопроверка и распределённое повторение.</Sidenote>

<Check
  id="0-2-check-retrieval"
  question="Что лучше закрепит материал?"
  options={['Перечитать урок два раза', 'Прочитать один раз, а потом ответить на вопросы по памяти', 'Без разницы — важно только потраченное время']}
  answer={1}
  explain="В эксперименте Рёдигера и Карпике (2006) студенты, которые вспоминали текст по памяти, через неделю помнили заметно больше тех, кто его перечитывал."
/>

<Check
  id="0-2-check-predict"
  question="Ты ошибся в «Предскажи». Что это значит?"
  options={['Плохой знак: я не понимаю тему', 'Нормально: ошибка в прогнозе помогает запомнить правильный ответ', 'Надо было заранее подсмотреть ответ']}
  answer={1}
  explain="Прогноз заставляет мозг заранее приготовить «место» для ответа. Даже неверный прогноз делает объяснение заметнее."
/>

---

<ExplainBack
  id="0-2-explain"
  prompt="Опиши своими словами, как ты будешь заниматься по этому учебнику и почему именно так."
  reference="Буду проходить уроки по шагам и отвечать на вопросы по памяти, не подглядывая: вспоминание укрепляет память сильнее перечитывания. Перед опытами буду делать прогноз — даже ошибка поможет запомнить. Буду возвращаться к карточкам повторения через растущие интервалы и объяснять идеи своими словами, чтобы проверить, что действительно понял."
  points={['вспоминать по памяти, а не перечитывать', 'повторять карточки через растущие интервалы', 'делать прогноз до опыта', 'объяснять своими словами']}
/>

---

## Итог

<Summary
  points={[
    'Путь из 9 модулей: от стрелок к статье и к GPT.',
    'Начинаем с математики: для модели слова — это векторы.',
    'Учимся с умом: вспоминаем, повторяем с интервалами, предсказываем, объясняем.',
  ]}
  cards={cards}
/>
````

- [ ] **Step 3: Запустить тесты и сборку**

Run: `npm test -- content/content && npm run build`
Expected: PASS; есть `out/courses/attention/0-2-journey-map.html`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(content): lesson 0.2 «Карта путешествия»" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Уроки 1.1 «Вектор», 1.2 «Сложение и масштаб», 1.3 «Скалярное произведение»

**Files:**
- Create: `content/attention/lessons/1-1-vector.mdx`, `content/attention/lessons/1-2-vector-ops.mdx`, `content/attention/lessons/1-3-dot-product.mdx`
- Modify: `content/attention/course.ts`

**Interfaces:**
- Consumes: `VectorSpace3D`, `VectorTask`, `VectorOps3D`, `DotProduct3D` (Task 14), `CodeExercise` + упражнение `dot` (Task 15), остальные блоки (Tasks 9–11).

- [ ] **Step 1: Пометить уроки готовыми — тест должен упасть**

В `content/attention/course.ts` в модуле 1 заменить первые три строки уроков:

```ts
        { ...lesson('1.1', '1-1-vector', 'Вектор: стрелка и список чисел', 12), availability: 'ready' },
        { ...lesson('1.2', '1-2-vector-ops', 'Сложение и масштаб', 12), availability: 'ready' },
        { ...lesson('1.3', '1-3-dot-product', 'Скалярное произведение', 15), availability: 'ready' },
```

Run: `npm test -- content/content`
Expected: FAIL — нет трёх MDX-файлов.

- [ ] **Step 2: Урок 1.1** (`content/attention/lessons/1-1-vector.mdx`)

````mdx
export const metadata = {
  description: 'Вектор — это одновременно стрелка и список чисел. Разбираемся, как одно превращается в другое, и учимся измерять длину стрелки.',
  objectives: [
    'Видеть в списке чисел стрелку, а в стрелке — список чисел',
    'Понимать, что такое координаты и размерность',
    'Считать длину вектора',
  ],
}

export const cards = [
  {
    id: 'c-1-1-vector',
    kind: 'flip',
    prompt: 'Что такое вектор — двумя способами?',
    answer: 'Стрелка из начала координат и список чисел (координат), которые говорят, куда она указывает.',
  },
  {
    id: 'c-1-1-dimension',
    kind: 'choice',
    prompt: 'Какая размерность у вектора [1, 0, −2, 5]?',
    options: ['2', '4', '5'],
    correct: 1,
    answer: 'Четыре числа — размерность 4.',
  },
  {
    id: 'c-1-1-length',
    kind: 'flip',
    prompt: 'Как найти длину вектора [x, y, z]?',
    answer: '√(x² + y² + z²) — теорема Пифагора в трёх измерениях.',
  },
]

<Recall id="1-1-recall" />

---

<Hook title="Как модель видит слово">

Для нас «кот» — это буквы и образ пушистого зверя. Для модели «кот» — это **стрелка в пространстве**, и слова с похожим смыслом смотрят в похожие стороны. Сегодня разберёмся, что такое эта стрелка.

</Hook>

## Вектор: три способа увидеть одно и то же

<Levels>
<Level title="История">

Представь карту сокровищ: «от старого дуба пройди **2 шага на восток**, **1 шаг вверх** по склону и **2 шага на север**». Это инструкция, куда идти. Математики называют такую инструкцию <Term id="vector">вектором</Term>.

</Level>
<Level title="Геометрия">

Вектор — это **стрелка**. Она начинается в начале координат (в точке 0) и указывает в какую-то точку пространства. У стрелки есть направление и длина.

</Level>
<Level title="Алгебра">

Вектор — это **список чисел**, например $v = [2, 1, 2]$. Каждое число — <Term id="coordinate">координата</Term>: насколько сдвинуться вдоль своей оси (X, Y или Z). Сколько чисел — такая и <Term id="dimension">размерность</Term> вектора.

</Level>
</Levels>

Переключай вкладки: это одна и та же идея, рассказанная тремя способами. Дальше мы будем свободно переходить от стрелок к числам и обратно.

---

## Потрогай вектор

Потяни за светящийся кончик стрелки и следи за числами. Можно и наоборот: меняй числа в полях — стрелка послушно сдвинется. Чтобы повернуть сцену, тяни за фон.

<VectorSpace3D initial={[2, 1, 2]} caption="Ось X — вправо, Y — вверх, Z — к тебе. Нажми на стрелку, чтобы узнать о ней больше." />

<Predict id="1-1-predict-left" question="Если повернуть стрелку так, чтобы она смотрела влево, что станет с первым числом (x)?" options={['Станет отрицательным', 'Станет больше', 'Не изменится']} answer={0}>

Первое число отвечает за движение **вправо или влево** вдоль оси X: вправо — плюс, влево — минус. Проверь сам: утащи стрелку влево и посмотри на x.

</Predict>

---

## Координаты и размерность

<Check
  id="1-1-check-axis"
  question="Вектор [0, 0, 5] — куда смотрит стрелка?"
  options={['Вдоль оси X', 'Вдоль оси Y', 'Вдоль оси Z']}
  answer={2}
  explain="Не равна нулю только третья координата, значит, стрелка идёт строго вдоль оси Z."
/>

<Check
  id="1-1-check-dimension"
  question="Какая размерность у вектора [0.2, −1, 4, 7, 0]?"
  answer={5}
  tolerance={0}
  explain="Пять чисел — пять измерений. Нарисовать такое нельзя, но считать с ним можно точно так же."
/>

<Sidenote>В статье «Attention Is All You Need» каждое слово — вектор размерности 512. В современных моделях — тысячи чисел. Мы начинаем с трёх, потому что их можно увидеть.</Sidenote>

---

## Задание: попади в точку

Перетащи кончик стрелки или введи числа в поля.

<VectorTask id="1-1-task-target" target={[2, 1, 3]} start={[1, 1, 1]} />

---

## Длина стрелки

Как далеко уходит стрелка $[3, 4, 0]$? Поможет теорема Пифагора, только в трёх измерениях. <Term id="vector-length">Длина вектора</Term>:

$$
|v| = \sqrt{x^2 + y^2 + z^2}
$$

<WorkedExample title="Длина вектора [3, 4, 0]">

Возводим каждую координату в квадрат: $3^2 = 9$, $4^2 = 16$, $0^2 = 0$.

Складываем: $9 + 16 + 0 = 25$.

Извлекаем корень: $\sqrt{25} = 5$. Длина стрелки — **5**.

</WorkedExample>

Теперь ты: часть шагов уже сделана, заполни пропуски.

<Faded
  id="1-1-faded-length"
  title="Длина вектора [2, 3, 6]"
  steps={[
    { text: 'Квадраты координат: 2² = 4, 3² = ▢, 6² = 36', answer: 9 },
    { text: 'Сумма: 4 + 9 + 36 = ▢', answer: 49 },
    { text: 'Корень: √49 = ▢', answer: 7 },
  ]}
/>

---

<ExplainBack
  id="1-1-explain"
  prompt="Объясни своими словами, как одна и та же вещь может быть и стрелкой, и списком чисел."
  reference="Список чисел — это инструкция, куда идти: первое число — сколько шагов по оси X, второе — по Y, третье — по Z. Если пройти эти шаги из начала координат, окажешься в точке, и стрелка от нуля до неё и есть вектор. Поэтому список задаёт стрелку, а стрелку можно записать списком её координат."
  points={['числа — это координаты: шаги вдоль осей', 'стрелка идёт из начала координат в точку с этими координатами', 'количество чисел — размерность']}
/>

---

## Итог

<Summary
  points={[
    'Вектор — это стрелка из начала координат и список чисел-координат.',
    'Количество чисел — размерность. У слов в статье 2017 года она равна 512.',
    'Длина вектора — √(x² + y² + z²), теорема Пифагора в 3D.',
  ]}
  cards={cards}
/>
````

- [ ] **Step 3: Урок 1.2** (`content/attention/lessons/1-2-vector-ops.mdx`)

````mdx
export const metadata = {
  description: 'Векторы можно складывать и растягивать. Эти две операции — кирпичики, из которых внимание собирает смысл слова.',
  objectives: [
    'Складывать векторы стрелками и числами',
    'Понимать, что делает умножение вектора на число',
    'Считать взвешенную сумму векторов',
  ],
}

export const cards = [
  {
    id: 'c-1-2-addition',
    kind: 'flip',
    prompt: 'Как сложить два вектора — стрелками и в числах?',
    answer: 'Стрелками: приставить хвост второй к голове первой. В числах: сложить координаты попарно.',
  },
  {
    id: 'c-1-2-half',
    kind: 'choice',
    prompt: 'Что делает умножение вектора на 0.5?',
    options: ['Укорачивает вдвое, направление то же', 'Разворачивает в обратную сторону', 'Поворачивает на 90°'],
    correct: 0,
    answer: 'Укорачивает вдвое, не меняя направления.',
  },
  {
    id: 'c-1-2-weighted',
    kind: 'flip',
    prompt: 'Что такое взвешенная сумма векторов и где она встретится?',
    answer: 'w₁·v₁ + w₂·v₂ + … — «смесь» векторов. Так внимание собирает итоговый вектор слова.',
  },
]

<Recall id="1-2-recall" />

---

<Hook title="Арифметика смыслов">

Позже ты увидишь удивительную вещь: если взять вектор слова «король», вычесть «мужчину» и прибавить «женщину», получится вектор, очень близкий к «королеве». Чтобы так считать, нужны всего две операции — сложение и умножение на число.

</Hook>

## Сложение векторов

<Levels>
<Level title="История">

Сначала идёшь по первому маршруту, потом — по второму. Где окажешься? Там, куда ведёт **сумма** маршрутов.

</Level>
<Level title="Геометрия">

Приставь хвост стрелки **b** к голове стрелки **a**. Стрелка из начала координат в получившийся конец — это <Term id="vector-addition">сумма</Term> **a + b**.

</Level>
<Level title="Алгебра">

Складываем координаты попарно: $[2, 0, 1] + [0, 2, 1] = [2 + 0,\ 0 + 2,\ 1 + 1] = [2, 2, 2]$.

</Level>
</Levels>

---

## Потрогай сумму

Тяни за кончики <C k="a">a</C> и <C k="b">b</C>. Оранжевая копия b приставлена к голове a, а <C k="result">зелёная стрелка</C> — сумма.

<VectorOps3D mode="add" a={[2, 0, 1]} b={[0, 2, 1]} caption="Сумма — это «сначала a, потом b»." />

<Predict id="1-2-predict-opposite" question="Пусть b — та же стрелка, что a, только развёрнутая в обратную сторону. Куда приведёт a + b?" options={['В начало координат', 'В точку вдвое дальше, чем a', 'Никуда: так складывать нельзя']} answer={0}>

Пройти вперёд, а потом столько же назад — значит вернуться туда, откуда начал. В числах: $[2, 0, 1] + [-2, 0, -1] = [0, 0, 0]$. Попробуй выставить такое b в сцене.

</Predict>

---

## Умножение на число

<Term id="scalar-multiplication">Умножение вектора на число</Term> k растягивает стрелку в k раз. В числах каждая координата умножается на k: $2 \cdot [1, 0, 2] = [2, 0, 4]$.

<VectorOps3D mode="scale" a={[1, 1, 1]} caption="Двигай ползунок k: больше 1 — растягиваем, от 0 до 1 — сжимаем, меньше 0 — разворачиваем." />

<Check
  id="1-2-check-negative"
  question="Что сделает с вектором умножение на −1?"
  options={['Развернёт в обратную сторону', 'Сделает длиннее', 'Превратит в ноль']}
  answer={0}
  explain="Каждая координата меняет знак, длина остаётся прежней — стрелка смотрит ровно в противоположную сторону."
/>

---

## Считаем вместе

<WorkedExample title="Вычислим 2·[1, −1, 3] + [0, 4, −2]">

Сначала умножаем: $2 \cdot [1, -1, 3] = [2, -2, 6]$.

Потом складываем попарно: $[2, -2, 6] + [0, 4, -2] = [2 + 0,\ -2 + 4,\ 6 - 2]$.

Ответ: $[2, 2, 4]$.

</WorkedExample>

<Faded
  id="1-2-faded-ops"
  title="Вычисли 3·[1, 2, 0] − [2, 1, 1]"
  steps={[
    { text: '3·[1, 2, 0] = [3, 6, ▢]', answer: 0 },
    { text: '[3, 6, 0] − [2, 1, 1] = [▢, 5, −1]', answer: 1 },
    { text: 'Ответ: [1, ▢, −1]', answer: 5 },
  ]}
/>

<Check
  id="1-2-check-compute"
  question="Чему равна первая координата вектора 0.5·[4, 2, 8] + [1, 1, 1]?"
  answer={3}
  explain="0.5·4 = 2, и 2 + 1 = 3."
/>

---

## Смешивание векторов

Самое важное в этом уроке. <Term id="weighted-sum">Взвешенная сумма</Term> — это «смесь» векторов, где у каждого свой вес:

$$
0.7 \cdot a + 0.3 \cdot b
$$

Чем больше вес, тем сильнее итог похож на этот вектор. Например, для $a = [1, 0, 0]$ и $b = [0, 1, 0]$ получится $[0.7, 0.3, 0]$ — точка ближе к a.

<Sidenote>Запомни эту идею. В модуле 3 внимание будет делать ровно это: смешивать векторы слов с весами, которые оно само рассчитает.</Sidenote>

<Check
  id="1-2-check-weighted"
  question="Внимание в конце смешивает векторы слов с весами. Какая операция это делает?"
  options={['Взвешенная сумма: w₁·v₁ + w₂·v₂ + …', 'Перемножение всех векторов', 'Выбор самого длинного вектора']}
  answer={0}
  explain="Каждый вектор умножается на свой вес, а результаты складываются. Те самые две операции из этого урока."
/>

---

<ExplainBack
  id="1-2-explain"
  prompt="Объясни, что такое взвешенная сумма векторов и почему 0.7·a + 0.3·b оказывается ближе к a."
  reference="Взвешенная сумма — это когда каждый вектор умножается на свой вес, а потом всё складывается. Вес говорит, насколько сильно вектор участвует в смеси. У a вес 0.7, у b — 0.3, поэтому в результате «больше a»: точка лежит между a и b, но ближе к a."
  points={['каждый вектор умножается на свой вес', 'результаты складываются', 'чем больше вес, тем ближе итог к этому вектору']}
/>

---

## Итог

<Summary
  points={[
    'Сложение: хвост к голове, в числах — попарная сумма координат.',
    'Умножение на число растягивает, сжимает или разворачивает стрелку.',
    'Взвешенная сумма смешивает векторы — так работает выход внимания.',
  ]}
  cards={cards}
/>
````

- [ ] **Step 4: Урок 1.3** (`content/attention/lessons/1-3-dot-product.mdx`)

````mdx
export const metadata = {
  description: 'Самая важная операция курса: одно число, которое говорит, насколько две стрелки смотрят в одну сторону.',
  objectives: [
    'Считать скалярное произведение вручную и в коде',
    'Понимать его геометрический смысл: угол между стрелками',
    'Отличать скалярное произведение от косинусной похожести',
  ],
}

export const cards = [
  {
    id: 'c-1-3-formula',
    kind: 'flip',
    prompt: 'Как посчитать a·b для [a₁, a₂, a₃] и [b₁, b₂, b₃]?',
    answer: 'a₁b₁ + a₂b₂ + a₃b₃ — перемножить попарно и сложить.',
  },
  {
    id: 'c-1-3-perpendicular',
    kind: 'choice',
    prompt: 'Чему равно скалярное произведение перпендикулярных векторов?',
    options: ['0', '1', '−1'],
    correct: 0,
    answer: 'Нулю: такие стрелки не помогают и не мешают друг другу.',
  },
  {
    id: 'c-1-3-cosine',
    kind: 'flip',
    prompt: 'Чем косинусная похожесть отличается от скалярного произведения?',
    answer: 'Делит a·b на длины векторов, поэтому зависит только от направления и лежит от −1 до 1.',
  },
]

<Recall id="1-3-recall" />

---

<Hook title="Как измерить похожесть">

Как модель понимает, что «он» по смыслу ближе к «забору», чем к «коту»? Ей нужно **одно число**, которое говорит, насколько две стрелки смотрят в одну сторону. Это число — <Term id="dot-product">скалярное произведение</Term>. Без преувеличения, самая важная операция курса.

</Hook>

<Levels>
<Level title="История">

Двое тянут санки за верёвки. Тянут в одну сторону — помогают друг другу (большое положительное число). Под прямым углом — ни помогают, ни мешают (ноль). В разные стороны — мешают (отрицательное число).

</Level>
<Level title="Геометрия">

Скалярное произведение зависит от длин стрелок и угла θ между ними:

$$
a \cdot b = |a| \cdot |b| \cdot \cos\theta
$$

Угол 0° — косинус равен 1, произведение максимально. Угол 90° — косинус равен 0. Угол больше 90° — косинус отрицательный.

</Level>
<Level title="Алгебра">

Перемножаем координаты попарно и складываем:

$$
a \cdot b = a_1 b_1 + a_2 b_2 + a_3 b_3
$$

</Level>
</Levels>

---

## Потрогай скалярное произведение

Тяни за кончики <C k="a">a</C> и <C k="b">b</C>. Внизу — вычисление по шагам, угол и подсказка, куда смотрят стрелки. Дуга между стрелками показывает угол.

<DotProduct3D a={[2, 1, 0]} b={[1, 2, 0]} caption="Попробуй сделать a·b равным нулю, а потом — отрицательным." />

<Predict id="1-3-predict-right-angle" question="Поверни стрелки так, чтобы между ними был прямой угол. Каким станет a·b?" options={['Нулём', 'Максимальным', 'Отрицательным']} answer={0}>

Нулём! Например, $[1, 0, 0] \cdot [0, 1, 0] = 1 \cdot 0 + 0 \cdot 1 + 0 \cdot 0 = 0$. Перпендикулярные стрелки «не помогают и не мешают» друг другу. Проверь в сцене: поставь a = [2, 0, 0] и b = [0, 3, 0].

</Predict>

---

## Считаем вручную

<WorkedExample title="Вычислим [1, 2, 3] · [4, 5, 6]">

Перемножаем попарно: $1 \cdot 4 = 4$, $2 \cdot 5 = 10$, $3 \cdot 6 = 18$.

Складываем: $4 + 10 + 18 = 32$.

Ответ: $[1, 2, 3] \cdot [4, 5, 6] = 32$. Число большое и положительное — стрелки смотрят примерно в одну сторону.

</WorkedExample>

<Faded
  id="1-3-faded-dot"
  title="Вычисли [2, −1, 0] · [3, 4, 5]"
  steps={[
    { text: '2·3 = ▢', answer: 6 },
    { text: '(−1)·4 = ▢', answer: -4 },
    { text: '0·5 = ▢', answer: 0 },
    { text: 'Сумма: 6 + (−4) + 0 = ▢', answer: 2 },
  ]}
/>

<Check
  id="1-3-check-unit"
  question="Чему равно [1, 0, 0] · [0, 1, 0]?"
  answer={0}
  explain="1·0 + 0·1 + 0·0 = 0: стрелки вдоль разных осей перпендикулярны."
/>

<Check
  id="1-3-check-negative"
  question="Скалярное произведение a·b отрицательное. Что это значит?"
  options={['Стрелки смотрят в одну сторону', 'Стрелки перпендикулярны', 'Стрелки смотрят в разные стороны (угол больше 90°)']}
  answer={2}
  explain="Косинус угла больше 90° отрицательный, поэтому и произведение отрицательное."
/>

---

## Теперь в коде

Ты посчитал скалярное произведение руками — теперь научи этому компьютер. Эта функция понадобится тебе в каждом следующем модуле.

<CodeExercise id="dot" />

---

## Косинусная похожесть

У скалярного произведения есть особенность: оно растёт вместе с длиной стрелок. $[1, 1, 0] \cdot [1, 1, 0] = 2$, а $[3, 3, 0] \cdot [3, 3, 0] = 18$ — хотя направление одно и то же.

Если нужна похожесть **только по направлению**, делим на длины. Получается <Term id="cosine-similarity">косинусная похожесть</Term>:

$$
\cos\theta = \frac{a \cdot b}{|a| \cdot |b|}
$$

Она всегда лежит от −1 (ровно в разные стороны) до 1 (ровно в одну сторону).

<Sidenote>В механизме внимания используется само скалярное произведение, без деления на длины: длина вектора тоже несёт смысл. Зато результат делят на √dₖ — зачем, узнаешь в уроке 4.3.</Sidenote>

<Check
  id="1-3-check-cosine"
  question="Какая косинусная похожесть у векторов [1, 1, 0] и [3, 3, 0]?"
  options={['1', '0', '3']}
  answer={0}
  explain="Направление одинаковое — косинус угла 0° равен 1. Длина на косинусную похожесть не влияет."
/>

---

<ExplainBack
  id="1-3-explain"
  prompt="Объясни, почему скалярное произведение подходит как мера «похожести» двух векторов."
  reference="Скалярное произведение — это сумма попарных произведений координат, и оно равно |a|·|b|·cos θ. Когда стрелки смотрят в одну сторону, косинус близок к 1 и число большое; когда они перпендикулярны — ноль; когда в разные стороны — отрицательное. Так одно число показывает, насколько векторы «согласны» друг с другом."
  points={['формула: перемножить координаты попарно и сложить', 'связь с углом: |a|·|b|·cos θ', 'в одну сторону — плюс, под прямым углом — ноль, в разные стороны — минус']}
/>

---

## Итог

<Summary
  points={[
    'a·b = a₁b₁ + a₂b₂ + a₃b₃ — перемножить попарно и сложить.',
    'Знак говорит о направлении: плюс — в одну сторону, ноль — под прямым углом, минус — в разные стороны.',
    'Косинусная похожесть делит a·b на длины и зависит только от направления.',
  ]}
  cards={cards}
/>
````

- [ ] **Step 5: Запустить тесты и сборку**

Run: `npm test && npm run build`
Expected: PASS (контент-тесты для всех пяти уроков, включая уникальность id); в `out/courses/attention/` пять HTML-файлов уроков.

- [ ] **Step 6: Пройти уроки вручную**

Run: `npm run serve:out` (в фоне), открыть `http://localhost:3100/courses/attention/1-1-vector`.
Expected: стрелка тянется за кончик и прилипает к сетке 0.5; числа в полях меняются синхронно; клик по стрелке открывает карточку с координатами; `VectorTask` засчитывает [2, 1, 3]. В 1.3 дуга угла меняет цвет при переходе через 90°, а решение `dot` проходит 5 из 5 тестов. Остановить сервер.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(content): lessons 1.1 vector, 1.2 vector operations, 1.3 dot product" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: E2E-тесты, проверка качества, готовность к публикации

**Files:**
- Create: `playwright.config.ts`, `e2e/seed.ts`, `e2e/lesson-flow.spec.ts`, `e2e/code-exercise.spec.ts`, `e2e/stage.spec.ts`, `e2e/review.spec.ts`, `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: всё приложение; ключ хранилища `ailearning:v1` и формат `{ version: 1, state: ProgressData }` (Task 5).

- [ ] **Step 1: Настроить Playwright**

```bash
npx playwright install chromium
printf '\n# lighthouse reports\nlighthouse-*.json\n' >> .gitignore
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run serve:out',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 300_000,
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
```

`e2e/seed.ts`:

```ts
import type { Page } from '@playwright/test'

/** Записывает прогресс в localStorage до загрузки страницы (выполняется при каждой навигации). */
export async function seedProgress(page: Page, state: Record<string, unknown>): Promise<void> {
  await page.addInitScript((data) => {
    window.localStorage.setItem(
      'ailearning:v1',
      JSON.stringify({
        version: 1,
        state: { version: 1, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {}, ...data },
      }),
    )
  }, state)
}
```

- [ ] **Step 2: Написать e2e-тесты**

`e2e/lesson-flow.spec.ts`:

```ts
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
  expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([])
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
```

`e2e/code-exercise.spec.ts`:

```ts
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
  await seedProgress(page, { lessons: { '1.3': { status: 'completed', unlockedStep: 0 } } })
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
```

`e2e/stage.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { seedProgress } from './seed'

test('a 3D stage mounts a WebGL canvas when scrolled into view', async ({ page }) => {
  await seedProgress(page, { lessons: { '1.1': { status: 'completed', unlockedStep: 0 } } })
  await page.goto('/courses/attention/1-1-vector')
  const stage = page
    .locator('.observatory')
    .filter({ has: page.getByRole('textbox', { name: 'v, координата x' }) })
    .first()
  await stage.scrollIntoViewIfNeeded()
  await expect(stage.locator('canvas')).toBeVisible({ timeout: 15_000 })
})
```

`e2e/review.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { seedProgress } from './seed'

test('a due card can be reviewed on /review', async ({ page }) => {
  await seedProgress(page, { cards: { 'c-0-1-next-word': { box: 1, due: '2000-01-01' } } })
  await page.goto('/review')
  await expect(page.getByText('Что делает языковая модель вроде ChatGPT на каждом шаге?')).toBeVisible()
  await page.getByRole('button', { name: 'Показать ответ' }).click()
  await page.getByRole('button', { name: 'Помню ✓' }).click()
  await page.getByRole('button', { name: 'Следующая карточка →' }).click()
  await expect(page.getByText(/На сегодня всё/)).toBeVisible()
})
```

- [ ] **Step 3: Запустить e2e**

Run: `npm run e2e`
Expected: PASS — 10 тестов (lesson-flow 6, code-exercise 2, stage 1, review 1).

Если `stage.spec.ts` падает только потому, что в среде CI нет даже программного WebGL, это проблема окружения, а не кода. Тест нужно запустить локально с установленным Chrome: `npx playwright test e2e/stage.spec.ts --project=chromium --headed`.

- [ ] **Step 4: Линтер, типы, юнит-тесты**

Run: `npm run lint && npm run typecheck && npm test`
Expected: всё чисто.

Если правило `react-hooks/set-state-in-effect` сработает на намеренных инициализациях после гидратации (`Stage` — проверка WebGL, `Recall` и `ReviewDeck` — выбор карточек после загрузки прогресса), поставить построчный `// eslint-disable-next-line react-hooks/set-state-in-effect` с пояснением «состояние зависит от браузера/localStorage и вычисляется только после гидратации». Остальные замечания исправить в коде.

- [ ] **Step 5: Lighthouse на странице урока**

```bash
npm run build
npx serve out -l 3100 &
sleep 3
npx --yes lighthouse@12 http://localhost:3100/courses/attention/1-3-dot-product --preset=desktop --only-categories=performance,accessibility,seo --chrome-flags="--headless=new" --output=json --output-path=./lighthouse-1-3.json --quiet
node -e "const r=require('./lighthouse-1-3.json');for(const [k,v] of Object.entries(r.categories))console.log(k, Math.round(v.score*100))"
kill %1
```

Expected: `performance ≥ 85`, `accessibility ≥ 90`, `seo ≥ 95`. Если какая-то категория ниже порога, открыть `lighthouse-1-3.json` → `audits` с `score < 1` в этой категории и исправить конкретные причины (контраст, `alt`, размеры бандла), затем повторить замер.

- [ ] **Step 6: README**

`README.md`:

````markdown
# Учебник ИИ

Интерактивный учебник: от векторов до статьи «Attention Is All You Need».

## Команды

```bash
npm run dev        # разработка: http://localhost:3000
npm test           # юнит- и контент-тесты (Vitest)
npm run e2e        # сквозные тесты (Playwright; сам соберёт и поднимет сайт)
npm run build      # статическая сборка в out/
npm run serve:out  # посмотреть сборку: http://localhost:3100
```

## Как устроен урок

Урок — файл `content/attention/lessons/<slug>.mdx`. Шаги разделяются строкой `---`.
Интерактивные компоненты (`<Predict>`, `<Check>`, `<VectorSpace3D>`, `<CodeExercise>` …) регистрируются в `mdx-components.tsx`.
Новый урок нужно добавить в `content/attention/course.ts` и пометить `availability: 'ready'`. `content/content.test.ts` проверит его состав.

## Публикация

`out/` — чистая статика. Для nginx: `try_files $uri $uri.html $uri/ =404;`.
Адрес сайта для sitemap задаётся переменной `NEXT_PUBLIC_SITE_URL` при сборке.
````

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test(e2e): lesson flow, code exercise, 3D stage and review; README and publish notes" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
