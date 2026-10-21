# Учебник ИИ — веха M1b: уроки 1.4–1.P, прогресс под курсом, долги M1a — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести модуль 1 до конца (уроки 1.4 «Матрица превращает пространство», 1.5 «Умножение матриц», 1.6 «Экспонента и softmax», 1.P «Смешанная практика»), перевести прогресс на ключи с префиксом курса (схема v2 с миграцией) и закрыть долги, сознательно отложенные в M1a.

**Architecture:** Платформа M1a не меняется по форме: урок — MDX, шаги — `---`, «ворота» регистрируются через `useGate`, прогресс — zustand + localStorage. Меняется **адресация прогресса**: в контенте id остаются короткими (`1.4`, `1-4-check-shape`, `c-1-4-matvec`), а в хранилище живут под курсом (`attention/1.4`). Префикс добавляет один слой — `LessonProvider` (знает курс) и хук `useProgressKey`; навигация и колода повторения строят ключ той же функцией `scopeId`. Новые визуализации: 3D-куб под матрицей (`components/viz/matrices/`), DOM-таблицы умножения матриц, DOM-столбики softmax (`components/viz/softmax/`). Новые упражнения с кодом: `matVec`, `matMul`, `softmax`, `similarity`.

**Tech Stack:** Next.js 16.4 · React 19 · TypeScript · Tailwind CSS 4 · @next/mdx + remark-math + rehype-katex · three 0.186 + @react-three/fiber 9 + @react-three/drei 10 · CodeMirror 6 · sucrase · zustand 5 · Vitest 5 + Testing Library · Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-ai-textbook-design.md` (§10 — состав уроков 1.4–1.P; §3.2 — политика «ворот» и карточек после «Показать ответ»; §5.4 — связь сцены и текста; §5.6 — прогресс). Task 1 дописывает в спецификацию §11 «Изменения после M1a»: ключи с префиксом курса и остальные решения этого плана. Вход по долгам: `docs/superpowers/notes/2026-10-20-m1a-followups.md`.

**Отклонения от спецификации (осознанные):**
- §5.6 описывает ключи прогресса без курса (`lessons[id]`). Теперь ключ — `<курс>/<id>`; схема прогресса получает версию 2, а v1 мигрирует автоматически (всё, что было, считается курсом `attention`). Ключ localStorage остаётся `ailearning:v1`: это имя «поколения хранилища», а не схемы.
- `softmax` для строки из одних `−∞` возвращает равные доли (1/n), а не `NaN`: «смотреть некуда — смотрим поровну». Это согласуется с существующим правилом «равные оценки → равные доли» и понадобится уроку 4.5.
- Игра «какие формы перемножаются» (§10, урок 1.5) реализована отдельными «воротами» `<ShapeGame>` с раундами, а не серией `<Check>`: раундов пять, а правило одно, и после двух ошибок ученику показывают правило, а не ответ.
- Состояние `NextWordGame` после перезагрузки не сохраняется в прогрессе (новой секции в схеме нет): пройденная игра показывает лучшие ответы и комментарии, вычисляя их из `rounds`.

**🧑‍🎓 Вклад ученика.** Остановок «напиши эти 5–10 строк сам» в плане нет: 20 октября Борис попросил принимать такие решения за него и объяснять их. Исполнитель принимает учебно-значимые решения сам и коротко объясняет их в отчёте по задаче.

## Global Constraints

- Node ≥ 22; npm. Версии: next 16.4.x, react 19.x, @react-three/fiber 9.x, @react-three/drei 10.x, three 0.186.x, tailwindcss 4.x, zustand 5.x, vitest 5.x, @playwright/test 1.6x. Новые зависимости не добавляются.
- Весь текст интерфейса и уроков — на русском; `<html lang="ru">`.
- Никаких API routes, middleware, server actions: сборка — `output: 'export'`.
- MDX-уроки ничего не импортируют: все компоненты регистрируются в `mdx-components.tsx`.
- В MDX и в `content/**` id короткие, без курса: урок `1.4`, ворота `1-4-check-shape`, карточка `c-1-4-matvec`, упражнение `matVec`. Префикс курса добавляется только при обращении к прогрессу функцией `scopeId(courseId, id)` → `attention/1.4`. Голые id в `useProgress` вне тестов компонентов — ошибка.
- Все «ворота» — DOM-элементы (кнопки и поля), а не объекты внутри canvas. Урок проходим без WebGL.
- Правило 3D (§5.4): 3D только там, где глубина несёт смысл (куб под матрицей). Таблицы умножения и столбики softmax — DOM.
- Все числа визуализаций считаются функциями `lib/math`; захардкоженных результатов в компонентах нет.
- Цвета: бумага `#f6f3ec`, текст `#22201c`, второстепенный `#6f6758`, линии `#e2dccf`; обсерватория — градиент `#1b2550 → #0a0e1f`; понятия: query/a — `#22d3ee` (на бумаге `#0e7490`), key/b — `#fb923c` (на бумаге `#c2410c`), value — `#a78bfa` (на бумаге `#6d28d9`), result — `#a3e635` (на бумаге `#3f6212`).
- Числа в интерфейсе — с точкой (`0.5`); поля ввода принимают точку, запятую и минус `−` (U+2212) через `parseNumber`.
- Ключи хранилища: `ailearning:v1`, резервная копия `ailearning:backup`. Версия схемы прогресса — **2**; v1 мигрирует с префиксом `attention/`.
- Интервалы повторения (коробки Лейтнера 1–5): 1 / 3 / 7 / 16 / 35 дней. Таймаут кода ученика — 2000 мс.
- Состав урока `lesson`: ≥1 `<Predict>`, ≥2 `<Check>`, ровно 1 `<Summary>`, ровно 1 `<Recall>`, ≥2 карточки. Состав урока `practice`: суммарно ≥3 `<Check>`/`<Faded>`/`<CodeExercise>`, ровно 1 `<Summary>`, ровно 1 `<Recall>`, ≥2 карточки, `<Predict>` не обязателен. Это проверяет `content/content.test.ts`.
- Lighthouse (десктоп, страница урока): Performance ≥ 85, SEO ≥ 95, Accessibility ≥ 90.
- Каждая задача заканчивается коммитом; в конце сообщения коммита строка `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Перед каждым коммитом: `npm test` зелёный, `npm run typecheck` и `npm run lint` без ошибок.

## Review Focus

1. **Старый прогресс (схема v1) в localStorage после обновления сайта**: уроки, ворота, код, объяснения, карточки и карточки-копии оказываются под ключами `attention/…`, ничего не теряется и не дублируется; JSON, экспортированный до обновления, импортируется. Тесты — Task 1 (`migrateProgress`, загрузка v1 из localStorage, импорт v1) и Task 12 (восстановление из резервной копии v1).
2. **Один и тот же короткий id в двух местах**: ворота `1-3-check-unit` внутри урока пишут в `attention/1-3-check-unit`, а карточка-копия `check:1-3-check-unit` — в `attention/check:1-3-check-unit`; колода `/review` и значок повторения считают карточки по тем же ключам, что и завершение урока. Тесты — Task 2 (`useGate` под провайдером), Task 3 (`readyCardIds`, страница повторения).
3. **Ввод в ячейку матрицы или поле оценки softmax**: `1,5` → 1.5, `−2` → −2, `abc` игнорируется, `9` зажимается в границу (матрица ±3, оценки ±50), результат пересчитывается, `NaN` в сцене не появляется. Тесты — Task 7 (`MatrixTransform3D`), Task 10 (`SoftmaxBars`).
4. **Оценки softmax, на которых наивный код ломается**: `[1000, 1001]` в упражнении (эталон проходит, `Infinity/Infinity` — нет, подсказка объясняет вычитание максимума); провал с совпадающим округлением показывает больше знаков, а не «ожидалось 0.2689, получено 0.2689». Тесты — Task 4 (`formatValue`, `executeExercise`), Task 10 (упражнение `softmax`).
5. **«Показать ответ» в `Faded`, `VectorTask`, `CodeExercise`, `ShapeGame`**: шаг открывается, в колоду попадает ровно одна карточка под курсом, и `/review` показывает её (код — с сохранёнными переносами строк). Тесты — Task 5 (три компонента), Task 9 (`ShapeGame`).

## Карта файлов

```
docs/superpowers/specs/2026-10-20-ai-textbook-design.md   # + §11 «Изменения после M1a»
docs/superpowers/notes/2026-10-20-m1a-followups.md        # отметки «сделано в M1b»
lib/
  progress/  scope.ts (новый: scopeId, scopeKeys) · types.ts (version: 2) · migrate.ts (v1→v2, upgradeV1)
             store.ts (importProgress v1|v2, restoreBackup) · storage.ts (readBackup) · useHydrated.ts (useSyncExternalStore)
  math/      softmax.ts (NaN-температура, строка из −∞) · mat.ts (shape отвергает «рваные» матрицы)
  code/      execute.ts (formatValue с digits, больше знаков при совпадении текстов)
  course/    registry.ts (nextLessonToStudy по ключам курса) · card-ids.ts (readyCardIds с префиксом)
  viz/       highlight.ts (новый: подсветка понятия из сцены) · matrix-helpers.ts (новый: пресеты, куб, формы)
components/
  lesson/
    engine/  LessonContext.tsx (courseId, lessonKey, lessonCardKeys) · useProgressKey.ts (новый) · useGate.ts
             LessonStep.tsx · LessonStatusBadge.tsx
    gates/   Check.tsx · Faded.tsx · ExplainBack.tsx · Recall.tsx · NextWordGame.tsx · ShapeGame.tsx (новый)
    blocks/  C.tsx (клиентский, подсветка) · Summary.tsx · Term.tsx (курс из глоссария) · Levels.tsx (стрелки)
  code/      CodeExercise.tsx (ключи под курсом, карточка при «Показать решение») · useRunner.test.tsx (новый)
  course/    CourseNav.tsx · CourseMap.tsx · ContinueButton.tsx · CourseCard.tsx (index)
  review/    CardView.tsx (pre-wrap) · BackupPanel.tsx (новый)
  viz/
    stage/   NumberField.tsx (новый, вынесен из VectorInputs)
    vectors/ VectorInputs.tsx · VectorScene.tsx (concept, подсветка) · VectorSpace3D.tsx · VectorOps3D.tsx · DotProduct3D.tsx · VectorTask.tsx
    attention/ AttentionArcs.tsx (InfoCard, клавиатура)
    matrices/ MatrixInputs.tsx · MatrixScene.tsx · LazyMatrixScene.tsx · MatrixTransform3D.tsx · MatMulExplorer.tsx · matrices.test.tsx (новые)
    softmax/  SoftmaxBars.tsx · softmax-bars.test.tsx (новые)
content/
  glossary.ts (courseId у каждого термина; + matrix-vector-product, matrix-multiplication, transpose, exponent, temperature)
  content.test.ts (ShapeGame среди ворот, readyCardIds с префиксом, термины ссылаются на существующий курс)
  attention/ course.ts (1.4, 1.5, 1.6, 1.P → ready)
             exercises/ mat-vec.ts · mat-mul.ts · softmax.ts · similarity.ts · index.ts
             lessons/ 1-4-matrix.mdx · 1-5-matmul.mdx · 1-6-softmax.mdx · 1-p-practice.mdx
app/
  page.tsx (listCourses) · courses/[course]/page.tsx · courses/[course]/[lesson]/page.tsx (courseId в провайдер)
  review/page.tsx (карточки под курсом, BackupPanel) · glossary/page.tsx (курс из термина) · icon.svg (новый) · globals.css
mdx-components.tsx (MatrixTransform3D, MatMulExplorer, ShapeGame, SoftmaxBars)
e2e/ seed.ts (схема v2) · lesson-flow.spec.ts (READY, полное прохождение 0.1) · code-exercise.spec.ts · stage.spec.ts · review.spec.ts
public/ (удалить шаблонные svg) · app/favicon.ico (удалить, вместо него app/icon.svg)
```

Юнит-тесты лежат рядом с кодом (`*.test.ts(x)`), e2e — в `e2e/*.spec.ts`. Порядок задач важен: Task 1–3 меняют адресацию прогресса и должны идти первыми; Task 7 (матрица в 3D) — до Task 8–9; Task 10 — до Task 11.

---

### Task 1: Схема прогресса v2 — ключи под курсом и миграция v1 → v2

**Files:**
- Create: `lib/progress/scope.ts`, `lib/progress/scope.test.ts`
- Modify: `lib/progress/types.ts`, `lib/progress/migrate.ts`, `lib/progress/store.ts`, `lib/progress/store.test.ts`, `lib/progress/store-hydration.test.ts`, `components/progress/ProgressHydrator.test.tsx`, `components/review/ReviewDeck.test.tsx`, `docs/superpowers/specs/2026-10-20-ai-textbook-design.md`

**Interfaces:**
- Produces: `scopeId(courseId: string, id: string): string` → `` `${courseId}/${id}` ``; `scopeKeys<T>(record: Record<string, T>, courseId: string): Record<string, T>`; `CURRENT_VERSION = 2`; `LEGACY_COURSE_ID = 'attention'`; `upgradeV1(data: ProgressData): ProgressData`; `migrateProgress(persisted, version)` понимает версии 1 и 2; `importProgress(json)` принимает файлы v1 и v2; `ProgressData.version: 2`.
- Consumes: ничего нового.

- [ ] **Step 1: Написать падающие тесты для `scopeId`/`scopeKeys`**

`lib/progress/scope.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { scopeId, scopeKeys } from './scope'

describe('scope', () => {
  it('prefixes an id with its course', () => {
    expect(scopeId('attention', '1.3')).toBe('attention/1.3')
    expect(scopeId('attention', 'check:1-3-check-unit')).toBe('attention/check:1-3-check-unit')
  })

  it('prefixes every key of a record and keeps the values', () => {
    expect(scopeKeys({ '1.1': 1, 'c-a': 2 }, 'math')).toEqual({ 'math/1.1': 1, 'math/c-a': 2 })
    expect(scopeKeys({}, 'math')).toEqual({})
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что тест падает**

Run: `npx vitest run lib/progress/scope.test.ts`
Expected: FAIL — `Failed to resolve import "./scope"`.

- [ ] **Step 3: Создать `lib/progress/scope.ts`**

```ts
/** Разделитель между id курса и id сущности в ключах прогресса. В id уроков, ворот и карточек он не встречается. */
export const SCOPE_SEPARATOR = '/'

/**
 * Ключ прогресса. В контенте id короткие («1.3», «1-3-check-unit», «c-1-3-formula»), а в хранилище
 * они живут под курсом: «attention/1.3». Так два курса с уроком 1.1 не перемешают прогресс.
 */
export function scopeId(courseId: string, id: string): string {
  return `${courseId}${SCOPE_SEPARATOR}${id}`
}

/** Префиксует ключи записи: { '1.1': x } → { 'attention/1.1': x }. */
export function scopeKeys<T>(record: Readonly<Record<string, T>>, courseId: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([id, value]) => [scopeId(courseId, id), value]))
}
```

- [ ] **Step 4: Запустить — тест проходит**

Run: `npx vitest run lib/progress/scope.test.ts`
Expected: PASS (2 теста).

- [ ] **Step 5: Написать падающие тесты миграции в `lib/progress/store.test.ts`**

Добавить в конец файла новый `describe` (импорты `migrateProgress`, `STORAGE_KEY`, `useProgress` в файле уже есть):

```ts
describe('migration to schema v2 (course-scoped keys)', () => {
  const v1 = {
    version: 1,
    lessons: { '0.1': { status: 'completed', unlockedStep: 3 } },
    gates: { '0-1-check-grammar': { passed: true, attempts: 1, revealed: false } },
    code: { dot: 'function dot() {}' },
    explanations: { '1-1-explain': 'моё объяснение' },
    cards: { 'c-0-1-attention': { box: 2, due: '2026-10-23' }, 'check:0-1-check-arcs': { box: 1, due: '2026-10-21' } },
    customCards: { 'check:0-1-check-arcs': { id: 'check:0-1-check-arcs', kind: 'flip', prompt: 'В', answer: 'О' } },
  }

  it('puts every v1 key under the attention course', () => {
    const p = migrateProgress(v1, 1)
    expect(p.version).toBe(2)
    expect(p.lessons).toEqual({ 'attention/0.1': { status: 'completed', unlockedStep: 3 } })
    expect(Object.keys(p.gates)).toEqual(['attention/0-1-check-grammar'])
    expect(p.code).toEqual({ 'attention/dot': 'function dot() {}' })
    expect(p.explanations).toEqual({ 'attention/1-1-explain': 'моё объяснение' })
    expect(Object.keys(p.cards).sort()).toEqual(['attention/c-0-1-attention', 'attention/check:0-1-check-arcs'])
    // у карточки-копии меняется и внутренний id: по нему её находит колода
    expect(p.customCards['attention/check:0-1-check-arcs']).toMatchObject({ id: 'attention/check:0-1-check-arcs', prompt: 'В' })
  })

  it('loads v1 progress saved by the previous version of the site', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: v1 }))
    await useProgress.persist.rehydrate()
    expect(s().lessons['attention/0.1'].status).toBe('completed')
    expect(s().lessons['0.1']).toBeUndefined()
    expect(s().customCards['attention/check:0-1-check-arcs'].id).toBe('attention/check:0-1-check-arcs')
  })

  it('imports a v1 export file under the attention course', () => {
    expect(s().importProgress(JSON.stringify(v1))).toBe(true)
    expect(s().code).toEqual({ 'attention/dot': 'function dot() {}' })
  })

  it('still backs up and resets progress of an unknown version', () => {
    const p = migrateProgress({ version: 7, lessons: { x: 1 } }, 7)
    expect(p).toEqual(emptyProgress())
    expect(localStorage.getItem(BACKUP_KEY)).toContain('"version":7')
  })
})
```

Затем в **существующих** тестах того же файла заменить фикстуры схемы v1 на v2 (миграцию проверяет новый блок):
- в `'imports a file with corrupted entries but stores only the valid ones'` — `version: 1` → `version: 2`;
- в `'loads saved progress from localStorage on rehydrate'` — записать `{ version: 2, state: { ...emptyProgress(), lessons: { 'attention/0.1': { status: 'completed', unlockedStep: 3 } } } }` и проверять `s().lessons['attention/0.1'].status`.

- [ ] **Step 6: Запустить — тесты падают**

Run: `npx vitest run lib/progress/store.test.ts`
Expected: FAIL — `migrateProgress(v1, 1)` возвращает пустой прогресс (`version: 1`), ключи без префикса.

- [ ] **Step 7: Обновить тип схемы**

`lib/progress/types.ts`: заменить `version: 1` на `version: 2` в `ProgressData`.

- [ ] **Step 8: Реализовать миграцию в `lib/progress/migrate.ts`**

Заменить шапку и функцию `migrateProgress`; остальное (`normalizeProgress`, парсеры) не трогать, кроме `version: 1` → `version: 2` в `emptyProgress` и `normalizeProgress`:

```ts
import type { Card } from '@/lib/course/types'
import { scopeId, scopeKeys } from './scope'
import { BACKUP_KEY } from './storage'
import type { Box, CardState, GateProgress, LessonProgress, ProgressData } from './types'

export const CURRENT_VERSION = 2
/** Курс, под которым жил весь прогресс до появления префиксов (схема v1): другого курса тогда не было. */
export const LEGACY_COURSE_ID = 'attention'

export function emptyProgress(): ProgressData {
  return { version: 2, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {} }
}
```

В `normalizeProgress` — `version: 2`. Перед `backupRaw` добавить:

```ts
/** v1 → v2: все ключи получают префикс курса «attention»; у карточек-копий меняется и внутренний id. */
export function upgradeV1(data: ProgressData): ProgressData {
  const customCards = Object.fromEntries(
    Object.entries(data.customCards).map(([id, card]) => {
      const scoped = scopeId(LEGACY_COURSE_ID, id)
      return [scoped, { ...card, id: scoped }]
    }),
  )
  return {
    version: 2,
    lessons: scopeKeys(data.lessons, LEGACY_COURSE_ID),
    gates: scopeKeys(data.gates, LEGACY_COURSE_ID),
    code: scopeKeys(data.code, LEGACY_COURSE_ID),
    explanations: scopeKeys(data.explanations, LEGACY_COURSE_ID),
    cards: scopeKeys(data.cards, LEGACY_COURSE_ID),
    customCards,
  }
}
```

И заменить `migrateProgress`:

```ts
/**
 * v2 — текущая схема (ключи под курсом). v1 — та же схема без префиксов: поднимаем.
 * Любая другая версия неизвестна: сохраняем копию и начинаем с чистого листа.
 */
export function migrateProgress(persisted: unknown, version: number): ProgressData {
  if (version === CURRENT_VERSION) return normalizeProgress(persisted)
  if (version === 1) return upgradeV1(normalizeProgress(persisted))
  backupRaw(persisted)
  return emptyProgress()
}
```

- [ ] **Step 9: Научить `importProgress` принимать файлы v1 и v2**

`lib/progress/store.ts`, заменить реализацию `importProgress`:

```ts
      importProgress: (json) => {
        try {
          const parsed: unknown = JSON.parse(json)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
          const version = (parsed as { version?: unknown }).version
          // файлы старого формата (без префиксов курса) поднимаем так же, как сохранённый прогресс
          if (version !== 1 && version !== CURRENT_VERSION) return false
          set(migrateProgress(parsed, version))
          return true
        } catch {
          return false
        }
      },
```

Импорт `migrateProgress` в `store.ts` уже есть; `normalizeProgress` остаётся нужен для `merge`.

- [ ] **Step 10: Перевести фикстуры остальных тестов на схему v2**

- `lib/progress/store-hydration.test.ts`: в обоих местах `version: 1` → `version: 2`; ключ `'0.1'` → `'attention/0.1'` (и в `expect`-ах тоже); `'1.1'` → `'attention/1.1'`.
- `components/progress/ProgressHydrator.test.tsx`: в `saveInAnotherTab` — `version: 2`, ключ `'attention/0.1'`; `unlocked()` читает `lessons['attention/0.1']`; ожидание `toEqual({ status: 'in-progress', unlockedStep: 1 })` — по ключу `'attention/0.1'`.
- `components/review/ReviewDeck.test.tsx`, тест `'keeps working after importing a file with corrupted entries'`: `version: 1` → `version: 2` (иначе карточка `c-a` после миграции станет `attention/c-a`, а колоде в этом тесте передаются короткие id).

- [ ] **Step 11: Запустить тесты прогресса**

Run: `npx vitest run lib/progress components/progress components/review`
Expected: PASS, включая 4 новых теста миграции.

- [ ] **Step 12: Дописать §11 в спецификацию**

Добавить в конец `docs/superpowers/specs/2026-10-20-ai-textbook-design.md`:

```markdown

## 11. Изменения после M1a (2026-10-21, веха M1b)

- **Прогресс под курсом.** Все ключи прогресса (`lessons`, `gates`, `code`, `explanations`, `cards`, `customCards`) имеют вид `<courseId>/<id>`: `attention/1.3`, `attention/1-3-check-unit`, `attention/c-1-3-formula`, `attention/check:1-3-check-unit`. В MDX и `content/**` id остаются короткими; префикс добавляет `LessonProvider` (знает `courseId`) и хук `useProgressKey`, а навигация, глоссарий и колода повторения строят ключ функцией `scopeId`. Схема прогресса — версия 2; v1 мигрирует автоматически с префиксом `attention/` (другого курса в v1 не было). Экспортированные файлы v1 импортируются так же. Ключ localStorage по-прежнему `ailearning:v1`.
- **Глоссарий знает курс.** У термина есть `courseId` и `lessonId`; `<Term>` и `/glossary` ищут урок в указанном курсе.
- **Карточка после «Показать ответ» — у всех ворот** (§3.2): `Check`, `Faded`, `VectorTask`, `CodeExercise`, `ShapeGame` создают карточку-копию в `customCards` и ставят её в коробку 1. У `CodeExercise` ответ карточки — эталонное решение.
- **Связь сцены и текста** (§5.4): наведение на стрелку в 3D подсвечивает термины `<C>` того же понятия в тексте (общее состояние `useHighlight`); клик по слову в `AttentionArcs` открывает `InfoCard` с весом внимания; слова доступны с клавиатуры.
- **Математика.** `softmax` отвергает `NaN` и неположительную температуру; для строки из одних `−∞` возвращает равные доли (1/n) — пригодится маске в уроке 4.5. `shape` (и через него `transpose`, `matMul`) отвергает «рваные» матрицы. Отчёт упражнения показывает маленькие числа в экспоненциальной записи и больше знаков, если округлённые тексты «ожидалось/получено» совпали.
- **Урок 1.5:** игра «какие формы перемножаются» — ворота `<ShapeGame>` с раундами; после двух ошибок показывается правило (и уходит карточкой на повторение), а не ответ.
- **Резервная копия.** На `/review` есть блок «Резервная копия»: восстановить `ailearning:backup` (v1 или v2) или скачать файл.
```

- [ ] **Step 13: Полный прогон, typecheck, lint, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: всё зелёное (упавших тестов нет; остальные компоненты пока пишут голые ключи — это тесты не ловят, пока `LessonProvider` не передаёт курс).

```bash
git add lib/progress docs/superpowers/specs components/progress/ProgressHydrator.test.tsx components/review/ReviewDeck.test.tsx
git commit -m "feat(progress): schema v2 with course-scoped keys and v1 migration

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Курс в контексте урока — ворота, шаги, код и объяснения пишут ключи под курсом

**Files:**
- Create: `components/lesson/engine/useProgressKey.ts`
- Modify: `components/lesson/engine/LessonContext.tsx`, `components/lesson/engine/useGate.ts`, `components/lesson/engine/LessonStep.tsx`, `components/lesson/engine/LessonStatusBadge.tsx`, `components/lesson/blocks/Summary.tsx`, `components/lesson/gates/Recall.tsx`, `components/lesson/gates/ExplainBack.tsx`, `components/code/CodeExercise.tsx`, `app/courses/[course]/[lesson]/page.tsx`
- Test: `components/lesson/engine/LessonStep.test.tsx`, `components/lesson/gates/recall.test.tsx`, `components/lesson/gates/gates.test.tsx`, `components/code/CodeExercise.test.tsx`, `components/lesson/blocks/content-blocks.test.tsx`

**Interfaces:**
- Consumes: `scopeId` (Task 1).
- Produces: `LessonContextValue = { courseId: string; lessonId: string; lessonKey: string; lessonCardKeys: string[]; recallCards: Card[] }` (карточки разминки уже с префиксом); `LessonProvider({ courseId, lessonId, lessonCardIds, recallCards, children })`; `useProgressKey(id: string): string` — внутри урока `scopeId(courseId, id)`, вне урока `id`; `useGate(id)` регистрирует и пишет ключ под курсом, `reveal(card)` префиксует `card.id`; `LessonStatusBadge({ courseId, lessonId })`.

- [ ] **Step 1: Обновить тесты движка под курс (падающие)**

`components/lesson/engine/LessonStep.test.tsx`: в `Lesson()` провайдер становится `<LessonProvider courseId="test" lessonId="9.1" lessonCardIds={['c1']} recallCards={[]}>`. Все обращения к прогрессу — по ключам с префиксом:
- `lessons['9.1']` → `lessons['test/9.1']` (3 места);
- `unlockStep('9.1', …)` → `unlockStep('test/9.1', …)` (3 места);
- `recordAttempt('g1', true)` → `recordAttempt('test/g1', true)` (2 места);
- `completeLesson('9.1', [], …)` → `completeLesson('test/9.1', [], …)`;
- `cards.c1?.box` → `cards['test/c1']?.box`.

`components/lesson/gates/recall.test.tsx`: провайдер в `renderRecall` и в тесте `Summary` получает `courseId="test"`; состояния карточек и ожидания — по ключам `'test/c-a'`, `'test/c-b'` (в `useProgress.setState({ cards: … })`, в `expect(…cards['test/c-a'].box)`, в `toEqual({ 'test/c-a': { box: 3, due: '2999-01-01' } })`); ворота разминки — `gates['test/r1']`.

`components/lesson/blocks/content-blocks.test.tsx`, блок `Term`: в тесте `'does not link a term to the lesson the learner is reading'` провайдер получает `courseId="attention"`; в тесте `'links back to the lesson once the term has been studied'` — `completeLesson('attention/1.3', [], '2026-10-20')` (сам `Term` научится читать этот ключ в Task 3; до тех пор этот один тест будет красным — это ожидаемо и отмечено в Step 8).

Добавить в `components/lesson/gates/gates.test.tsx` (импорт `LessonProvider` из `@/components/lesson/engine/LessonContext`):

```ts
describe('gates inside a lesson', () => {
  it('store their state under the course and scope the review card of a revealed answer', async () => {
    render(
      <LessonProvider courseId="t" lessonId="1.1" lessonCardIds={[]} recallCards={[]}>
        <Check id="q9" question="2 + 2?" options={['3', '4']} answer={1} />
      </LessonProvider>,
    )
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    expect(gates()['t/q9']).toMatchObject({ passed: true, revealed: true, attempts: 2 })
    expect(gates().q9).toBeUndefined()
    expect(useProgress.getState().customCards['t/check:q9']).toMatchObject({ id: 't/check:q9', correct: 1 })
    expect(useProgress.getState().cards['t/check:q9']?.box).toBe(1)
  })
})
```

Добавить в `components/code/CodeExercise.test.tsx` (импорт `LessonProvider`):

```ts
  it('stores code and the gate under the course inside a lesson', async () => {
    run.mockResolvedValue(green)
    render(
      <LessonProvider courseId="t" lessonId="1.3" lessonCardIds={[]} recallCards={[]}>
        <CodeExercise id="dot" />
      </LessonProvider>,
    )
    const editor = await screen.findByRole('textbox', { name: 'Код: Напиши dot(a, b)' })
    await userEvent.clear(editor)
    await userEvent.type(editor, 'y')
    expect(useProgress.getState().code['t/dot']).toBe('y')
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    await screen.findByText('1 из 1 теста пройдено')
    expect(useProgress.getState().gates['t/code:dot'].passed).toBe(true)
  })
```

- [ ] **Step 2: Запустить — убедиться, что тесты падают**

Run: `npx vitest run components/lesson components/code`
Expected: FAIL — TypeScript/рантайм: `courseId` не принимается провайдером, ключи без префикса.

- [ ] **Step 3: `LessonContext` знает курс и строит ключи**

Заменить `components/lesson/engine/LessonContext.tsx` целиком:

```tsx
'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'

export interface LessonContextValue {
  courseId: string
  lessonId: string
  /** Ключ урока в прогрессе: `<курс>/<id>`. */
  lessonKey: string
  /** Ключи карточек этого урока в прогрессе: попадут в колоду при завершении. */
  lessonCardKeys: string[]
  /** Карточки предыдущих уроков (id уже с префиксом курса): материал для разминки. */
  recallCards: Card[]
}

export interface LessonProviderProps {
  courseId: string
  lessonId: string
  /** Короткие id карточек из `cards` урока. */
  lessonCardIds: string[]
  /** Карточки предыдущих уроков с короткими id. */
  recallCards: Card[]
  children: ReactNode
}

const LessonContext = createContext<LessonContextValue | null>(null)

/** Единственное место, где короткие id контента превращаются в ключи прогресса под курсом. */
export function LessonProvider({ courseId, lessonId, lessonCardIds, recallCards, children }: LessonProviderProps) {
  const value = useMemo<LessonContextValue>(
    () => ({
      courseId,
      lessonId,
      lessonKey: scopeId(courseId, lessonId),
      lessonCardKeys: lessonCardIds.map((id) => scopeId(courseId, id)),
      recallCards: recallCards.map((card) => ({ ...card, id: scopeId(courseId, card.id) })),
    }),
    [courseId, lessonId, lessonCardIds, recallCards],
  )
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

- [ ] **Step 4: Хук `useProgressKey` и `useGate` под курсом**

Создать `components/lesson/engine/useProgressKey.ts`:

```ts
'use client'

import { scopeId } from '@/lib/progress/scope'
import { useLessonOptional } from './LessonContext'

/**
 * Ключ сущности урока в прогрессе: внутри урока — с префиксом курса («attention/1-3-check-unit»),
 * вне урока (так рендерятся тесты компонентов) — как есть.
 */
export function useProgressKey(id: string): string {
  const lesson = useLessonOptional()
  return lesson ? scopeId(lesson.courseId, id) : id
}
```

Заменить `components/lesson/engine/useGate.ts` целиком:

```ts
'use client'

import { useCallback } from 'react'
import type { Card } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useIsomorphicLayoutEffect } from '@/lib/react/use-isomorphic-layout-effect'
import { useLessonOptional } from './LessonContext'
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
  const lesson = useLessonOptional()
  // Внутри урока ключи живут под курсом; вне урока (тесты компонентов) — как есть.
  const key = lesson ? scopeId(lesson.courseId, id) : id
  const registerGate = useStep()?.registerGate
  useIsomorphicLayoutEffect(() => registerGate?.(key), [registerGate, key])

  const gate = useProgress((s) => s.gates[key])
  const recordAttempt = useProgress((s) => s.recordAttempt)
  const passGate = useProgress((s) => s.passGate)
  const revealGate = useProgress((s) => s.revealGate)

  const record = useCallback((correct: boolean, choice?: number) => recordAttempt(key, correct, choice), [recordAttempt, key])
  const pass = useCallback(() => passGate(key), [passGate, key])
  const reveal = useCallback(
    (card?: Card) => {
      // карточка-копия тоже живёт под курсом: по этому id её находят колода и значок повторения
      const scoped = card && lesson ? { ...card, id: scopeId(lesson.courseId, card.id) } : card
      revealGate(key, scoped, todayISO())
    },
    [revealGate, key, lesson],
  )

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

- [ ] **Step 5: Шаги, итог, значок, разминка, объяснения, код — по ключам**

`components/lesson/engine/LessonStep.tsx`: `const { lessonKey, lessonCardKeys } = useLesson()`; все `lessonId` заменить на `lessonKey` (`s.lessons[lessonKey]`, `unlockStep(lessonKey, i + 1)`, `completeLesson(lessonKey, lessonCardKeys, todayISO())`).

`components/lesson/blocks/Summary.tsx`: `const { lessonKey } = useLesson()` и `s.lessons[lessonKey]?.status === 'completed'`.

`components/lesson/engine/LessonStatusBadge.tsx`:

```tsx
'use client'

import { scopeId } from '@/lib/progress/scope'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function LessonStatusBadge({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const hydrated = useHydrated()
  const key = scopeId(courseId, lessonId)
  const completed = useProgress((s) => s.lessons[key]?.status === 'completed')
  if (!hydrated || !completed) return null
  return (
    <p className="mt-4 inline-flex rounded-full bg-success-bg px-3 py-1 text-sm text-success">
      ✓ Урок пройден — все шаги открыты, его можно перечитывать как справочник
    </p>
  )
}
```

`components/lesson/gates/Recall.tsx`: добавить `import { useProgressKey } from '@/components/lesson/engine/useProgressKey'`; в компоненте `const key = useProgressKey(id)` и в эффекте `if (gates[key]?.passed)` вместо `gates[id]`. Зерно `pickRecallCards(…, id)` оставить коротким.

`components/lesson/gates/ExplainBack.tsx`: `const key = useProgressKey(id)`; `useProgress((s) => s.explanations?.[key])`; `saveExplanation(key, e.target.value)`.

`components/code/CodeExercise.tsx`, в `CodeExerciseView`: `const key = useProgressKey(exercise.id)`; `useProgress((s) => s.code[key])`; все три `saveCode(exercise.id, …)` → `saveCode(key, …)`. Ворота остаются `useGate(\`code:${exercise.id}\`)` — префикс добавит сам `useGate`.

- [ ] **Step 6: Страница урока передаёт курс**

`app/courses/[course]/[lesson]/page.tsx`: `<LessonStatusBadge courseId={course.id} lessonId={lesson.id} />` и

```tsx
        <LessonProvider
          courseId={course.id}
          lessonId={lesson.id}
          lessonCardIds={mod.cards.map((c) => c.id)}
          recallCards={previous.flatMap((m) => m.cards)}
        >
```

- [ ] **Step 7: Запустить тесты движка и ворот**

Run: `npx vitest run components/lesson components/code`
Expected: PASS всё, кроме одного теста `Term` `'links back to the lesson once the term has been studied'` (его чинит Task 3).

- [ ] **Step 8: Typecheck, lint, коммит**

Run: `npm run typecheck && npm run lint`
Expected: без ошибок.

```bash
git add components/lesson components/code "app/courses/[course]/[lesson]/page.tsx"
git commit -m "feat(lesson): gates, steps, code and explanations store progress under the course

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Курс в навигации, терминах, колоде повторения и e2e-сидах

**Files:**
- Modify: `lib/course/registry.ts`, `lib/course/registry.test.ts`, `lib/course/card-ids.ts`, `components/course/CourseNav.tsx`, `components/course/CourseMap.tsx`, `components/course/ContinueButton.tsx`, `components/course/CourseCard.tsx`, `components/course/course.test.tsx`, `components/lesson/blocks/Term.tsx`, `content/glossary.ts`, `content/content.test.ts`, `app/glossary/page.tsx`, `app/page.tsx`, `app/courses/[course]/page.tsx`, `app/review/page.tsx`, `e2e/seed.ts`, `e2e/code-exercise.spec.ts`, `e2e/stage.spec.ts`, `e2e/review.spec.ts`

**Interfaces:**
- Consumes: `scopeId` (Task 1).
- Produces: `GlossaryEntry.courseId: string`; `nextLessonToStudy(course, statuses)` читает `statuses[scopeId(course.id, lesson.id)]`; `readyCardIds()` возвращает ключи с префиксом курса; `CourseCard({ course, index })`; страница `/review` передаёт в `ReviewDeck` карточки с id под курсом.

- [ ] **Step 1: Обновить тесты навигации и реестра (падающие)**

`lib/course/registry.test.ts`, тест `'suggests the first unfinished ready lesson…'`: ключи статусов с курсом `test`:

```ts
    expect(nextLessonToStudy(course, {})?.id).toBe('0.1')
    expect(nextLessonToStudy(course, { 'test/0.1': { status: 'completed' } })?.id).toBe('1.1')
    expect(
      nextLessonToStudy(course, { 'test/0.1': { status: 'completed' }, 'test/1.1': { status: 'completed' } })?.id,
    ).toBe('1.1')
    // статус без префикса курса — чужой: его не замечаем
    expect(nextLessonToStudy(course, { '0.1': { status: 'completed' } })?.id).toBe('0.1')
```

`components/course/course.test.tsx`: в `CourseNavList` — `lessons: { 'attention/0.1': {…}, 'attention/9.9': {…} }`; в `ContinueButton with stale progress` — `{ 'attention/9.9': … }`. Добавить тест:

```ts
describe('ContinueButton after the first lesson', () => {
  it('continues with the next lesson when progress is stored under the course', async () => {
    useProgress.setState({ lessons: { 'attention/0.1': { status: 'completed', unlockedStep: 6 } } })
    await useProgress.persist.rehydrate()
    render(<ContinueButton course={attentionCourse} />)
    expect(screen.getByRole('link', { name: /Продолжить: 0\.2/ })).toHaveAttribute('href', '/courses/attention/0-2-journey-map')
  })
})
```

`content/content.test.ts`: в последнем тесте заменить `expect(readyCardIds()).toEqual(cardIds)` на `expect(readyCardIds()).toEqual(cardIds.map((id) => scopeId(course.id, id)))` (импорт `scopeId` из `@/lib/progress/scope`). Добавить тест глоссария (импорт `findLessonById` из `@/lib/course/registry`):

```ts
  it('points every glossary term to an existing lesson of an existing course', () => {
    for (const entry of Object.values(GLOSSARY)) {
      const termCourse = getCourse(entry.courseId)
      expect(termCourse, `term ${entry.id}: unknown course ${entry.courseId}`).toBeDefined()
      expect(findLessonById(termCourse!, entry.lessonId), `term ${entry.id}: unknown lesson ${entry.lessonId}`).toBeDefined()
    }
  })
```

- [ ] **Step 2: Запустить — тесты падают**

Run: `npx vitest run lib/course components/course content/content.test.ts`
Expected: FAIL — `nextLessonToStudy` ищет по голому id; `courseId` у терминов нет; `readyCardIds` без префикса.

- [ ] **Step 3: Реестр и карточки — под курсом**

`lib/course/registry.ts`: добавить `import { scopeId } from '@/lib/progress/scope'` и заменить `nextLessonToStudy`:

```ts
/** Первый непройденный готовый урок (статусы — по ключам прогресса под курсом) или последний готовый. */
export function nextLessonToStudy(
  course: CourseMeta,
  statuses: Record<string, { status: string } | undefined>,
): FlatLesson | undefined {
  const ready = readyLessons(course)
  return ready.find((l) => statuses[scopeId(course.id, l.id)]?.status !== 'completed') ?? ready[ready.length - 1]
}
```

`lib/course/card-ids.ts`: импорт `scopeId` и в `readyCardIds` — `cardIdsInSource(…).map((id) => scopeId(course.id, id))`. Обновить комментарий: «id всех карточек готовых уроков всех курсов **в ключах прогресса (под курсом)** — колода повторения».

- [ ] **Step 4: Навигация читает статусы по ключам**

`components/course/CourseNav.tsx`: импорт `scopeId`; `<StatusDot status={hydrated ? lessons[scopeId(course.id, l.id)]?.status : undefined} />`.

`components/course/CourseMap.tsx`: импорт `scopeId`; `m.lessons.filter((l) => lessons[scopeId(course.id, l.id)]?.status === 'completed').length`.

`components/course/ContinueButton.tsx`: импорт `scopeId`; `flatLessons(course).some((l) => lessons[scopeId(course.id, l.id)] !== undefined)`.

- [ ] **Step 5: Глоссарий знает курс**

`content/glossary.ts`: интерфейс и обёртка —

```ts
export interface GlossaryEntry {
  id: string
  term: string
  short: string
  /** Курс и урок, где термин вводится. */
  courseId: string
  lessonId: string
}

const attentionTerms: Omit<GlossaryEntry, 'courseId'>[] = [
  // …все существующие записи без изменений…
]

const entries: GlossaryEntry[] = attentionTerms.map((entry) => ({ ...entry, courseId: 'attention' }))

export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(entries.map((e) => [e.id, e]))
```

(переименовать текущий массив `entries` в `attentionTerms` и сменить его тип; записи не трогать).

`app/glossary/page.tsx`: убрать `const course = getCourse('attention')!`; внутри `map` — `const course = getCourse(entry.courseId)` и `const lesson = course ? findLessonById(course, entry.lessonId) : undefined`; блок со ссылкой рендерить как `{course && lesson && (…)}`, в `href` использовать `course.id`.

Заменить `components/lesson/blocks/Term.tsx` целиком:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById, getCourse } from '@/lib/course/registry'
import type { FlatLesson } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'
import { useProgress } from '@/lib/progress/store'
import { useLessonOptional } from '@/components/lesson/engine/LessonContext'

/** Строка под определением: где термин объясняется подробно. */
function LessonNote({ courseId, lesson, known, here }: { courseId: string; lesson: FlatLesson; known: boolean; here: boolean }) {
  const href = `/courses/${courseId}/${lesson.slug}`
  const ready = lesson.availability === 'ready'
  if (known) {
    // Термин уже знаком — ссылка ведёт назад, чтобы освежить урок. На открытый сейчас урок ссылаться незачем.
    return ready && !here ? (
      <Link href={href} className="mt-2 block text-xs text-ink-cyan underline">
        Урок {lesson.id}: {lesson.title}
      </Link>
    ) : (
      <span className="mt-2 block text-xs text-muted">{`Урок ${lesson.id}: ${lesson.title}`}</span>
    )
  }
  if (!ready) return <span className="mt-2 block text-xs text-muted">{`Подробно — в уроке ${lesson.id} (скоро)`}</span>
  return (
    <Link href={href} className="mt-2 block text-xs text-ink-cyan underline">
      Подробно — в уроке {lesson.id}: {lesson.title}
    </Link>
  )
}

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const popoverId = useId()
  const current = useLessonOptional()
  const course = entry ? getCourse(entry.courseId) : undefined
  const lesson = entry && course ? findLessonById(course, entry.lessonId) : undefined
  const studied = useProgress((s) =>
    course && lesson ? s.lessons[scopeId(course.id, lesson.id)]?.status === 'completed' : false,
  )

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

  const here = current?.courseId === course?.id && current?.lessonId === lesson?.id

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
          {course && lesson && <LessonNote courseId={course.id} lesson={lesson} known={studied || here} here={here} />}
        </span>
      )}
    </span>
  )
}
```

- [ ] **Step 6: Главная, страница курса и колода — по всем курсам**

`components/course/CourseCard.tsx`: сигнатура `({ course, index }: { course: CourseMeta; index: number })`, подпись `<p className="gate-label">Курс {index}</p>`.

`app/page.tsx`: заменить `const course = getCourse('attention')!` на `const courses = listCourses()` и `const course = courses[0]` (импорт `listCourses` вместо `getCourse`); в секции «Курсы» — `{courses.map((c, i) => <CourseCard key={c.id} course={c} index={i + 1} />)}` перед карточкой «Скоро».

`app/courses/[course]/page.tsx`: `const index = listCourses().findIndex((c) => c.id === course.id) + 1` и `<p className="gate-label">Курс {index}</p>`.

`app/review/page.tsx` целиком:

```tsx
import type { Metadata } from 'next'
import { ReviewDeck } from '@/components/review/ReviewDeck'
import { loadLessonModule } from '@/lib/course/lesson-module'
import { listCourses, readyLessons } from '@/lib/course/registry'
import { scopeId } from '@/lib/progress/scope'

export const metadata: Metadata = {
  title: 'Повторение',
  description: 'Интервальное повторение карточек из пройденных уроков.',
}

export default async function ReviewPage() {
  const cards = (
    await Promise.all(
      listCourses().flatMap((course) =>
        readyLessons(course).map(async (lesson) => {
          const mod = await loadLessonModule(course.id, lesson.slug)
          // в колоде карточки живут под курсом — так же, как в прогрессе
          return mod.cards.map((card) => ({ ...card, id: scopeId(course.id, card.id) }))
        }),
      ),
    )
  ).flat()
  return (
    <main className="mx-auto max-w-[680px] px-4 py-12">
      <p className="gate-label">Интервальное повторение</p>
      <h1 className="mt-2 font-serif text-4xl">Повторение</h1>
      <p className="mt-3 text-ink-soft">
        Карточки возвращаются через 1, 3, 7, 16 и 35 дней. Отвечай по памяти — именно это укрепляет знания.
      </p>
      <div className="mt-8">
        <ReviewDeck cards={cards} />
      </div>
    </main>
  )
}
```

- [ ] **Step 7: E2E-сиды на схеме v2**

`e2e/seed.ts`: оба `version: 1` → `version: 2`. `e2e/code-exercise.spec.ts`: `lessons: { 'attention/1.3': … }`. `e2e/stage.spec.ts`: `lessons: { 'attention/1.1': … }`. `e2e/review.spec.ts`: `cards: { 'attention/c-0-1-next-word': … }`.

- [ ] **Step 8: Запустить юнит-тесты, typecheck, lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS (включая тест `Term` из Task 2 и новые тесты).

- [ ] **Step 9: Проверить e2e на свежей сборке**

Остановить сервер на :3100, если он запущен. Run: `npm run e2e`
Expected: все спеки зелёные (прогресс читается по ключам под курсом).

- [ ] **Step 10: Коммит**

```bash
git add lib/course components/course components/lesson/blocks/Term.tsx content/glossary.ts content/content.test.ts app e2e
git commit -m "feat(course): navigation, glossary and review deck address progress under the course

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Долги математики и отчёта об упражнениях

**Files:**
- Modify: `lib/math/softmax.ts`, `lib/math/softmax.test.ts`, `lib/math/mat.ts`, `lib/math/mat.test.ts`, `lib/code/execute.ts`, `lib/code/execute.test.ts`

**Interfaces:**
- Produces: `softmax(xs, temperature)` бросает при `temperature` ≤ 0 или `NaN`; строка из одних `-Infinity` → равные доли; `shape(m)` бросает `/ragged/` для «рваной» матрицы; `formatValue(value, digits = 4)`; в `TestResult` при провале с совпадающими текстами — тексты с 8 знаками.

- [ ] **Step 1: Падающие тесты softmax и матриц**

Добавить в `describe('softmax')` в `lib/math/softmax.test.ts`:

```ts
  it('rejects a NaN or non-positive temperature', () => {
    expect(() => softmax([1, 2], Number.NaN)).toThrow(/temperature/)
    expect(() => softmax([1, 2], -1)).toThrow(/temperature/)
  })

  it('gives masked-out positions zero weight and splits evenly when everything is masked', () => {
    expect(softmax([1, -Infinity, 1])).toEqual([0.5, 0, 0.5])
    expect(softmax([-Infinity, -Infinity])).toEqual([0.5, 0.5])
  })
```

Добавить в `describe('mat')` в `lib/math/mat.test.ts`:

```ts
  it('refuses ragged matrices in shape, transpose and matMul', () => {
    const ragged = [[1, 2], [3]]
    expect(() => shape(ragged)).toThrow(/ragged.*row 1 has 1/)
    expect(() => transpose(ragged)).toThrow(/ragged/)
    expect(() => matMul(ragged, [[1], [2]])).toThrow(/ragged/)
  })
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run lib/math`
Expected: FAIL — `softmax([1,2], NaN)` не бросает; `softmax([-Infinity, -Infinity])` даёт `[NaN, NaN]`; `shape(ragged)` возвращает `[2, 2]`.

- [ ] **Step 3: Исправить `softmax` и `shape`**

`lib/math/softmax.ts`:

```ts
/** Превращает любые оценки в вероятности. Вычитание максимума защищает от переполнения exp. */
export function softmax(xs: number[], temperature = 1): number[] {
  // `!(t > 0)`, а не `t <= 0`: NaN не проходит ни одно сравнение, и его тоже надо отвергнуть
  if (!(temperature > 0)) throw new Error('softmax: temperature must be positive')
  if (xs.length === 0) return []
  const scaled = xs.map((x) => x / temperature)
  const max = Math.max(...scaled)
  // Все оценки −∞ (все позиции закрыты маской): смотреть некуда — делим внимание поровну, а не отдаём NaN
  if (max === -Infinity) return xs.map(() => 1 / xs.length)
  const exps = scaled.map((x) => Math.exp(x - max))
  const total = exps.reduce((s, x) => s + x, 0)
  return exps.map((x) => x / total)
}
```

`lib/math/mat.ts`, функция `shape`:

```ts
/** Размер матрицы [строк, столбцов]. «Рваная» матрица (строки разной длины) — ошибка, а не тихий мусор. */
export function shape(m: Mat): [number, number] {
  const cols = m.length === 0 ? 0 : m[0].length
  const ragged = m.findIndex((row) => row.length !== cols)
  if (ragged !== -1) {
    throw new Error(`mat: ragged matrix (row ${ragged} has ${m[ragged].length} columns, expected ${cols})`)
  }
  return [m.length, cols]
}
```

- [ ] **Step 4: Запустить — проходят**

Run: `npx vitest run lib/math`
Expected: PASS.

- [ ] **Step 5: Падающие тесты отчёта об упражнениях**

Добавить в `lib/code/execute.test.ts` (импорт `formatValue` из `./execute`):

```ts
describe('formatValue', () => {
  it('does not round small numbers down to «0»', () => {
    expect(formatValue(0.00001)).toBe('1.00e-5')
    expect(formatValue(0)).toBe('0')
    expect(formatValue(0.26894)).toBe('0.2689')
    expect(formatValue(0.26894, 8)).toBe('0.26894')
  })

  it('names special values instead of hiding them', () => {
    expect(formatValue(Number.NaN)).toBe('NaN')
    expect(formatValue(Infinity)).toBe('Infinity')
    expect(formatValue(Symbol('x'))).toBe('Symbol(x)')
    expect(formatValue(10n)).toBe('10')
    expect(formatValue([0.5, [1, 2]])).toBe('[0.5, [1, 2]]')
  })
})

describe('executeExercise report', () => {
  it('shows more digits when the rounded expected and actual texts coincide', () => {
    const close: ExerciseDef = {
      ...exercise,
      tests: [{ name: 'p', args: [], expected: 0.2689, tolerance: 1e-6 }],
    }
    const result = executeExercise('function sum() { return 0.26894 }', close)
    expect(result.status === 'ok' && result.results[0]).toMatchObject({
      pass: false,
      expectedText: '0.2689',
      actualText: '0.26894',
    })
  })
})
```

- [ ] **Step 6: Запустить — падают**

Run: `npx vitest run lib/code`
Expected: FAIL — `formatValue(0.00001)` даёт `'0'`; `Symbol` даёт `undefined`; `BigInt` — исключение `JSON.stringify`; тексты совпадают `'0.2689'`.

- [ ] **Step 7: Исправить `formatValue` и отчёт**

`lib/code/execute.ts`, заменить `formatValue`:

```ts
/** Короткое текстовое представление значения для отчёта «ожидалось / получено». */
export function formatValue(value: unknown, digits = 4): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value)
    if (Number.isInteger(value)) return String(value)
    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor
    // маленькое ненулевое число не должно превращаться в «0»
    return rounded === 0 ? value.toExponential(2) : String(rounded)
  }
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v, digits)).join(', ')}]`
  if (typeof value === 'function') return '[функция]'
  if (value === undefined) return 'undefined'
  if (typeof value === 'symbol' || typeof value === 'bigint') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
```

И тело `exercise.tests.map` в `executeExercise`:

```ts
  const results: TestResult[] = exercise.tests.map((test) => {
    let expectedText = formatValue(test.expected)
    try {
      // structuredClone: если код ученика испортит аргументы, следующие тесты этого не увидят
      const actual: unknown = (fn as (...args: unknown[]) => unknown)(...structuredClone(test.args))
      const pass = approxEqual(actual, test.expected, test.tolerance ?? 1e-6)
      let actualText = formatValue(actual)
      // «ожидалось 0.2689, получено 0.2689» ничего не объясняет: при провале с одинаковыми текстами показываем больше знаков
      if (!pass && actualText === expectedText) {
        expectedText = formatValue(test.expected, 8)
        actualText = formatValue(actual, 8)
      }
      return { name: test.name, pass, expectedText, actualText }
    } catch (e) {
      return { name: test.name, pass: false, expectedText, error: errorMessage(e) }
    }
  })
```

- [ ] **Step 8: Запустить всё, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add lib/math lib/code
git commit -m "fix(math): softmax rejects NaN temperature and survives fully masked rows; shape rejects ragged matrices; clearer exercise reports

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Карточка на повторение после «Показать ответ» у `Faded`, `VectorTask` и `CodeExercise`

**Files:**
- Modify: `components/lesson/gates/Faded.tsx`, `components/viz/vectors/VectorTask.tsx`, `components/code/CodeExercise.tsx`, `components/review/CardView.tsx`
- Test: `components/lesson/blocks/content-blocks.test.tsx` (блок `Faded`), `components/viz/vectors/vectors.test.tsx`, `components/code/CodeExercise.test.tsx`

**Interfaces:**
- Consumes: `useGate(...).reveal(card)` (Task 2) — префиксует `card.id` сам.
- Produces: карточки-копии с id `faded:<id>`, `vector-task:<id>`, `code:<exerciseId>` (все `kind: 'flip'`).

- [ ] **Step 1: Падающие тесты**

В `components/lesson/blocks/content-blocks.test.tsx` фикстуру `steps` блока `Faded` заменить на `[{ text: '2·3 = ▢', answer: 6 }, { text: '(−1)·4 = ▢', answer: -4 }, { text: 'Сумма готова' }]` (остальные тесты блока от текстов не зависят) и в тест `'fills the blanks with the correct answers after "Показать ответы"'` добавить в конец:

```ts
    const card = useProgress.getState().customCards['faded:f2']
    expect(card).toMatchObject({ kind: 'flip', prompt: '2·3 = ▢ · (−1)·4 = ▢ · Сумма готова' })
    expect(card.answer).toBe('2·3 = 6 · (−1)·4 = -4 · Сумма готова')
    expect(useProgress.getState().cards['faded:f2']?.box).toBe(1)
```

В `components/viz/vectors/vectors.test.tsx`, новый тест в `describe('VectorTask without WebGL')`:

```ts
  it('files the target as a review card when the answer is revealed', async () => {
    render(<VectorTask id="vt5" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    expect(useProgress.getState().gates.vt5).toMatchObject({ passed: true, revealed: true })
    expect(useProgress.getState().customCards['vector-task:vt5']).toMatchObject({
      kind: 'flip',
      prompt: 'Куда указывает вектор v = [2, 1, 3]? Назови сдвиг по каждой оси.',
      answer: '2 по X (вправо), 1 по Y (вверх), 3 по Z (к тебе).',
    })
  })
```

В `components/code/CodeExercise.test.tsx`, в тест `'shows expected vs actual and offers the solution after three failed runs'` добавить:

```ts
    const card = useProgress.getState().customCards['code:dot']
    expect(card).toMatchObject({ kind: 'flip', prompt: 'Напиши dot(a, b). Скалярное произведение: перемножь координаты попарно и сложи результаты.' })
    expect(card.answer).toContain('function dot(a: number[], b: number[]): number {')
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run components/lesson/blocks components/viz/vectors components/code`
Expected: FAIL — `customCards[...]` undefined.

- [ ] **Step 3: `Faded` создаёт карточку**

В `components/lesson/gates/Faded.tsx` добавить функцию и использовать её в кнопке «Показать ответы» (`onClick={revealAnswers}`):

```ts
  /** Карточка на повторение: вопрос — шаги с пропусками, ответ — те же шаги с подставленными числами. */
  function revealAnswers() {
    const filled = steps.map((s) => (s.answer === undefined ? s.text : s.text.replace('▢', String(s.answer))))
    const line = (parts: (string | undefined)[]) => parts.filter((p): p is string => Boolean(p)).join(' · ')
    gate.reveal({
      id: `faded:${id}`,
      kind: 'flip',
      prompt: line([title, ...steps.map((s) => s.text)]),
      answer: line([title, ...filled]),
    })
  }
```

- [ ] **Step 4: `VectorTask` создаёт карточку**

В `components/viz/vectors/VectorTask.tsx` на уровне модуля `const AXIS_HINT = ['по X (вправо)', 'по Y (вверх)', 'по Z (к тебе)']`, в компоненте:

```ts
  function revealAnswer() {
    gate.reveal({
      id: `vector-task:${id}`,
      kind: 'flip',
      prompt: `Куда указывает вектор v = ${formatVec(target)}? Назови сдвиг по каждой оси.`,
      answer: `${target.map((x, i) => `${formatNum(x)} ${AXIS_HINT[i]}`).join(', ')}.`,
    })
  }
```

и `onClick={revealAnswer}` вместо `onClick={() => gate.reveal()}`.

- [ ] **Step 5: `CodeExercise` создаёт карточку**

В `components/code/CodeExercise.tsx`, обработчик «Показать решение»:

```tsx
            onClick={() => {
              setShowSolution(true)
              // решение подсмотрено — задача вернётся карточкой: вопрос — условие, ответ — эталонный код
              if (!gate.passed) {
                gate.reveal({
                  id: `code:${exercise.id}`,
                  kind: 'flip',
                  prompt: `${exercise.title}. ${exercise.prompt}`,
                  answer: exercise.solution,
                })
              }
            }}
```

- [ ] **Step 6: Ответ карточки сохраняет переносы строк**

`components/review/CardView.tsx`: у абзаца ответа класс `"m-0 rounded-lg bg-paper-deep p-3 text-sm whitespace-pre-wrap"` (ответ-код читается построчно; обычный текст не меняется).

- [ ] **Step 7: Запустить, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add components/lesson/gates/Faded.tsx components/viz/vectors components/code components/review/CardView.tsx components/lesson/blocks/content-blocks.test.tsx
git commit -m "feat(review): revealed answers in Faded, VectorTask and CodeExercise return as review cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Связь сцены и текста — подсветка `<C>` из 3D и карточка слова в `AttentionArcs`

**Files:**
- Create: `lib/viz/highlight.ts`
- Modify: `components/lesson/blocks/C.tsx`, `app/globals.css`, `components/viz/vectors/VectorScene.tsx`, `components/viz/vectors/VectorSpace3D.tsx`, `components/viz/vectors/VectorOps3D.tsx`, `components/viz/vectors/DotProduct3D.tsx`, `components/viz/attention/AttentionArcs.tsx`
- Test: `components/lesson/blocks/content-blocks.test.tsx`, `components/viz/attention/AttentionArcs.test.tsx`

**Interfaces:**
- Produces: `useHighlight` (zustand): `{ concept: ConceptKey | null; highlight(k); release(k) }`; `VectorSpec.concept?: ConceptKey`; `<C>` рендерит `data-active="true|false"`; слова в `AttentionArcs` — `role="button"` с именем `«слово»: NN% внимания`, клик открывает `InfoCard`.

- [ ] **Step 1: Падающие тесты**

В `components/lesson/blocks/content-blocks.test.tsx` добавить (импорты `act` из `@testing-library/react`, `C` из `./C`, `useHighlight` из `@/lib/viz/highlight`):

```ts
describe('C', () => {
  it('lights up while its concept is hovered in a scene and only its own release turns it off', () => {
    render(<C k="a">a</C>)
    const term = screen.getByText('a')
    expect(term).toHaveAttribute('data-active', 'false')
    act(() => useHighlight.getState().highlight('a'))
    expect(term).toHaveAttribute('data-active', 'true')
    act(() => useHighlight.getState().release('b'))
    expect(term).toHaveAttribute('data-active', 'true')
    act(() => useHighlight.getState().release('a'))
    expect(term).toHaveAttribute('data-active', 'false')
  })
})
```

В `components/viz/attention/AttentionArcs.test.tsx` добавить в `describe('AttentionArcs')`:

```ts
  it('names every other word with its share for keyboard and screen-reader users', () => {
    render(<AttentionArcs />)
    expect(screen.getAllByRole('button', { name: /% внимания$/ })).toHaveLength(10)
  })

  it('opens a card with the weight when a word is clicked and closes it again', async () => {
    render(<AttentionArcs />)
    await userEvent.click(screen.getByRole('button', { name: /^забор: / }))
    const card = screen.getByRole('dialog', { name: 'он → забор' })
    expect(card).toHaveTextContent(/% внимания/)
    expect(card).toHaveTextContent(/Самая толстая дуга/)
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run components/lesson/blocks components/viz/attention`
Expected: FAIL — модуля `highlight` нет; у слов нет роли `button`.

- [ ] **Step 3: Хранилище подсветки и клиентский `<C>`**

`lib/viz/highlight.ts`:

```ts
import { create } from 'zustand'
import type { ConceptKey } from '@/lib/theme/concepts'

interface HighlightState {
  /** Понятие, над которым сейчас курсор в сцене. */
  concept: ConceptKey | null
  highlight: (concept: ConceptKey) => void
  release: (concept: ConceptKey) => void
}

/** Сигналинг (Майер): наведение на объект сцены подсвечивает термины <C> того же понятия в тексте. */
export const useHighlight = create<HighlightState>()((set) => ({
  concept: null,
  highlight: (concept) => set({ concept }),
  // снимаем подсветку, только если её не перехватил другой объект
  release: (concept) => set((s) => (s.concept === concept ? { concept: null } : {})),
}))
```

`components/lesson/blocks/C.tsx`:

```tsx
'use client'

import type { CSSProperties, ReactNode } from 'react'
import { CONCEPTS, type ConceptKey } from '@/lib/theme/concepts'
import { useHighlight } from '@/lib/viz/highlight'

/** Цветной термин: тот же цвет, что у объекта в сцене; подсвечивается, пока на объект наведён курсор. */
export function C({ k, children }: { k: ConceptKey; children?: ReactNode }) {
  const concept = CONCEPTS[k]
  const active = useHighlight((s) => s.concept === k)
  const style = { color: concept.ink, borderBottomColor: concept.glow, '--concept-glow': concept.glow } as CSSProperties
  return (
    <span className="concept" data-active={active} style={style}>
      {children}
    </span>
  )
}
```

`app/globals.css`, после `.concept { … }`:

```css
  .concept[data-active='true'] {
    border-radius: 3px;
    background-color: color-mix(in srgb, var(--concept-glow) 22%, transparent);
  }
```

- [ ] **Step 4: Сцены сообщают о наведении**

`components/viz/vectors/VectorScene.tsx`: импорты `import type { ConceptKey } from '@/lib/theme/concepts'` и `import { useHighlight } from '@/lib/viz/highlight'`; в `VectorSpec` поле `concept?: ConceptKey` с комментарием `/** Понятие, чьи термины <C> подсвечивать при наведении. */`; в компоненте `const highlight = useHighlight((s) => s.highlight)` и `const release = useHighlight((s) => s.release)`; у `<group key={v.id}>` добавить

```tsx
            <group
              key={v.id}
              onPointerOver={() => v.concept && highlight(v.concept)}
              onPointerOut={() => v.concept && release(v.concept)}
            >
```

Проставить понятия в сценах: `VectorSpace3D` — `concept: 'a'`; `DotProduct3D` — `a: 'a'`, `b: 'b'`; `VectorOps3D` — `a: 'a'`, `b: 'b'`, `b-moved: 'b'`, `sum: 'result'`, `ka: 'result'`.

- [ ] **Step 5: `AttentionArcs` — карточка слова и клавиатура**

Заменить `components/viz/attention/AttentionArcs.tsx` целиком:

```tsx
'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ADJECTIVE, pronounAttention, type Variant } from '@/content/attention/toy-model'
import { CONCEPTS } from '@/lib/theme/concepts'
import { InfoCard } from '@/components/viz/stage/InfoCard'
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
  const [selected, setSelected] = useState<number | null>(null)
  const { tokens, weights, target } = useMemo(() => pronounAttention(variant), [variant])

  const focus = tokens.indexOf('он')
  const widths = tokens.map((t) => t.length * CHAR + PAD)
  const xs = widths.map((w, i) => widths.slice(0, i).reduce((s, x) => s + x, 0) + w / 2)
  const width = widths.reduce((s, w) => s + w, 0)
  const label = `«он» сильнее всего смотрит на «${target}» — ${percent(weights[tokens.indexOf(target)])} внимания`
  // процент виден у слова под курсором, у выбранного слова и у всех — если так попросил урок
  const shown = hovered ?? selected

  function select(i: number) {
    setSelected((current) => (current === i ? null : i))
  }

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
          onClick={() => {
            setVariant(v)
            setSelected(null)
          }}
        >
          {ADJECTIVE[v]}
        </button>
      ))}
      <span className="ml-auto font-mono text-xs text-space-muted">нажми на слово — увидишь %</span>
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
                  opacity: shown === null || shown === i ? 0.3 + weights[i] * 0.7 : 0.1,
                  transition: 'stroke-width 0.6s ease, opacity 0.3s ease',
                }}
              />
            ),
          )}
          {tokens.map((token, i) => {
            const word = i !== focus
            return (
              <g
                key={i}
                role={word ? 'button' : undefined}
                tabIndex={word ? 0 : undefined}
                aria-label={word ? `${token}: ${percent(weights[i])} внимания` : undefined}
                aria-pressed={word ? selected === i : undefined}
                className={word ? 'cursor-pointer outline-none' : undefined}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => word && select(i)}
                onKeyDown={(e) => {
                  if (word && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    select(i)
                  }
                }}
              >
                <text
                  x={xs[i]}
                  y={BASELINE}
                  textAnchor="middle"
                  fontSize="15"
                  className="font-mono"
                  fontWeight={i === focus || token === target ? 700 : 400}
                  fill={i === focus ? CONCEPTS.focus.glow : token === target ? CONCEPTS.target.glow : '#dbe6ff'}
                  opacity={i === focus || weights[i] > 0.05 ? 1 : 0.55}
                  textDecoration={selected === i ? 'underline' : undefined}
                >
                  {token}
                </text>
                {(showWeights || shown === i) && word && (
                  <text x={xs[i]} y={BASELINE + 24} textAnchor="middle" fontSize="12" fill="#7c8db5" className="font-mono">
                    {percent(weights[i])}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {selected !== null && selected !== focus && (
        <InfoCard
          info={{
            title: `он → ${tokens[selected]}`,
            body: (
              <>
                {percent(weights[selected])} внимания.{' '}
                {tokens[selected] === target
                  ? 'Самая толстая дуга: именно это слово объясняет, кто такой «он».'
                  : 'Слабая связь: это слово мало говорит о том, кто такой «он».'}{' '}
                В уроке 3.3 ты посчитаешь это число сам.
              </>
            ),
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </Observatory>
  )
}
```

`InfoCard` позиционируется абсолютно (`.info-card`) внутри `.observatory`, который уже `relative`, поэтому обёртки не нужно.

- [ ] **Step 6: Запустить тесты, typecheck, lint**

Run: `npx vitest run components/lesson/blocks components/viz && npm run typecheck && npm run lint`
Expected: PASS (включая старые тесты дуг: `path` по-прежнему 10, `img` называет цель).

- [ ] **Step 7: Проверить глазами в браузере**

Run: `npm run dev`, открыть `/courses/attention/1-3-dot-product`, навести курсор на стрелку **a** в сцене — буква **a** в тексте над сценой подсвечивается; в `/courses/attention/0-1-riddle` нажать на «забор» в дугах — открывается карточка, `Tab` ходит по словам.

- [ ] **Step 8: Коммит**

```bash
git add lib/viz/highlight.ts components/lesson/blocks app/globals.css components/viz
git commit -m "feat(viz): hovering a scene object highlights its term in the text; attention words open an info card and work from the keyboard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Матрица в 3D — `NumberField`, `MatrixInputs`, `MatrixScene`, `MatrixTransform3D`

**Files:**
- Create: `components/viz/stage/NumberField.tsx`, `lib/viz/matrix-helpers.ts`, `lib/viz/matrix-helpers.test.ts`, `components/viz/matrices/MatrixInputs.tsx`, `components/viz/matrices/MatrixScene.tsx`, `components/viz/matrices/LazyMatrixScene.tsx`, `components/viz/matrices/MatrixTransform3D.tsx`, `components/viz/matrices/matrices.test.tsx`
- Modify: `components/viz/vectors/VectorInputs.tsx`, `mdx-components.tsx`

**Interfaces:**
- Consumes: `Stage` (`camera`, `controls`, `fallback`), `Arrow3D`, `Axes3D({ bound })`, `DragHandle`, `useStageInfo`, `matVec`, `formatVec`, `formatNum`, `parseNumber`.
- Produces: `NumberField({ value, label, disabled?, bound?, onCommit })` (поведение прежнего поля из `VectorInputs`); `MATRIX_BOUND = 3`; `PRESETS: MatrixPreset[]` с id `'identity' | 'stretch-x' | 'rotate-z' | 'flatten-z' | 'swap-xy'`; `cubeCorners(size)`, `CUBE_EDGES`, `transformPoints(m, points)`, `column(m, j)`, `matVecBreakdown(m, v): string[]`, `matEquals(a, b)`, `type Shape = [number, number]`, `formatShape(s): string` (`2×3`), `productShape(a, b): Shape | null`, `shapeOptions(a, b): string[]`, `IMPOSSIBLE = 'Перемножить нельзя'`; `MatrixInputs({ label?, value, onChange, disabled? })` с полями `${label}, строка i, столбец j`; `<MatrixTransform3D initial?: PresetId; vector?: Vec; caption? />`; `MatrixScene({ matrix, vector, onVectorChange? })`.

- [ ] **Step 1: Падающие тесты помощников**

`lib/viz/matrix-helpers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  CUBE_EDGES,
  IMPOSSIBLE,
  PRESETS,
  column,
  cubeCorners,
  matEquals,
  matVecBreakdown,
  productShape,
  shapeOptions,
  transformPoints,
} from './matrix-helpers'

describe('matrix helpers', () => {
  it('builds a cube with 8 corners and 12 edges between neighbouring corners', () => {
    const corners = cubeCorners(1)
    expect(corners).toHaveLength(8)
    expect(CUBE_EDGES).toHaveLength(12)
    for (const [a, b] of CUBE_EDGES) {
      const differing = corners[a].filter((x, i) => x !== corners[b][i]).length
      expect(differing).toBe(1)
    }
    expect(transformPoints([[2, 0, 0], [0, 1, 0], [0, 0, 1]], corners)[7]).toEqual([2, 1, 1])
  })

  it('reads columns and explains M·v row by row', () => {
    const m = [
      [1, 0, 2],
      [0, 3, 0],
      [1, 1, 1],
    ]
    expect(column(m, 2)).toEqual([2, 0, 1])
    expect(matVecBreakdown(m, [1, 2, 3])).toEqual([
      '[1, 0, 2]·[1, 2, 3] = 7',
      '[0, 3, 0]·[1, 2, 3] = 6',
      '[1, 1, 1]·[1, 2, 3] = 6',
    ])
  })

  it('knows which shapes multiply and what comes out', () => {
    expect(productShape([2, 3], [3, 4])).toEqual([2, 4])
    expect(productShape([2, 3], [2, 3])).toBeNull()
    expect(shapeOptions([2, 3], [3, 4])).toEqual(['2×4', '3×3', IMPOSSIBLE])
    expect(shapeOptions([2, 3], [2, 3])).toEqual(['2×3', '3×2', IMPOSSIBLE])
    expect(shapeOptions([1, 3], [3, 1])).toEqual(['1×1', '3×3', IMPOSSIBLE])
  })

  it('compares matrices approximately and ships sensible presets', () => {
    expect(matEquals([[1, 0], [0, 1]], [[1, 0], [0, 1 + 1e-12]])).toBe(true)
    expect(matEquals([[1, 0], [0, 1]], [[1, 0], [0, 2]])).toBe(false)
    expect(matEquals([[1]], [[1, 2]])).toBe(false)
    expect(PRESETS.map((p) => p.id)).toEqual(['identity', 'stretch-x', 'rotate-z', 'flatten-z', 'swap-xy'])
    expect(new Set(PRESETS.map((p) => p.label)).size).toBe(PRESETS.length)
  })
})
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run lib/viz/matrix-helpers.test.ts`
Expected: FAIL — модуля нет.

- [ ] **Step 3: Написать `lib/viz/matrix-helpers.ts`**

```ts
import { dot, matVec, type Mat, type Vec } from '@/lib/math'
import { formatNum, formatVec } from './vector-helpers'

/** Границы ячейки матрицы в полях сцены: ±3 хватает для поворотов, растяжений и сплющиваний, а куб не улетает за сетку. */
export const MATRIX_BOUND = 3

export type PresetId = 'identity' | 'stretch-x' | 'rotate-z' | 'flatten-z' | 'swap-xy'

export interface MatrixPreset {
  id: PresetId
  label: string
  matrix: Mat
  hint: string
}

export const PRESETS: MatrixPreset[] = [
  {
    id: 'identity',
    label: 'как было',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    hint: 'Единичная матрица: каждая стрелка остаётся на месте.',
  },
  {
    id: 'stretch-x',
    label: 'растянуть X ×2',
    matrix: [
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    hint: 'Первая координата удваивается, остальные не меняются.',
  },
  {
    id: 'rotate-z',
    label: 'повернуть на 90°',
    matrix: [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    hint: 'Поворот вокруг оси Z: ось X переходит туда, где была ось Y.',
  },
  {
    id: 'flatten-z',
    label: 'сплющить Z',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    hint: 'Третья координата обнуляется: всё пространство ложится на плоскость XY. Так в уроке 0.1 «он» перенимал свойство, но не предметность.',
  },
  {
    id: 'swap-xy',
    label: 'поменять X и Y',
    matrix: [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    hint: 'Первая и вторая координаты меняются местами.',
  },
]

/** Вершины куба со стороной size и углом в начале координат; бит i номера вершины — координата i. */
export function cubeCorners(size = 1): Vec[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? size : 0, i & 2 ? size : 0, i & 4 ? size : 0])
}

/** Пары индексов вершин, соединённых ребром: соседи отличаются ровно одним битом. */
export const CUBE_EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

export function transformPoints(m: Mat, points: Vec[]): Vec[] {
  return points.map((p) => matVec(m, p))
}

/** Столбец j матрицы — образ j-й оси. */
export function column(m: Mat, j: number): Vec {
  return m.map((row) => row[j])
}

/** «[1, 0, 2]·[1, 2, 3] = 7» для каждой строки: M·v как несколько скалярных произведений. */
export function matVecBreakdown(m: Mat, v: Vec): string[] {
  return m.map((row) => `${formatVec(row)}·${formatVec(v)} = ${formatNum(dot(row, v))}`)
}

export function matEquals(a: Mat, b: Mat, eps = 1e-9): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) => row.length === b[i].length && row.every((x, j) => Math.abs(x - b[i][j]) <= eps))
  )
}

export type Shape = [number, number]

export const IMPOSSIBLE = 'Перемножить нельзя'

export function formatShape(s: Shape): string {
  return `${s[0]}×${s[1]}`
}

/** Форма A·B или null, если столбцов A не столько, сколько строк B. */
export function productShape(a: Shape, b: Shape): Shape | null {
  return a[1] === b[0] ? [a[0], b[1]] : null
}

/** Варианты ответа для игры: правильный, «перепутанные» формы и «нельзя»; без повторов, в фиксированном порядке. */
export function shapeOptions(a: Shape, b: Shape): string[] {
  const candidates = [formatShape([a[0], b[1]]), formatShape([a[1], b[0]]), formatShape([b[0], a[1]]), IMPOSSIBLE]
  return candidates.filter((option, i) => candidates.indexOf(option) === i)
}
```

- [ ] **Step 4: Запустить — проходят**

Run: `npx vitest run lib/viz`
Expected: PASS.

- [ ] **Step 5: Вынести `NumberField` в `components/viz/stage/NumberField.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { parseNumber } from '@/lib/parse-number'
import { BOUND, formatNum } from '@/lib/viz/vector-helpers'

/**
 * Числовое поле сцены: показывает число, пока его не редактируют; принимает запятую и минус «−»;
 * применяет значение по Enter или при уходе с поля и зажимает его в [−bound, bound].
 */
export function NumberField({
  value,
  label,
  disabled,
  bound = BOUND,
  onCommit,
}: {
  value: number
  label: string
  disabled?: boolean
  bound?: number
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  function commit() {
    const parsed = parseNumber(text)
    if (parsed === null) return
    const clamped = Math.max(-bound, Math.min(bound, parsed))
    onCommit(clamped)
    setText(formatNum(clamped))
  }

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
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
```

В `components/viz/vectors/VectorInputs.tsx` удалить локальный `NumberField` и его импорты (`useState`, `parseNumber`, `BOUND`), добавить `import { NumberField } from '@/components/viz/stage/NumberField'`. Прогнать `npx vitest run components/viz/vectors` — PASS без изменений в тестах.

- [ ] **Step 6: Падающие тесты сцены матрицы**

`components/viz/matrices/matrices.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MatrixTransform3D } from './MatrixTransform3D'

async function setField(name: string, value: string) {
  const field = screen.getByRole('textbox', { name })
  await userEvent.clear(field)
  await userEvent.type(field, `${value}{Enter}`)
}

const readout = () => screen.getByText(/^M·v =/)

describe('MatrixTransform3D without WebGL', () => {
  it('shows M·v for the identity and recomputes after a preset', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    expect(readout()).toHaveTextContent('M·v = [1, 0.5, 1]')
    await userEvent.click(screen.getByRole('button', { name: 'растянуть X ×2' }))
    expect(readout()).toHaveTextContent('M·v = [2, 0.5, 1]')
    expect(screen.getByRole('button', { name: 'растянуть X ×2' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('Первая координата удваивается, остальные не меняются.')).toBeInTheDocument()
  })

  it('recomputes when a matrix entry is edited, accepting a comma and clamping to the bound', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('M, строка 1, столбец 1', '1,5')
    expect(readout()).toHaveTextContent('M·v = [1.5, 0.5, 1]')
    await setField('M, строка 2, столбец 2', '9')
    expect(screen.getByRole('textbox', { name: 'M, строка 2, столбец 2' })).toHaveValue('3')
    expect(readout()).toHaveTextContent('M·v = [1.5, 1.5, 1]')
    // матрица больше не совпадает ни с одним пресетом — ни одна кнопка не активна
    expect(screen.getByRole('button', { name: 'как было' })).toHaveAttribute('data-active', 'false')
  })

  it('ignores text that is not a number', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('M, строка 3, столбец 3', 'abc')
    expect(readout()).toHaveTextContent('M·v = [1, 0.5, 1]')
  })

  it('lists one dot product per row and lets the input vector be edited too', async () => {
    render(<MatrixTransform3D vector={[1, 2, 3]} />)
    await screen.findByText(/3D-сцена недоступна/)
    expect(screen.getByText(/строка 1:/)).toHaveTextContent('[1, 0, 0]·[1, 2, 3] = 1')
    await setField('v, координата z', '0')
    expect(readout()).toHaveTextContent('M·v = [1, 2, 0]')
  })
})
```

- [ ] **Step 7: Запустить — падают**

Run: `npx vitest run components/viz/matrices`
Expected: FAIL — модулей нет.

- [ ] **Step 8: `MatrixInputs`**

`components/viz/matrices/MatrixInputs.tsx`:

```tsx
'use client'

import type { Mat } from '@/lib/math'
import { MATRIX_BOUND } from '@/lib/viz/matrix-helpers'
import { NumberField } from '@/components/viz/stage/NumberField'

/** Таблица 3×3 полей; каждая ячейка — обычное числовое поле сцены (запятая, минус, зажим в границы). */
export function MatrixInputs({
  label = 'M',
  value,
  onChange,
  disabled,
}: {
  label?: string
  value: Mat
  onChange: (m: Mat) => void
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label={`Матрица ${label}`} className="flex items-center gap-2 font-mono text-sm">
      <span className="font-semibold text-space-text">{label} =</span>
      <span className="text-2xl text-space-muted" aria-hidden>
        [
      </span>
      <div className="grid grid-cols-3 gap-1">
        {value.map((row, i) =>
          row.map((x, j) => (
            <NumberField
              key={`${i}-${j}`}
              value={x}
              bound={MATRIX_BOUND}
              disabled={disabled}
              label={`${label}, строка ${i + 1}, столбец ${j + 1}`}
              onCommit={(n) => onChange(value.map((r, ii) => (ii === i ? r.map((y, jj) => (jj === j ? n : y)) : r)))}
            />
          )),
        )}
      </div>
      <span className="text-2xl text-space-muted" aria-hidden>
        ]
      </span>
    </div>
  )
}
```

- [ ] **Step 9: `MatrixScene` и ленивая обёртка**

`components/viz/matrices/MatrixScene.tsx`:

```tsx
'use client'

import { Html, Line } from '@react-three/drei'
import { matVec, type Mat, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { CUBE_EDGES, column, cubeCorners, transformPoints } from '@/lib/viz/matrix-helpers'
import { formatVec } from '@/lib/viz/vector-helpers'
import { useStageInfo } from '@/components/viz/stage/stage-context'
import { Arrow3D, pad3 } from '@/components/viz/vectors/three/Arrow3D'
import { Axes3D } from '@/components/viz/vectors/three/Axes3D'
import { DragHandle } from '@/components/viz/vectors/three/DragHandle'

const AXIS_NAMES = ['X', 'Y', 'Z']
const COLUMN_COLORS = [CONCEPTS.a.glow, CONCEPTS.b.glow, CONCEPTS.value.glow]
const INPUT_COLOR = '#dbe6ff'
const RESULT_COLOR = CONCEPTS.result.glow
const CUBE_COLOR = '#3b4a85'

/**
 * Единичный куб до и после матрицы, три столбца как образы осей, входной вектор v и его образ M·v.
 * Все числа считает lib/math; сцена только рисует.
 */
export function MatrixScene({
  matrix,
  vector,
  onVectorChange,
}: {
  matrix: Mat
  vector: Vec
  onVectorChange?: (v: Vec) => void
}) {
  const info = useStageInfo()
  const corners = cubeCorners(1)
  const moved = transformPoints(matrix, corners)
  const image = matVec(matrix, vector)

  return (
    <>
      <Axes3D bound={2} />
      {CUBE_EDGES.map(([a, b], i) => (
        <Line key={`cube-${i}`} points={[pad3(corners[a]), pad3(corners[b])]} color={CUBE_COLOR} lineWidth={1} />
      ))}
      {CUBE_EDGES.map(([a, b], i) => (
        <Line key={`moved-${i}`} points={[pad3(moved[a]), pad3(moved[b])]} color={RESULT_COLOR} lineWidth={1.5} />
      ))}
      {[0, 1, 2].map((j) => {
        const col = column(matrix, j)
        const unit = AXIS_NAMES.map((_, k) => (k === j ? 1 : 0)).join(', ')
        return (
          <group key={j}>
            <Arrow3D
              to={col}
              color={COLUMN_COLORS[j]}
              radius={0.03}
              onClick={(e) => {
                e.stopPropagation()
                info?.show({
                  title: `${j + 1}-й столбец`,
                  body: `Ось ${AXIS_NAMES[j]} переехала в ${formatVec(col)}. Это ${j + 1}-й столбец матрицы: M·[${unit}].`,
                })
              }}
            />
            <Html position={pad3(col)} className="vector-label" style={{ color: COLUMN_COLORS[j], transform: 'translate(8px, -16px)' }}>
              {AXIS_NAMES[j]}′
            </Html>
          </group>
        )
      })}
      <group>
        <Arrow3D
          to={vector}
          color={INPUT_COLOR}
          onClick={(e) => {
            e.stopPropagation()
            info?.show({ title: 'Вектор v', body: `v = ${formatVec(vector)} — то, что подаём на вход. Потяни за шарик.` })
          }}
        />
        <Html position={pad3(vector)} className="vector-label" style={{ color: INPUT_COLOR, transform: 'translate(10px, -20px)' }}>
          v
        </Html>
        {onVectorChange && <DragHandle position={vector} color={INPUT_COLOR} onDrag={onVectorChange} />}
      </group>
      <group>
        <Arrow3D
          to={image}
          color={RESULT_COLOR}
          onClick={(e) => {
            e.stopPropagation()
            info?.show({
              title: 'M·v',
              body: `M·v = ${formatVec(image)}: каждая координата — скалярное произведение строки M на v.`,
            })
          }}
        />
        <Html position={pad3(image)} className="vector-label" style={{ color: RESULT_COLOR, transform: 'translate(10px, 8px)' }}>
          M·v
        </Html>
      </group>
    </>
  )
}
```

`components/viz/matrices/LazyMatrixScene.tsx`:

```tsx
'use client'

import dynamic from 'next/dynamic'

/** three.js и drei загружаются только вместе со сценой, а не с основным бандлом урока. */
export const LazyMatrixScene = dynamic(() => import('./MatrixScene').then((m) => m.MatrixScene), { ssr: false })
```

- [ ] **Step 10: `MatrixTransform3D`**

`components/viz/matrices/MatrixTransform3D.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { matVec, type Mat, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { PRESETS, matEquals, matVecBreakdown, type PresetId } from '@/lib/viz/matrix-helpers'
import { formatVec } from '@/lib/viz/vector-helpers'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from '@/components/viz/vectors/VectorInputs'
import { LazyMatrixScene } from './LazyMatrixScene'
import { MatrixInputs } from './MatrixInputs'

const INPUT_COLOR = '#dbe6ff'

export function MatrixTransform3D({
  initial = 'identity',
  vector: v0 = [1, 0.5, 1],
  caption,
}: {
  initial?: PresetId
  vector?: Vec
  caption?: ReactNode
}) {
  const [matrix, setMatrix] = useState<Mat>(() => PRESETS.find((p) => p.id === initial)!.matrix)
  const [v, setV] = useState<Vec>(v0)
  const image = matVec(matrix, v)
  const preset = PRESETS.find((p) => matEquals(p.matrix, matrix))

  return (
    <Stage
      camera={[3, 2.2, 3.5]}
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Готовые матрицы">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="stage-chip"
                data-active={preset?.id === p.id}
                onClick={() => setMatrix(p.matrix)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-2">
            <MatrixInputs value={matrix} onChange={setMatrix} />
            <VectorInputs label="v" color={INPUT_COLOR} value={v} onChange={setV} />
          </div>
          <p className="readout">
            M·v = <span style={{ color: CONCEPTS.result.glow }}>{formatVec(image)}</span>
          </p>
          <ol className="readout m-0 list-none space-y-0.5 p-0 text-space-muted">
            {matVecBreakdown(matrix, v).map((line, i) => (
              <li key={i}>
                строка {i + 1}: {line}
              </li>
            ))}
          </ol>
          {preset && <p className="readout text-space-muted">{preset.hint}</p>}
        </div>
      }
    >
      <LazyMatrixScene matrix={matrix} vector={v} onVectorChange={setV} />
    </Stage>
  )
}
```

Зарегистрировать в `mdx-components.tsx`: `import { MatrixTransform3D } from '@/components/viz/matrices/MatrixTransform3D'` и `MatrixTransform3D,` в объекте `components`.

- [ ] **Step 11: Запустить тесты, typecheck, lint**

Run: `npx vitest run components/viz lib/viz && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 12: Проверить сцену в браузере**

Временно вставить `<MatrixTransform3D />` в конец `content/attention/lessons/1-3-dot-product.mdx`, `npm run dev`, открыть урок 1.3: куб деформируется по пресетам, белая стрелка тянется шариком, столбцы подписаны X′ Y′ Z′, клик по стрелке открывает карточку. Убрать временную вставку.

- [ ] **Step 13: Коммит**

```bash
git add lib/viz components/viz mdx-components.tsx
git commit -m "feat(viz): MatrixTransform3D — unit cube under a 3x3 matrix with presets, editable entries and a draggable input vector

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Упражнение `matVec` и урок 1.4 «Матрица превращает пространство»

**Files:**
- Create: `content/attention/exercises/mat-vec.ts`, `content/attention/lessons/1-4-matrix.mdx`
- Modify: `content/attention/exercises/index.ts`, `content/attention/course.ts`, `content/glossary.ts`, `e2e/lesson-flow.spec.ts`

**Interfaces:**
- Consumes: `<MatrixTransform3D>` (Task 7), `ExerciseDef`, `HelperName 'dot'`.
- Produces: упражнение `matVec` (entry `matVec(m: number[][], v: number[]): number[]`, helpers `['dot']`); термины `matrix` (обновлён), `matrix-vector-product`; урок `1.4` со статусом `ready`.

- [ ] **Step 1: Упражнение `matVec` (тесты упражнений уже параметризованы по `EXERCISES`)**

`content/attention/exercises/mat-vec.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'

export const matVecExercise: ExerciseDef = {
  id: 'matVec',
  title: 'Напиши matVec(m, v)',
  entry: 'matVec',
  prompt: 'Матрица × вектор: каждая строка матрицы скалярно умножается на вектор. Функция dot уже готова — ты написал её в уроке 1.3.',
  helpers: ['dot'],
  starter: `function matVec(m: number[][], v: number[]): number[] {
  // Для каждой строки m посчитай dot(строка, v) и собери результаты в массив.
  return []
}
`,
  tests: [
    {
      name: 'единичная матрица ничего не меняет: I·[2, −1, 3] = [2, −1, 3]',
      args: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [2, -1, 3]],
      expected: [2, -1, 3],
    },
    {
      name: '[[1, 0, 2], [0, 3, 0], [1, 1, 1]]·[1, 2, 3] = [7, 6, 6]',
      args: [[[1, 0, 2], [0, 3, 0], [1, 1, 1]], [1, 2, 3]],
      expected: [7, 6, 6],
    },
    {
      name: 'растянуть X ×2: [[2, 0, 0], [0, 1, 0], [0, 0, 1]]·[1, 1, 1] = [2, 1, 1]',
      args: [[[2, 0, 0], [0, 1, 0], [0, 0, 1]], [1, 1, 1]],
      expected: [2, 1, 1],
    },
    {
      name: 'сплющить Z: третья координата обнуляется',
      args: [[[1, 0, 0], [0, 1, 0], [0, 0, 0]], [1, 2, 3]],
      expected: [1, 2, 0],
    },
    {
      name: 'матрица 2×3 даёт вектор из двух чисел: [[1, 1, 1], [1, −1, 0]]·[1, 2, 3] = [6, −1]',
      args: [[[1, 1, 1], [1, -1, 0]], [1, 2, 3]],
      expected: [6, -1],
    },
  ],
  hints: [
    'Результат — массив длиной в число строк, поэтому подойдёт m.map(...).',
    'Каждый элемент результата — dot(row, v), где row — очередная строка m.',
    'Итого одна строка: return m.map((row) => dot(row, v))',
  ],
  solution: `function matVec(m: number[][], v: number[]): number[] {
  return m.map((row) => dot(row, v))
}
`,
}
```

`content/attention/exercises/index.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'
import { dotExercise } from './dot'
import { matVecExercise } from './mat-vec'

export const EXERCISES: Record<string, ExerciseDef> = {
  [dotExercise.id]: dotExercise,
  [matVecExercise.id]: matVecExercise,
}
```

Run: `npx vitest run content/attention/exercises`
Expected: PASS — эталон проходит 5 тестов, заготовка нет.

- [ ] **Step 2: Термины глоссария**

В `content/glossary.ts` (массив `attentionTerms`): у `matrix` заменить `short` на `'Таблица чисел. Умножение на неё превращает один вектор в другой: поворачивает, растягивает, сплющивает всё пространство разом.'`; после `matrix` добавить:

```ts
  {
    id: 'matrix-vector-product',
    term: 'Умножение матрицы на вектор',
    short: 'Каждая строка матрицы скалярно умножается на вектор; сколько строк — столько чисел в результате.',
    lessonId: '1.4',
  },
```

- [ ] **Step 3: Урок 1.4 — пометить готовым и написать MDX**

`content/attention/course.ts`: строку `lesson('1.4', '1-4-matrix', 'Матрица превращает пространство', 15),` заменить на `{ ...lesson('1.4', '1-4-matrix', 'Матрица превращает пространство', 15), availability: 'ready' },`.

Run: `npx vitest run content/content.test.ts` → Expected: FAIL — нет файла `1-4-matrix.mdx`.

Создать `content/attention/lessons/1-4-matrix.mdx`:

```mdx
export const metadata = {
  description: 'Матрица — таблица чисел, которая превращает одни векторы в другие: поворачивает, растягивает, сплющивает всё пространство разом. Именно так модель получает из слова запрос, ключ и значение.',
  objectives: [
    'Умножать матрицу на вектор вручную и в коде',
    'Видеть матрицу как преобразование всего пространства',
    'Читать столбцы матрицы как новые места осей',
  ],
}

export const cards = [
  {
    id: 'c-1-4-matvec',
    kind: 'flip',
    prompt: 'Как умножить матрицу M на вектор v?',
    answer: 'Каждая строка M скалярно умножается на v. Сколько строк — столько чисел в результате.',
  },
  {
    id: 'c-1-4-columns',
    kind: 'choice',
    prompt: 'Куда переходит ось X (вектор [1, 0, 0]) после умножения на матрицу M?',
    options: ['В первый столбец M', 'В первую строку M', 'Остаётся на месте'],
    correct: 0,
    answer: 'В первый столбец: M·[1, 0, 0] берёт из каждой строки первое число.',
  },
  {
    id: 'c-1-4-shape',
    kind: 'flip',
    prompt: 'Матрица 2×3 умножается на вектор из трёх чисел. Сколько чисел в результате и почему?',
    answer: 'Два: по одному на каждую строку матрицы. Длина вектора должна совпадать с числом столбцов.',
  },
]

<Recall id="1-4-recall" />

---

<Hook title="Одна таблица двигает всё пространство">

В модуле 4 ты увидишь, как из вектора слова получаются три новых вектора — <C k="query">запрос</C>, <C k="key">ключ</C> и <C k="value">значение</C>. Делает это одна операция: умножение на <Term id="matrix">матрицу</Term>. Матрица — таблица чисел, но думать о ней лучше как о **машинке**, которая берёт стрелку и выдаёт другую стрелку. И делает это со всеми стрелками пространства сразу.

</Hook>

<Levels>
<Level title="История">

Представь машинку с тремя окошками-рецептами. В каждое окошко кладут одну и ту же стрелку, а рецепт говорит, как смешать её координаты в одно число. Три рецепта — три числа — новая стрелка. Матрица и есть набор таких рецептов: каждая строка — один рецепт.

</Level>
<Level title="Геометрия">

Матрица двигает **всё пространство**: сетка растягивается, поворачивается или сплющивается, и каждая стрелка переезжает вместе с ней. Куда уехала ось X — записано в первом столбце матрицы, ось Y — во втором, ось Z — в третьем.

</Level>
<Level title="Алгебра">

Умножение матрицы на вектор — это скалярное произведение каждой строки на вектор:

$$
\begin{bmatrix} 1 & 0 & 2 \\ 0 & 3 & 0 \\ 1 & 1 & 1 \end{bmatrix}
\cdot
\begin{bmatrix} 1 \\ 2 \\ 3 \end{bmatrix}
=
\begin{bmatrix} 1\cdot1 + 0\cdot2 + 2\cdot3 \\ 0\cdot1 + 3\cdot2 + 0\cdot3 \\ 1\cdot1 + 1\cdot2 + 1\cdot3 \end{bmatrix}
=
\begin{bmatrix} 7 \\ 6 \\ 6 \end{bmatrix}
$$

</Level>
</Levels>

---

## Потрогай матрицу

Тусклый куб — пространство как было, <C k="result">яркий</C> — после умножения на M. Нажимай готовые матрицы, меняй числа в таблице и тяни белую стрелку v: её образ M·v пересчитывается на лету.

<MatrixTransform3D initial="identity" vector={[1, 0.5, 1]} caption="Три цветные стрелки X′, Y′, Z′ — куда переехали оси. Это столбцы матрицы. Нажми на любую стрелку." />

<Predict id="1-4-predict-stretch" question="Матрица [[2, 0, 0], [0, 1, 0], [0, 0, 1]]. Что она сделает с кубом?" options={['Растянет вдвое вдоль X', 'Сожмёт вдвое вдоль X', 'Повернёт на 90°']} answer={0}>

Растянет вдоль X: первая строка «2·x + 0·y + 0·z» удваивает первую координату, а остальные строки оставляют y и z как есть. Нажми «растянуть X ×2» в сцене и проверь.

</Predict>

---

## Матрица × вектор = три скалярных произведения

Это самое важное в уроке. Каждое число результата — <Term id="dot-product">скалярное произведение</Term> одной строки матрицы на вектор. Ты уже умеешь это считать.

<WorkedExample title="Вычислим [[1, 0, 2], [0, 3, 0], [1, 1, 1]] · [1, 2, 3]">

Первая строка: $[1, 0, 2] \cdot [1, 2, 3] = 1 + 0 + 6 = 7$.

Вторая строка: $[0, 3, 0] \cdot [1, 2, 3] = 0 + 6 + 0 = 6$.

Третья строка: $[1, 1, 1] \cdot [1, 2, 3] = 1 + 2 + 3 = 6$.

Ответ: $[7, 6, 6]$. Три строки — три числа.

</WorkedExample>

<Faded
  id="1-4-faded-matvec"
  title="Вычисли [[2, 0, 0], [0, 1, 1], [1, 0, 1]] · [1, 2, 3]"
  steps={[
    { text: 'Первая строка: 2·1 + 0·2 + 0·3 = ▢', answer: 2 },
    { text: 'Вторая строка: 0·1 + 1·2 + 1·3 = ▢', answer: 5 },
    { text: 'Третья строка: 1·1 + 0·2 + 1·3 = ▢', answer: 4 },
  ]}
/>

<Check
  id="1-4-check-shape"
  question="Матрица из 2 строк и 3 столбцов умножается на вектор из 3 чисел. Сколько чисел в результате?"
  answer={2}
  tolerance={0}
  explain="По одному числу на каждую строку. А длина вектора обязана совпадать с числом столбцов — иначе скалярное произведение не посчитать."
/>

<Check
  id="1-4-check-columns"
  question="Куда переходит ось X — вектор [1, 0, 0] — после умножения на матрицу M?"
  options={['В первый столбец M', 'В первую строку M', 'Остаётся на месте']}
  answer={0}
  feedback={['', 'Строки — это рецепты координат результата. А вот столбцы показывают, куда уезжают оси.', 'Только если M — единичная матрица. Нажми «повернуть на 90°» в сцене и посмотри на стрелку X′.']}
  explain="M·[1, 0, 0] берёт из каждой строки первое число — то есть первый столбец. Второй столбец — образ оси Y, третий — оси Z."
/>

<Sidenote>В статье 2017 года W_Q, W_K и W_V — матрицы 512×64: 512 чисел слова превращаются в 64. Операция ровно та же, только строк и столбцов больше.</Sidenote>

---

## Теперь в коде

У тебя уже есть `dot`. Матрица — это массив строк, и каждая строка — обычный вектор.

<CodeExercise id="matVec" />

---

<ExplainBack
  id="1-4-explain"
  prompt="Объясни, что делает матрица с вектором и почему результат — это набор скалярных произведений."
  reference="Матрица — таблица чисел, которая превращает один вектор в другой. Каждая строка матрицы — рецепт одной координаты результата: строка скалярно умножается на вектор, и получается одно число. Сколько строк — столько координат на выходе. Если смотреть на всё пространство, матрица двигает его целиком: оси переезжают в столбцы матрицы, а вместе с ними едут все стрелки."
  points={['каждая строка матрицы скалярно умножается на вектор', 'сколько строк — столько чисел в результате', 'столбцы матрицы — это новые места осей']}
/>

---

## Итог

<Summary
  points={[
    'Матрица превращает вектор в вектор; результат — скалярное произведение каждой строки на вектор.',
    'Число строк задаёт размер результата; длина вектора равна числу столбцов.',
    'Столбцы матрицы — куда переехали оси. В модуле 4 матрицы W_Q, W_K, W_V сделают из слова запрос, ключ и значение.',
  ]}
  cards={cards}
/>
```

Если сборка MDX споткнётся о `\\` внутри `bmatrix` (перенос строки в формуле), заменить формулу уровня «Алгебра» на три строки обычного текста с `$…$`: «Первая строка: $[1, 0, 2]\cdot[1, 2, 3] = 7$» и т. д. — смысл сохраняется.

- [ ] **Step 4: Контент-тесты и e2e-список**

`e2e/lesson-flow.spec.ts`: в `READY` добавить `'1-4-matrix'`.

Run: `npx vitest run content`
Expected: PASS — состав урока (1 Predict, 2 Check, Summary, Recall), карточки, термины, упражнение.

- [ ] **Step 5: Проверить урок в браузере**

`npm run dev`, открыть `/courses/attention/1-4-matrix`: формулы рендерятся (KaTeX), сцена работает, упражнение запускается и проходит с эталонным решением (вставить решение через «Показать решение» после трёх неудачных запусков или набрать вручную).

- [ ] **Step 6: Коммит**

```bash
git add content e2e/lesson-flow.spec.ts
git commit -m "feat(content): lesson 1.4 «Матрица превращает пространство» and the matVec exercise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Умножение матриц — `MatMulExplorer`, игра `ShapeGame`, упражнение `matMul`, урок 1.5

**Files:**
- Create: `components/viz/matrices/MatMulExplorer.tsx`, `components/lesson/gates/ShapeGame.tsx`, `components/lesson/gates/ShapeGame.test.tsx`, `content/attention/exercises/mat-mul.ts`, `content/attention/lessons/1-5-matmul.mdx`
- Modify: `components/viz/matrices/matrices.test.tsx`, `app/globals.css`, `mdx-components.tsx`, `content/attention/exercises/index.ts`, `content/attention/course.ts`, `content/glossary.ts`, `content/content.test.ts`, `e2e/lesson-flow.spec.ts`

**Interfaces:**
- Consumes: `matMul`, `transpose`, `dotBreakdown`, `formatNum`, `Observatory`, `useGate`, `seededShuffle`, `productShape`, `shapeOptions`, `IMPOSSIBLE`, `formatShape`, `plural`.
- Produces: `<MatMulExplorer a b aLabel? bLabel? rowLabels? colLabels? transposeB? caption? />` (DOM; ячейки результата — кнопки `строка i, столбец j: x`; `role="status"` с разложением); `<ShapeGame id rounds={{ a: Shape; b: Shape }[]} />` — ворота; упражнение `matMul` (helpers `['dot', 'transpose']`); термины `matrix-multiplication`, `transpose`; урок `1.5` готов; `ShapeGame` в `GATE_TAGS` контент-теста.

- [ ] **Step 1: Падающие тесты `MatMulExplorer` и `ShapeGame`**

Добавить в `components/viz/matrices/matrices.test.tsx` (импорт `MatMulExplorer` из `./MatMulExplorer`):

```tsx
describe('MatMulExplorer', () => {
  it('multiplies and explains a clicked cell as row · column', async () => {
    render(<MatMulExplorer a={[[1, 2], [3, 4]]} b={[[5, 6], [7, 8]]} />)
    expect(screen.getByRole('button', { name: 'строка 2, столбец 1: 43' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'строка 1, столбец 2: 22' }))
    expect(screen.getByRole('status')).toHaveTextContent('A[строка 1] · B[столбец 2] = 1·6 + 2·8 = 22')
    expect(screen.getByRole('button', { name: 'строка 1, столбец 2: 22' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('transposes the right matrix on request and labels rows and columns', () => {
    render(
      <MatMulExplorer
        a={[[1, 0, 1]]}
        b={[[1, 0, 1], [0, 1, 1]]}
        aLabel="Q"
        bLabel="K"
        transposeB
        rowLabels={['кот']}
        colLabels={['кот', 'забор']}
      />,
    )
    expect(screen.getByText('Q·Kᵀ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'строка 1, столбец 1: 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'строка 1, столбец 2: 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader', { name: 'забор' }).length).toBeGreaterThan(0)
  })
})
```

`components/lesson/gates/ShapeGame.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { ShapeGame, type ShapeRound } from './ShapeGame'

const rounds: ShapeRound[] = [
  { a: [2, 3], b: [3, 4] },
  { a: [2, 3], b: [2, 3] },
]

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('ShapeGame', () => {
  it('moves through the rounds and passes after the last correct answer', async () => {
    render(<ShapeGame id="sg" rounds={rounds} />)
    expect(screen.getByText(/Раунд 1 из 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    expect(screen.getByRole('status')).toHaveTextContent(/Не то/)
    expect(useProgress.getState().gates.sg).toMatchObject({ passed: false, attempts: 1 })
    await userEvent.click(screen.getByRole('button', { name: '2×4' }))
    expect(screen.getByText(/Раунд 2 из 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Перемножить нельзя' }))
    expect(useProgress.getState().gates.sg.passed).toBe(true)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.getByText('2×3 · 2×3 → Перемножить нельзя')).toBeInTheDocument()
  })

  it('offers the rule after two wrong answers and files it for review', async () => {
    render(<ShapeGame id="sg2" rounds={rounds} />)
    expect(screen.queryByRole('button', { name: 'Показать правило' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать правило' }))
    expect(useProgress.getState().gates.sg2).toMatchObject({ passed: true, revealed: true })
    expect(useProgress.getState().customCards['shape-game:sg2']).toMatchObject({ kind: 'flip' })
    expect(screen.getByText(/Правило:/)).toBeInTheDocument()
  })

  it('shows the finished view after a reload', () => {
    useProgress.getState().recordAttempt('sg3', true)
    render(<ShapeGame id="sg3" rounds={rounds} />)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2×4' })).toBeNull()
  })
})
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run components/viz/matrices components/lesson/gates/ShapeGame.test.tsx`
Expected: FAIL — модулей нет.

- [ ] **Step 3: `MatMulExplorer` и стили таблиц**

`components/viz/matrices/MatMulExplorer.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { matMul, transpose, type Mat } from '@/lib/math'
import { dotBreakdown, formatNum } from '@/lib/viz/vector-helpers'
import { Observatory } from '@/components/viz/stage/Observatory'

type Cell = [number, number]

function MatrixTable({
  name,
  m,
  rowLabels,
  colLabels,
  hotRow,
  hotCol,
  selected,
  onSelect,
}: {
  name: string
  m: Mat
  rowLabels?: string[]
  colLabels?: string[]
  hotRow?: number
  hotCol?: number
  selected?: Cell | null
  onSelect?: (i: number, j: number) => void
}) {
  return (
    <table className="mat-table">
      <caption className="mat-caption">{name}</caption>
      {colLabels && (
        <thead>
          <tr>
            {rowLabels && <td />}
            {colLabels.map((label) => (
              <th key={label} scope="col" className="mat-label">
                {label}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {m.map((row, i) => (
          <tr key={i}>
            {rowLabels && (
              <th scope="row" className="mat-label">
                {rowLabels[i]}
              </th>
            )}
            {row.map((x, j) => {
              const pressed = selected != null && selected[0] === i && selected[1] === j
              return (
                <td key={j} className="mat-cell" data-hot={hotRow === i || hotCol === j}>
                  {onSelect ? (
                    <button
                      type="button"
                      className="mat-cell-btn"
                      aria-pressed={pressed}
                      aria-label={`строка ${i + 1}, столбец ${j + 1}: ${formatNum(x)}`}
                      onClick={() => onSelect(i, j)}
                    >
                      {formatNum(x)}
                    </button>
                  ) : (
                    formatNum(x)
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A·B как три таблицы: клик по ячейке результата подсвечивает строку A и столбец B и раскладывает скалярное произведение. */
export function MatMulExplorer({
  a,
  b: b0,
  aLabel = 'A',
  bLabel = 'B',
  rowLabels,
  colLabels,
  transposeB = false,
  caption,
}: {
  a: Mat
  b: Mat
  aLabel?: string
  bLabel?: string
  /** Подписи строк A (и строк результата). */
  rowLabels?: string[]
  /** Подписи столбцов B после транспонирования, если оно включено (и столбцов результата). */
  colLabels?: string[]
  transposeB?: boolean
  caption?: ReactNode
}) {
  const b = transposeB ? transpose(b0) : b0
  const product = matMul(a, b)
  const [cell, setCell] = useState<Cell | null>(null)
  const bName = transposeB ? `${bLabel}ᵀ` : bLabel
  const row = cell ? a[cell[0]] : null
  const col = cell ? b.map((r) => r[cell[1]]) : null

  return (
    <Observatory
      wide
      caption={caption}
      footer={
        <p className="readout m-0" role="status">
          {cell && row && col
            ? `${aLabel}[строка ${cell[0] + 1}] · ${bName}[столбец ${cell[1] + 1}] = ${dotBreakdown(row, col)}`
            : 'Нажми на ячейку результата — увидишь, из какой строки и какого столбца она получилась.'}
        </p>
      }
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 p-4 font-mono text-[13px]">
        <MatrixTable name={aLabel} m={a} rowLabels={rowLabels} hotRow={cell?.[0]} />
        <span className="text-2xl text-space-muted" aria-hidden>
          ·
        </span>
        <MatrixTable name={bName} m={b} colLabels={colLabels} hotCol={cell?.[1]} />
        <span className="text-2xl text-space-muted" aria-hidden>
          =
        </span>
        <MatrixTable
          name={`${aLabel}·${bName}`}
          m={product}
          rowLabels={rowLabels}
          colLabels={colLabels}
          selected={cell}
          onSelect={(i, j) => setCell([i, j])}
        />
      </div>
    </Observatory>
  )
}
```

`app/globals.css`, в `@layer components` после блока обсерватории:

```css
  /* ── таблицы матриц (MatMulExplorer) ─────────── */
  .mat-table {
    @apply border-separate border-spacing-0.5 text-center;
  }
  .mat-caption {
    @apply mb-1 font-mono text-[11px] tracking-wider text-space-muted uppercase;
    caption-side: top;
  }
  .mat-label {
    @apply px-1.5 py-1 text-xs font-normal text-space-muted;
  }
  .mat-cell {
    @apply min-w-10 rounded border border-white/10 px-2 py-1 text-space-text transition;
  }
  .mat-cell[data-hot='true'] {
    @apply border-glow-cyan bg-glow-cyan/15 text-glow-cyan;
  }
  .mat-cell-btn {
    @apply block w-full rounded px-1 hover:text-glow-lime;
  }
  .mat-cell-btn[aria-pressed='true'] {
    @apply font-semibold text-glow-lime;
  }
```

- [ ] **Step 4: `ShapeGame`**

`components/lesson/gates/ShapeGame.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { plural } from '@/lib/plural'
import { seededShuffle } from '@/lib/progress/scheduler'
import { IMPOSSIBLE, formatShape, productShape, shapeOptions, type Shape } from '@/lib/viz/matrix-helpers'
import { useGate } from '@/components/lesson/engine/useGate'

export interface ShapeRound {
  a: Shape
  b: Shape
}

const RULE = 'Столбцов A должно быть столько же, сколько строк B. Результат: строк как у A, столбцов как у B.'

function correctAnswer(round: ShapeRound): string {
  const shape = productShape(round.a, round.b)
  return shape ? formatShape(shape) : IMPOSSIBLE
}

/** Игра «какие формы перемножаются»: раунд за раундом ученик называет форму A·B или говорит, что умножить нельзя. */
export function ShapeGame({ id, rounds }: { id: string; rounds: ShapeRound[] }) {
  const gate = useGate(id)
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const finished = gate.passed
  const current = rounds[Math.min(round, rounds.length - 1)]
  // порядок вариантов перемешан детерминированно: правильный ответ не стоит всегда первым
  const options = seededShuffle(shapeOptions(current.a, current.b), `${id}-${round}`)
  const answer = correctAnswer(current)
  const inner = current.a[1] === current.b[0]

  function choose(option: string) {
    if (finished) return
    if (option !== answer) {
      setWrong(option)
      gate.record(false)
      return
    }
    setWrong(null)
    if (round + 1 >= rounds.length) gate.record(true)
    else setRound(round + 1)
  }

  function showRule() {
    gate.reveal({
      id: `shape-game:${id}`,
      kind: 'flip',
      prompt: 'Когда две матрицы можно перемножить и какой формы получится результат?',
      answer: RULE,
    })
  }

  return (
    <div className="gate-card" data-gate="shape-game" data-passed={finished}>
      <p className="gate-label m-0">Игра · какие формы перемножаются</p>
      {!finished && (
        <>
          <p className="gate-question">
            Раунд {round + 1} из {rounds.length}: A — {formatShape(current.a)}, B — {formatShape(current.b)}. Какой формы A·B?
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Форма результата">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className="option-btn w-auto"
                data-selected={wrong === option}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div role="status">
            {wrong && (
              <p className="feedback-wrong">
                Не то. Внутренние размеры: у A {current.a[1]} {plural(current.a[1], ['столбец', 'столбца', 'столбцов'])}, у B{' '}
                {current.b[0]} {plural(current.b[0], ['строка', 'строки', 'строк'])}.{' '}
                {inner
                  ? 'Они совпали — значит, перемножить можно, а остаются внешние размеры.'
                  : 'Они не совпали — скалярному произведению строки на столбец не сойтись.'}
              </p>
            )}
          </div>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost mt-3" onClick={showRule}>
              Показать правило
            </button>
          )}
        </>
      )}
      {finished && (
        <div role="status" className="feedback-right">
          <p className="m-0">
            {gate.revealed ? `Правило: ${RULE} Этот вопрос вернётся к тебе на повторении.` : '✓ Все раунды пройдены!'}
          </p>
          <ul className="mt-2 mb-0 list-none p-0 font-mono text-[13px]">
            {rounds.map((r, i) => (
              <li key={i}>
                {formatShape(r.a)} · {formatShape(r.b)} → {correctAnswer(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

Зарегистрировать в `mdx-components.tsx`: `MatMulExplorer` (из `@/components/viz/matrices/MatMulExplorer`) и `ShapeGame` (из `@/components/lesson/gates/ShapeGame`). В `content/content.test.ts` добавить `'ShapeGame'` в `GATE_TAGS`.

- [ ] **Step 5: Запустить тесты компонентов**

Run: `npx vitest run components/viz/matrices components/lesson/gates/ShapeGame.test.tsx && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Упражнение `matMul`**

`content/attention/exercises/mat-mul.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'

export const matMulExercise: ExerciseDef = {
  id: 'matMul',
  title: 'Напиши matMul(a, b)',
  entry: 'matMul',
  prompt: 'Ячейка (i, j) результата — скалярное произведение строки i матрицы a на столбец j матрицы b. Доступны dot и transpose.',
  helpers: ['dot', 'transpose'],
  starter: `function matMul(a: number[][], b: number[][]): number[][] {
  // transpose(b) превращает столбцы b в строки — тогда каждая ячейка это dot(строка a, строка transpose(b)).
  return []
}
`,
  tests: [
    {
      name: '[[1, 2], [3, 4]]·[[5, 6], [7, 8]] = [[19, 22], [43, 50]]',
      args: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]],
      expected: [[19, 22], [43, 50]],
    },
    {
      name: 'единичная матрица не меняет матрицу',
      args: [[[1, 0], [0, 1]], [[2, 3], [4, 5]]],
      expected: [[2, 3], [4, 5]],
    },
    {
      name: '2×3 на 3×2 даёт 2×2',
      args: [[[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]],
      expected: [[58, 64], [139, 154]],
    },
    {
      name: 'строка на столбец — одно число: [[1, 2, 3]]·[[4], [5], [6]] = [[32]]',
      args: [[[1, 2, 3]], [[4], [5], [6]]],
      expected: [[32]],
    },
    {
      name: 'Q·Kᵀ для трёх слов — таблица похожестей',
      args: [[[1, 0, 1], [0, 1, 1], [0, 0, 0.5]], [[1, 0, 0], [0, 1, 0], [1, 1, 0.5]]],
      expected: [[2, 1, 0.5], [1, 2, 0.5], [0.5, 0.5, 0.25]],
    },
  ],
  hints: [
    'Сначала bt = transpose(b): теперь bt[j] — это j-й столбец b, записанный строкой.',
    'Строка i результата — это массив из dot(a[i], bt[j]) для каждого j: a.map((row) => bt.map((col) => dot(row, col))).',
    'Итого две строки: const bt = transpose(b); return a.map((row) => bt.map((col) => dot(row, col)))',
  ],
  solution: `function matMul(a: number[][], b: number[][]): number[][] {
  const bt = transpose(b)
  return a.map((row) => bt.map((col) => dot(row, col)))
}
`,
}
```

Добавить в `content/attention/exercises/index.ts`: `import { matMulExercise } from './mat-mul'` и `[matMulExercise.id]: matMulExercise,`.

Run: `npx vitest run content/attention/exercises` → PASS.

- [ ] **Step 7: Термины и статус урока**

`content/glossary.ts`, после `matrix-vector-product`:

```ts
  {
    id: 'matrix-multiplication',
    term: 'Умножение матриц',
    short: 'Ячейка (i, j) результата — скалярное произведение i-й строки левой матрицы на j-й столбец правой. Формы: (m×n)·(n×p) = m×p.',
    lessonId: '1.5',
  },
  {
    id: 'transpose',
    term: 'Транспонирование',
    short: 'Строки становятся столбцами, а столбцы — строками: таблицу «кладут на бок». Обозначение: Aᵀ.',
    lessonId: '1.5',
  },
```

`content/attention/course.ts`: `{ ...lesson('1.5', '1-5-matmul', 'Умножение матриц', 15), availability: 'ready' },`. `e2e/lesson-flow.spec.ts`: добавить `'1-5-matmul'` в `READY`.

- [ ] **Step 8: Урок 1.5**

Создать `content/attention/lessons/1-5-matmul.mdx`:

```mdx
export const metadata = {
  description: 'Как применить матрицу к десяти словам сразу и как получить скалярные произведения всех пар слов одной операцией. Умножение матриц и транспонирование — заготовка для Q·Kᵀ.',
  objectives: [
    'Понимать ячейку произведения матриц как «строка · столбец»',
    'Проверять, какие формы можно перемножить, и предсказывать форму результата',
    'Транспонировать матрицу и видеть, зачем это нужно вниманию',
  ],
}

export const cards = [
  {
    id: 'c-1-5-cell',
    kind: 'flip',
    prompt: 'Что стоит в ячейке (i, j) произведения A·B?',
    answer: 'Скалярное произведение i-й строки A на j-й столбец B.',
  },
  {
    id: 'c-1-5-shape',
    kind: 'choice',
    prompt: 'A — 2×3, B — 3×4. Какой формы A·B?',
    options: ['2×4', '3×3', 'Перемножить нельзя'],
    correct: 0,
    answer: '2×4: внутренние размеры (3 и 3) совпали и исчезли, остались внешние.',
  },
  {
    id: 'c-1-5-transpose',
    kind: 'flip',
    prompt: 'Что делает транспонирование и зачем оно в Q·Kᵀ?',
    answer: 'Кладёт таблицу на бок: строки становятся столбцами. Q·Kᵀ даёт таблицу скалярных произведений каждого запроса с каждым ключом.',
  },
]

<Recall id="1-5-recall" />

---

<Hook title="Все слова сразу">

Фраза про кота и забор — это десять слов, то есть десять стрелок. Применять матрицу к каждой по очереди — долго. Матрицы умеют обрабатывать **все стрелки одним умножением**. А заодно — считать скалярные произведения всех пар слов за один раз. Именно это делает внимание.

</Hook>

<Levels>
<Level title="История">

Та же машинка из прошлого урока, только в неё заталкивают сразу пачку стрелок — столбцы второй матрицы. Каждая проходит через все рецепты-строки первой. На выходе — пачка новых стрелок.

</Level>
<Level title="Геометрия">

Если столбцы матрицы X — это слова-стрелки, то M·X — те же слова после преобразования M. Всё пространство поехало, и слова поехали вместе с ним.

</Level>
<Level title="Алгебра">

Ячейка в строке i и столбце j результата — <Term id="dot-product">скалярное произведение</Term> i-й строки левой матрицы на j-й столбец правой:

$$
(A \cdot B)_{ij} = \text{строка}_i(A) \cdot \text{столбец}_j(B)
$$

</Level>
</Levels>

---

## Потрогай умножение

Слева — матрица из прошлого урока, справа — три слова столбиками. Нажми на любую ячейку результата: подсветятся строка и столбец, из которых она получилась.

<MatMulExplorer
  a={[[1, 0, 2], [0, 3, 0], [1, 1, 1]]}
  b={[[1, 0, 0], [0, 1, 0], [1, 1, 0.5]]}
  aLabel="M"
  bLabel="X"
  colLabels={['кот', 'забор', 'он']}
  caption="Каждый столбец результата — слово после преобразования M. Три слова за одно умножение матриц."
/>

<Check
  id="1-5-check-cell"
  question="В результате в строке 2 и столбце «забор» стоит 3. Как оно получилось?"
  options={['[0, 3, 0] · [0, 1, 1] — вторая строка M на столбец «забор»', 'Сложили вторую строку M', 'Перемножили длины двух векторов']}
  answer={0}
  explain="Строка 2 матрицы M — [0, 3, 0], столбец «забор» — [0, 1, 1]. Скалярное произведение: 0 + 3 + 0 = 3."
/>

---

## Какие формы перемножаются

<Predict id="1-5-predict-shape" question="A — 2 строки × 3 столбца, B — 3 × 4. Какой формы будет A·B?" options={['2×4', '3×3', 'Перемножить нельзя']} answer={0}>

2×4. Каждая строка A (их 2) скалярно умножается на каждый столбец B (их 4). Чтобы скалярное произведение сошлось, длина строки A (3) должна равняться длине столбца B (3). **Внутренние размеры совпадают и исчезают, внешние остаются.**

</Predict>

<ShapeGame id="1-5-shape-game" rounds={[{ a: [2, 3], b: [3, 4] }, { a: [3, 3], b: [3, 1] }, { a: [2, 3], b: [2, 3] }, { a: [4, 2], b: [2, 2] }, { a: [1, 3], b: [3, 1] }]} />

<Sidenote>Последний раунд — строка на столбец: 1×3 на 3×1 даёт 1×1, одно число. Это обычное скалярное произведение. Умножение матриц — его старший брат.</Sidenote>

---

## Считаем вручную

<WorkedExample title="Вычислим [[1, 2], [3, 4]] · [[5, 6], [7, 8]]">

Ячейка (1, 1): строка [1, 2] на столбец [5, 7] — $1\cdot5 + 2\cdot7 = 19$.

Ячейка (1, 2): строка [1, 2] на столбец [6, 8] — $1\cdot6 + 2\cdot8 = 22$.

Ячейка (2, 1): строка [3, 4] на столбец [5, 7] — $3\cdot5 + 4\cdot7 = 43$.

Ячейка (2, 2): строка [3, 4] на столбец [6, 8] — $3\cdot6 + 4\cdot8 = 50$.

Ответ: $[[19, 22], [43, 50]]$.

</WorkedExample>

<Faded
  id="1-5-faded-matmul"
  title="Вычисли [[1, 0], [2, 1]] · [[3, 1], [1, 2]]"
  steps={[
    { text: 'Ячейка (1, 1): [1, 0]·[3, 1] = 1·3 + 0·1 = ▢', answer: 3 },
    { text: 'Ячейка (1, 2): [1, 0]·[1, 2] = 1·1 + 0·2 = ▢', answer: 1 },
    { text: 'Ячейка (2, 1): [2, 1]·[3, 1] = 2·3 + 1·1 = ▢', answer: 7 },
    { text: 'Ячейка (2, 2): [2, 1]·[1, 2] = 2·1 + 1·2 = ▢', answer: 4 },
  ]}
/>

---

## Положить таблицу на бок

<Term id="transpose">Транспонирование</Term> меняет строки и столбцы местами: первая строка становится первым столбцом и так далее. Обозначается буквой T сверху: $A^T$. Матрица 2×3 превращается в 3×2.

$$
\begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{bmatrix}^T
=
\begin{bmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{bmatrix}
$$

Зачем? В статье слова лежат **строками**: матрица Q — запросы всех слов по строкам, K — ключи. Чтобы получить скалярное произведение каждого запроса с каждым ключом, нужно умножить строки Q на строки K. Но умножение матриц работает со **столбцами** правой матрицы. Транспонируем K — и строки стали столбцами:

<MatMulExplorer
  a={[[1, 0, 1], [0, 1, 1], [0, 0, 0.5]]}
  b={[[1, 0, 1], [0, 1, 1], [0, 0, 0.5]]}
  aLabel="Q"
  bLabel="K"
  transposeB
  rowLabels={['кот', 'забор', 'он']}
  colLabels={['кот', 'забор', 'он']}
  caption="Q·Kᵀ: в каждой ячейке — похожесть одного слова на другое. Эта таблица вернётся в уроке 4.2 как тепловая карта."
/>

<Check
  id="1-5-check-transpose"
  question="Матрица 2×3 транспонирована. Какой она стала формы?"
  options={['3×2', '2×3', '3×3']}
  answer={0}
  explain="Строки и столбцы меняются местами: было 2 строки и 3 столбца, стало 3 строки и 2 столбца."
/>

<Check
  id="1-5-check-qk"
  question="Что стоит в таблице Q·Kᵀ в строке «он» и столбце «забор»?"
  options={['Скалярное произведение запроса «он» на ключ «забор»', 'Сумма координат слова «он»', 'Произведение длин двух векторов']}
  answer={0}
  explain="Строка «он» матрицы Q умножается на столбец «забор» матрицы Kᵀ — а это строка «забор» матрицы K. Получается похожесть запроса на ключ: 0·0 + 0·1 + 0.5·1 = 0.5."
/>

---

## Теперь в коде

Подсказка: `transpose(b)` превращает столбцы b в строки, а дальше — `dot` на каждую пару.

<CodeExercise id="matMul" />

---

<ExplainBack
  id="1-5-explain"
  prompt="Объясни, почему A·B можно вычислить, только когда число столбцов A равно числу строк B, и какой формы получится результат."
  reference="Каждая ячейка результата — скалярное произведение строки A на столбец B. Длина строки A — это число столбцов A, длина столбца B — число строк B. Скалярное произведение считается только для векторов одной длины, поэтому эти два числа должны совпадать. Результат имеет столько строк, сколько у A, и столько столбцов, сколько у B: внутренние размеры исчезают, внешние остаются."
  points={['ячейка = строка A · столбец B', 'скалярное произведение требует одинаковой длины: столбцы A = строки B', 'форма результата: строки A × столбцы B']}
/>

---

## Итог

<Summary
  points={[
    'Ячейка (i, j) произведения A·B — скалярное произведение i-й строки A на j-й столбец B.',
    'Формы: (m×n)·(n×p) = m×p. Внутренние размеры должны совпасть.',
    'Транспонирование кладёт таблицу на бок. Q·Kᵀ — таблица похожести каждого запроса с каждым ключом.',
  ]}
  cards={cards}
/>
```

- [ ] **Step 9: Контент-тесты, браузер, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS (урок 1.5: 1 Predict, 3 Check, Summary, Recall; ворота уникальны; упражнение `matMul` существует).

В браузере (`/courses/attention/1-5-matmul`): таблицы подсвечиваются по клику, игра проходит пять раундов, упражнение проходит с эталоном.

```bash
git add components app/globals.css mdx-components.tsx content e2e/lesson-flow.spec.ts
git commit -m "feat(content): lesson 1.5 «Умножение матриц» with MatMulExplorer, the shape game and the matMul exercise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Softmax — `SoftmaxBars`, упражнение `softmax`, урок 1.6 «Экспонента и softmax»

**Files:**
- Create: `components/viz/softmax/SoftmaxBars.tsx`, `components/viz/softmax/softmax-bars.test.tsx`, `content/attention/exercises/softmax.ts`, `content/attention/lessons/1-6-softmax.mdx`
- Modify: `app/globals.css`, `mdx-components.tsx`, `content/attention/exercises/index.ts`, `content/attention/course.ts`, `content/glossary.ts`, `e2e/lesson-flow.spec.ts`

**Interfaces:**
- Consumes: `softmax` (Task 4), `NumberField` (Task 7), `Observatory`, `formatNum`.
- Produces: `<SoftmaxBars initial?: number[]; labels?: string[]; caption? />` (DOM: поля `оценка <имя>`, кнопки `+10 ко всем`, `сбросить`, ползунок `Температура`, абзац `softmax = […] · сумма = 1`); `SCORE_BOUND = 50`; упражнение `softmax` (helpers нет); термины `exponent`, `temperature`, обновлённый `softmax`; урок `1.6` готов.

- [ ] **Step 1: Падающие тесты `SoftmaxBars`**

`components/viz/softmax/softmax-bars.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SoftmaxBars } from './SoftmaxBars'

const readout = () => screen.getByText(/^softmax =/)

describe('SoftmaxBars', () => {
  it('turns scores into shares that sum to 1 and shows every stage', () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} labels={['забор', 'кот', 'через']} />)
    expect(readout()).toHaveTextContent('softmax = [0.66, 0.24, 0.1] · сумма = 1')
    expect(screen.getByText('66%')).toBeInTheDocument()
    expect(screen.getByText('7.39')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'оценка забор' })).toHaveValue('2')
  })

  it('does not change the shares when 10 is added to every score', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    await userEvent.click(screen.getByRole('button', { name: '+10 ко всем' }))
    expect(screen.getByRole('textbox', { name: 'оценка x1' })).toHaveValue('12')
    expect(readout()).toHaveTextContent('softmax = [0.66, 0.24, 0.1]')
  })

  it('sharpens with a lower temperature and survives huge scores without NaN', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Температура' }), { target: { value: '0.5' } })
    expect(readout()).toHaveTextContent('softmax = [0.86, 0.12, 0.02]')
    const field = screen.getByRole('textbox', { name: 'оценка x1' })
    await userEvent.clear(field)
    await userEvent.type(field, '1000{Enter}')
    expect(field).toHaveValue('50')
    expect(readout()).toHaveTextContent('softmax = [1, 0, 0]')
    expect(readout()).not.toHaveTextContent('NaN')
  })

  it('resets scores and temperature', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    await userEvent.click(screen.getByRole('button', { name: '+10 ко всем' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Температура' }), { target: { value: '3' } })
    await userEvent.click(screen.getByRole('button', { name: 'сбросить' }))
    expect(screen.getByRole('textbox', { name: 'оценка x1' })).toHaveValue('2')
    expect(screen.getByRole('slider', { name: 'Температура' })).toHaveValue('1')
  })
})
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run components/viz/softmax`
Expected: FAIL — модуля нет.

- [ ] **Step 3: `SoftmaxBars` и стили**

`components/viz/softmax/SoftmaxBars.tsx`:

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import { softmax } from '@/lib/math'
import { formatNum } from '@/lib/viz/vector-helpers'
import { NumberField } from '@/components/viz/stage/NumberField'
import { Observatory } from '@/components/viz/stage/Observatory'

/** Оценки держим в разумных пределах: при x/T > 709 eˣ уже Infinity, а сцена должна показывать числа, а не ошибки. */
export const SCORE_BOUND = 50
const MIN_TEMPERATURE = 0.2

const COLORS = { score: '#22d3ee', exp: '#fb923c', share: '#a3e635', negative: '#fb7185' }

/** Экспоненты быстро растут: от 10 000 показываем их в экспоненциальной записи. */
function formatExp(x: number): string {
  return x >= 10000 ? x.toExponential(2) : formatNum(x)
}

function BarColumn({
  title,
  names,
  values,
  max,
  format,
  color,
  signed,
}: {
  title: string
  names: string[]
  values: number[]
  max: number
  format: (x: number) => string
  color: string
  /** Отрицательные значения рисуются другим цветом (только у оценок). */
  signed?: boolean
}) {
  return (
    <div>
      <p className="m-0 mb-2 font-mono text-[11px] tracking-wider text-space-muted uppercase">{title}</p>
      <ul className="m-0 list-none space-y-1.5 p-0">
        {values.map((x, i) => (
          <li key={i} className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2">
            <span className="truncate text-space-muted">{names[i]}</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${max === 0 ? 0 : Math.min(100, (Math.abs(x) / max) * 100)}%`,
                  backgroundColor: signed && x < 0 ? COLORS.negative : color,
                }}
              />
            </span>
            <span className="text-right text-space-text">{format(x)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Оценки → экспоненты → доли: три колонки столбиков, живые поля оценок, ползунок температуры. */
export function SoftmaxBars({
  initial = [2, 1, 0.1],
  labels,
  caption,
}: {
  initial?: number[]
  labels?: string[]
  caption?: ReactNode
}) {
  const [scores, setScores] = useState<number[]>(initial)
  const [temperature, setTemperature] = useState(1)
  const names = scores.map((_, i) => labels?.[i] ?? `x${i + 1}`)
  const exps = scores.map((x) => Math.exp(x / temperature))
  const shares = softmax(scores, temperature)
  const total = shares.reduce((s, x) => s + x, 0)

  return (
    <Observatory
      caption={caption}
      footer={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span className="text-space-muted">оценки:</span>
            {scores.map((x, i) => (
              <NumberField
                key={i}
                value={x}
                bound={SCORE_BOUND}
                label={`оценка ${names[i]}`}
                onCommit={(n) => setScores(scores.map((y, j) => (j === i ? n : y)))}
              />
            ))}
            <button
              type="button"
              className="stage-chip"
              onClick={() => setScores(scores.map((x) => Math.min(SCORE_BOUND, x + 10)))}
            >
              +10 ко всем
            </button>
            <button
              type="button"
              className="stage-chip"
              onClick={() => {
                setScores(initial)
                setTemperature(1)
              }}
            >
              сбросить
            </button>
          </div>
          <label className="flex flex-wrap items-center gap-3 font-mono text-sm">
            температура T = {formatNum(temperature)}
            <input
              type="range"
              min={MIN_TEMPERATURE}
              max={5}
              step={0.1}
              value={temperature}
              aria-label="Температура"
              className="accent-[#a3e635]"
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </label>
          <p className="readout">
            softmax = [{shares.map(formatNum).join(', ')}] · сумма = {formatNum(total)}
          </p>
        </div>
      }
    >
      <div className="grid gap-5 p-5 font-mono text-xs sm:grid-cols-3">
        <BarColumn
          title="1 · оценки x"
          names={names}
          values={scores}
          max={Math.max(1, ...scores.map(Math.abs))}
          format={formatNum}
          color={COLORS.score}
          signed
        />
        <BarColumn
          title={temperature === 1 ? '2 · eˣ' : '2 · e^(x/T)'}
          names={names}
          values={exps}
          max={Math.max(...exps)}
          format={formatExp}
          color={COLORS.exp}
        />
        <BarColumn
          title="3 · доли: eˣ / сумма"
          names={names}
          values={shares}
          max={1}
          format={(x) => `${Math.round(x * 100)}%`}
          color={COLORS.share}
        />
      </div>
    </Observatory>
  )
}
```

`app/globals.css`, после стилей таблиц матриц:

```css
  /* ── столбики softmax ────────────────────────── */
  .bar-track {
    @apply block h-3 w-full overflow-hidden rounded bg-white/5;
  }
  .bar-fill {
    @apply block h-full rounded transition-[width] duration-300;
  }
```

Зарегистрировать `SoftmaxBars` в `mdx-components.tsx` (из `@/components/viz/softmax/SoftmaxBars`).

- [ ] **Step 4: Запустить — проходят**

Run: `npx vitest run components/viz/softmax && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Упражнение `softmax`**

`content/attention/exercises/softmax.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'

export const softmaxExercise: ExerciseDef = {
  id: 'softmax',
  title: 'Напиши softmax(xs)',
  entry: 'softmax',
  prompt: 'Любые оценки → доли, которые в сумме дают 1: возведи e в каждую оценку и раздели на сумму. И не забудь про большие числа.',
  starter: `function softmax(xs: number[]): number[] {
  // 1) exps — e в степени каждой оценки (Math.exp)
  // 2) total — сумма exps
  // 3) верни exps, делённые на total
  return []
}
`,
  tests: [
    { name: 'softmax([0, 0]) = [0.5, 0.5]', args: [[0, 0]], expected: [0.5, 0.5] },
    {
      name: 'softmax([2, 1, 0]) ≈ [0.665, 0.245, 0.090]',
      args: [[2, 1, 0]],
      expected: [0.66524, 0.24473, 0.09003],
      tolerance: 1e-3,
    },
    {
      name: 'сдвиг не меняет ответ: softmax([11, 12, 13]) = softmax([1, 2, 3])',
      args: [[11, 12, 13]],
      expected: [0.09003, 0.24473, 0.66524],
      tolerance: 1e-3,
    },
    {
      name: 'большие оценки: softmax([1000, 1001]) ≈ [0.269, 0.731]',
      args: [[1000, 1001]],
      expected: [0.26894, 0.73106],
      tolerance: 1e-3,
    },
    {
      name: 'отрицательные оценки тоже годятся: softmax([−1, −1, −1]) = [⅓, ⅓, ⅓]',
      args: [[-1, -1, -1]],
      expected: [1 / 3, 1 / 3, 1 / 3],
      tolerance: 1e-3,
    },
    { name: 'пустой список → пустой список', args: [[]], expected: [] },
  ],
  hints: [
    'Math.exp(x) — это eˣ. Начни с const exps = xs.map((x) => Math.exp(x)).',
    'Сумма: const total = exps.reduce((s, x) => s + x, 0). Доли: exps.map((e) => e / total).',
    'Тест [1000, 1001] падает, потому что Math.exp(1000) = Infinity, а Infinity / Infinity = NaN. Вычти из всех оценок максимум (Math.max(...xs)) перед экспонентой — ответ не изменится (как «+10 ко всем»), а переполнения не будет.',
  ],
  solution: `function softmax(xs: number[]): number[] {
  if (xs.length === 0) return []
  const max = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - max))
  const total = exps.reduce((s, x) => s + x, 0)
  return exps.map((e) => e / total)
}
`,
}
```

Добавить в `content/attention/exercises/index.ts`: `import { softmaxExercise } from './softmax'` и `[softmaxExercise.id]: softmaxExercise,`.

Run: `npx vitest run content/attention/exercises` → PASS. Дополнительно убедиться, что **наивное** решение без вычитания максимума проваливает ровно тест `[1000, 1001]`: временно подставить его как `solution`, увидеть один ✗, вернуть эталон.

- [ ] **Step 6: Термины и статус урока**

`content/glossary.ts`: у `softmax` заменить `short` на `'Превращает любые оценки в доли, которые в сумме дают 1: eˣ для каждой оценки, делённое на сумму всех eˣ.'`; после `softmax` добавить:

```ts
  {
    id: 'exponent',
    term: 'Экспонента',
    short: 'eˣ, где e ≈ 2.718. Всегда положительна и быстро растёт; e⁰ = 1, e¹ ≈ 2.72, e⁻¹ ≈ 0.37.',
    lessonId: '1.6',
  },
  {
    id: 'temperature',
    term: 'Температура',
    short: 'Число T, на которое делят оценки перед softmax: меньше T — доли острее, больше T — ровнее.',
    lessonId: '1.6',
  },
```

`content/attention/course.ts`: `{ ...lesson('1.6', '1-6-softmax', 'Экспонента и softmax', 15), availability: 'ready' },`. `e2e/lesson-flow.spec.ts`: добавить `'1-6-softmax'` в `READY`.

- [ ] **Step 7: Урок 1.6**

Создать `content/attention/lessons/1-6-softmax.mdx`:

```mdx
export const metadata = {
  description: 'Как превратить любые оценки в доли, которые в сумме дают единицу. Экспонента, softmax и температура — последний кирпичик перед формулой внимания.',
  objectives: [
    'Понимать, что делает экспонента и почему она всегда положительна',
    'Считать softmax вручную и в коде, не ломаясь на больших числах',
    'Предсказывать, как сдвиг оценок и температура меняют доли',
  ],
}

export const cards = [
  {
    id: 'c-1-6-formula',
    kind: 'flip',
    prompt: 'Как посчитать softmax для оценок x₁…xₙ?',
    answer: 'Возвести e в каждую оценку и разделить каждое eˣ на сумму всех eˣ. Доли положительны и в сумме дают 1.',
  },
  {
    id: 'c-1-6-shift',
    kind: 'choice',
    prompt: 'Ко всем оценкам прибавили 10. Что станет с softmax?',
    options: ['Не изменится', 'Все доли вырастут', 'Лидер получит ещё больше'],
    correct: 0,
    answer: 'Не изменится: e^(x+10) = e¹⁰ · eˣ, общий множитель сокращается при делении на сумму.',
  },
  {
    id: 'c-1-6-temperature',
    kind: 'flip',
    prompt: 'Что делает температура в softmax?',
    answer: 'Оценки делятся на T. Маленькая T делает доли острее (лидер забирает почти всё), большая — ровнее.',
  },
]

<Recall id="1-6-recall" />

---

<Hook title="Из оценок — в доли">

Внимание сначала выставляет оценки: насколько «он» похож на «забор», на «кота», на остальные слова. Получаются числа вроде 4.2, 1.1 и −0.3. Но смешивать слова (помнишь <Term id="weighted-sum">взвешенную сумму</Term>?) нужно с весами, которые **положительны и в сумме дают 1** — как доли пирога. Функция, которая делает это из любых чисел, называется <Term id="softmax">softmax</Term>.

</Hook>

<Levels>
<Level title="История">

Голосование, где каждый кандидат получает долю пирога по громкости поддержки. Чем громче — тем больше кусок, причём непропорционально: громкий получает намного больше тихого. Но даже самый тихий получает хотя бы крошку — ноль не достаётся никому.

</Level>
<Level title="Геометрия">

Три столбика. Сначала <Term id="exponent">экспонента</Term> делает все столбики положительными и растягивает разницу: большие становятся гораздо больше. Потом каждый столбик делим на сумму всех — и высоты складываются ровно в 1.

</Level>
<Level title="Алгебра">

$$
\text{softmax}(x)_i = \frac{e^{x_i}}{\sum_j e^{x_j}}
$$

где $e \approx 2.718$. Числитель — экспонента своей оценки, знаменатель — сумма экспонент всех оценок.

</Level>
</Levels>

---

## Экспонента

$e^x$ — это число $e \approx 2.718$ в степени x. Три факта, которых хватит на весь курс:

- $e^0 = 1$, $e^1 \approx 2.72$, $e^2 \approx 7.39$, $e^3 \approx 20.1$ — растёт очень быстро;
- $e^{-1} \approx 0.37$, $e^{-2} \approx 0.14$ — для отрицательных x получается маленькое, но **положительное** число;
- $e^{a+b} = e^a \cdot e^b$ — степени складываются, экспоненты перемножаются.

<Check
  id="1-6-check-exp-zero"
  question="Чему равно e⁰?"
  answer={1}
  tolerance={0}
  explain="Любое число в нулевой степени — единица. Поэтому оценка 0 до деления на сумму «весит» ровно 1."
/>

<Check
  id="1-6-check-exp-sign"
  question="Что верно про eˣ для любого x?"
  options={['Всегда положительно', 'Может быть отрицательным при отрицательном x', 'Равно нулю при x = 0']}
  answer={0}
  feedback={['', 'e⁻¹ ≈ 0.37 — маленькое, но положительное. Экспонента никогда не опускается до нуля.', 'e⁰ = 1, а не 0.']}
  explain="Именно поэтому softmax никогда не даёт отрицательных долей и нулей: экспонента всегда больше нуля."
/>

---

## Потрогай softmax

Меняй оценки в полях и следи за тремя колонками: оценки → экспоненты → доли. Ползунок температуры — ниже, до него дойдём чуть позже.

<SoftmaxBars initial={[2, 1, 0.1]} labels={['забор', 'кот', 'через']} caption="Три слова, на которые смотрит «он»: оценки превращаются в доли внимания." />

<Predict id="1-6-predict-shift" question="Прибавим 10 ко всем оценкам. Что станет с долями softmax?" options={['Не изменятся', 'Все доли вырастут', 'Самая большая доля станет ещё больше']} answer={0}>

Не изменятся. $e^{x+10} = e^{10} \cdot e^{x}$: у каждой экспоненты появляется один и тот же множитель $e^{10}$, а при делении на сумму он сокращается. Нажми «+10 ко всем» в сцене — доли останутся прежними. Это свойство ещё спасёт тебя в коде.

</Predict>

---

## Считаем вручную

<WorkedExample title="softmax([2, 1, 0])">

Экспоненты: $e^2 \approx 7.39$, $e^1 \approx 2.72$, $e^0 = 1$.

Сумма: $7.39 + 2.72 + 1 = 11.11$.

Доли: $7.39 / 11.11 \approx 0.665$, $2.72 / 11.11 \approx 0.245$, $1 / 11.11 \approx 0.090$.

Проверка: $0.665 + 0.245 + 0.090 = 1$. Лидер с оценкой 2 забрал две трети.

</WorkedExample>

<Faded
  id="1-6-faded-softmax"
  title="softmax([1, 0])"
  steps={[
    { text: 'Экспоненты: e¹ ≈ 2.72, e⁰ = ▢', answer: 1 },
    { text: 'Сумма: 2.72 + 1 = ▢', answer: 3.72, tolerance: 0.01 },
    { text: 'Первая доля: 2.72 / 3.72 ≈ ▢ (с точностью до сотых)', answer: 0.73, tolerance: 0.01 },
    { text: 'Вторая доля: 1 − 0.73 = ▢', answer: 0.27, tolerance: 0.01 },
  ]}
/>

---

## Температура

Перед экспонентой оценки можно разделить на число T — <Term id="temperature">температуру</Term>. Маленькая T (например, 0.5) увеличивает разрывы между оценками: лидер забирает почти всё. Большая T (например, 5) сглаживает: доли выравниваются. Подвигай ползунок в сцене выше.

<Check
  id="1-6-check-temperature"
  question="Температуру уменьшили с 1 до 0.5. Что стало с долями?"
  options={['Острее: лидер получил ещё больше', 'Ровнее: доли сблизились', 'Ничего не изменилось']}
  answer={0}
  explain="Деление на 0.5 удваивает все оценки, а значит и разрывы между ними. Экспонента превращает большой разрыв в огромный."
/>

<Sidenote>«Температура» в настройках ChatGPT — ровно эта T. В уроке 8.2 ты увидишь, как она управляет случайностью ответов.</Sidenote>

---

## Почему компьютер вычитает максимум

Попробуй посчитать $e^{1000}$: это число с 435 знаками, и компьютер вместо него выдаёт `Infinity`. А `Infinity / Infinity` — это `NaN`, «не число». Внимание в больших моделях работает с большими оценками, так что проблема реальная.

Спасает свойство из предсказания выше: сдвиг всех оценок не меняет softmax. Вычти из всех оценок **максимум** — самая большая станет нулём, остальные отрицательными, и все экспоненты окажутся между 0 и 1. Ответ тот же, переполнения нет.

<CodeExercise id="softmax" />

---

<ExplainBack
  id="1-6-explain"
  prompt="Объясни, зачем в softmax нужна экспонента и зачем деление на сумму."
  reference="Экспонента делает любые оценки положительными (даже отрицательные) и усиливает разрывы: большая оценка становится намного больше маленькой. Деление на сумму превращает числа в доли: они положительны и складываются ровно в 1, как веса для смешивания векторов. Сдвиг всех оценок на одно число ничего не меняет, поэтому перед экспонентой можно вычесть максимум и не бояться переполнения."
  points={['экспонента: всё положительно, большие оценки усиливаются', 'деление на сумму: доли складываются в 1', 'сдвиг оценок не меняет результат — отсюда вычитание максимума']}
/>

---

## Итог

<Summary
  points={[
    'softmax(x)ᵢ = e^xᵢ / Σ e^xⱼ: экспонента каждой оценки, делённая на сумму экспонент.',
    'Доли положительны и в сумме дают 1; сдвиг всех оценок их не меняет.',
    'Температура делит оценки: меньше T — острее, больше T — ровнее. Вычитание максимума спасает от переполнения.',
  ]}
  cards={cards}
/>
```

- [ ] **Step 8: Контент-тесты, браузер, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

В браузере (`/courses/attention/1-6-softmax`): столбики меняются, «+10 ко всем» не меняет доли, температура работает, упражнение: наивное решение проваливает тест `[1000, 1001]`, после третьей подсказки проходит.

```bash
git add components/viz/softmax app/globals.css mdx-components.tsx content e2e/lesson-flow.spec.ts
git commit -m "feat(content): lesson 1.6 «Экспонента и softmax» with SoftmaxBars and the softmax exercise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Урок 1.P «Смешанная практика» и упражнение-босс `similarity`

**Files:**
- Create: `content/attention/exercises/similarity.ts`, `content/attention/lessons/1-p-practice.mdx`
- Modify: `content/attention/exercises/index.ts`, `content/attention/course.ts`, `e2e/lesson-flow.spec.ts`

**Interfaces:**
- Consumes: `HelperName 'dot' | 'softmax'`, `<VectorTask>`, `<Faded>`, `<Check>`, `<CodeExercise>`.
- Produces: упражнение `similarity(query: number[], vectors: number[][]): number[]` = `softmax(dot(query, vᵢ))`; урок `1.P` (`kind: 'practice'`) готов.

- [ ] **Step 1: Упражнение `similarity`**

`content/attention/exercises/similarity.ts`:

```ts
import type { ExerciseDef } from '@/lib/code/types'

export const similarityExercise: ExerciseDef = {
  id: 'similarity',
  title: 'Напиши similarity(query, vectors)',
  entry: 'similarity',
  prompt: 'Насколько слово-запрос похоже на каждое из слов: скалярные произведения → softmax. Получатся доли, которые в сумме дают 1 — почти настоящие веса внимания.',
  helpers: ['dot', 'softmax'],
  starter: `function similarity(query: number[], vectors: number[][]): number[] {
  // 1) оценки: dot(query, v) для каждого v из vectors
  // 2) softmax превращает оценки в доли
  return []
}
`,
  tests: [
    {
      name: '«кот» среди [кот, забор, он]: оценки 2, 1, 0.5 → доли ≈ [0.63, 0.23, 0.14]',
      args: [[1, 0, 1], [[1, 0, 1], [0, 1, 1], [0, 0, 0.5]]],
      expected: [0.62853, 0.23122, 0.14025],
      tolerance: 1e-3,
    },
    {
      name: 'запрос перпендикулярен всем словам — доли равны',
      args: [[0, 0, 1], [[1, 0, 0], [0, 1, 0]]],
      expected: [0.5, 0.5],
    },
    {
      name: 'одно слово намного ближе остальных — оно получает почти всё',
      args: [[3, 0, 0], [[3, 0, 0], [0, 3, 0]]],
      expected: [0.99988, 0.00012],
      tolerance: 1e-3,
    },
    { name: 'нет слов — нет долей', args: [[1, 2, 3], []], expected: [] },
  ],
  hints: [
    'Оценки — это массив: vectors.map((v) => dot(query, v)).',
    'softmax уже умеет превращать массив оценок в доли: softmax(оценки).',
    'Итого одна строка: return softmax(vectors.map((v) => dot(query, v)))',
  ],
  solution: `function similarity(query: number[], vectors: number[][]): number[] {
  return softmax(vectors.map((v) => dot(query, v)))
}
`,
}
```

Добавить в `content/attention/exercises/index.ts`: `import { similarityExercise } from './similarity'` и `[similarityExercise.id]: similarityExercise,`.

Run: `npx vitest run content/attention/exercises` → PASS.

- [ ] **Step 2: Статус урока и e2e-список**

`content/attention/course.ts`: `{ ...lesson('1.P', '1-p-practice', 'Смешанная практика', 12, 'practice'), availability: 'ready' },`. `e2e/lesson-flow.spec.ts`: добавить `'1-p-practice'` в `READY`.

- [ ] **Step 3: Урок 1.P**

Создать `content/attention/lessons/1-p-practice.mdx`:

```mdx
export const metadata = {
  description: 'Задачи из модулей 0–1 вперемешку: векторы, скалярное произведение, матрицы и softmax. В конце — задача-босс: найти самое похожее слово так, как это делает внимание.',
  objectives: [
    'Переключаться между темами: узнавать, какая операция нужна',
    'Соединить dot и softmax в одну цепочку — почти внимание',
  ],
}

export const cards = [
  {
    id: 'c-1-p-pipeline',
    kind: 'flip',
    prompt: 'Как найти слово, самое похожее на запрос, «по-модельному»?',
    answer: 'Скалярное произведение запроса с каждым словом → softmax → самая большая доля.',
  },
  {
    id: 'c-1-p-which-op',
    kind: 'choice',
    prompt: 'Нужно смешать векторы слов с весами, которые дают в сумме 1. Какая пара операций?',
    options: ['softmax + взвешенная сумма', 'транспонирование + длина вектора', 'умножение матриц + косинус'],
    correct: 0,
    answer: 'softmax делает веса, взвешенная сумма смешивает векторы.',
  },
]

<Recall id="1-p-recall" />

---

## Вперемешку

Задачи ниже перемешаны намеренно: когда темы идут вперемешку, сначала приходится **узнать**, какая операция нужна, и только потом считать. Так знания закрепляются прочнее, чем при решении десяти одинаковых примеров подряд.

<Check
  id="1-p-check-dot"
  question="Чему равно [1, 2, 3] · [1, 1, 1]?"
  answer={6}
  tolerance={0}
  explain="1 + 2 + 3 = 6. Скалярное произведение на вектор из единиц — просто сумма координат."
/>

<Check
  id="1-p-check-shape"
  question="Матрица 3×2 умножается на матрицу 2×5. Какой формы результат?"
  options={['3×5', '2×2', 'Перемножить нельзя']}
  answer={0}
  explain="Внутренние размеры 2 и 2 совпали и исчезли; остались 3 строки и 5 столбцов."
/>

<Faded
  id="1-p-faded-matvec"
  title="Вычисли [[1, 1, 0], [0, 2, 0], [1, 0, 1]] · [2, 1, 3]"
  steps={[
    { text: 'Первая строка: 1·2 + 1·1 + 0·3 = ▢', answer: 3 },
    { text: 'Вторая строка: 0·2 + 2·1 + 0·3 = ▢', answer: 2 },
    { text: 'Третья строка: 1·2 + 0·1 + 1·3 = ▢', answer: 5 },
  ]}
/>

---

## Ещё немного

<Check
  id="1-p-check-softmax-equal"
  question="softmax([0, 0, 0]) — какая доля у первого элемента? (с точностью до сотых)"
  answer={0.33}
  tolerance={0.01}
  explain="Все оценки равны, значит все экспоненты равны 1 и каждая доля — 1/3."
/>

<Check
  id="1-p-check-length"
  question="Какая длина у вектора [2, 3, 6]?"
  answer={7}
  tolerance={0}
  explain="√(4 + 9 + 36) = √49 = 7."
/>

<VectorTask id="1-p-task-vector" target={[1, -1, 2]} start={[0, 0, 0]} />

<Check
  id="1-p-check-cosine"
  question="Косинусная похожесть векторов [1, 0, 0] и [0, 3, 0]?"
  answer={0}
  tolerance={0}
  explain="Стрелки перпендикулярны: скалярное произведение 0, значит и косинус 0. Длины на косинусную похожесть не влияют."
/>

<Check
  id="1-p-check-transpose"
  question="Чему равна ячейка (1, 2) матрицы [[1, 2, 3], [4, 5, 6]]ᵀ?"
  answer={4}
  tolerance={0}
  explain="После транспонирования строка 1 — это бывший столбец 1: [1, 4]. Её второй элемент — 4."
/>

---

## Задача-босс: самое похожее слово

Запрос — вектор слова, а вокруг — слова-кандидаты. Нужно сделать то, что делает внимание на первом шаге: посчитать <Term id="dot-product">скалярное произведение</Term> запроса с каждым кандидатом, а потом превратить оценки в доли с помощью <Term id="softmax">softmax</Term>. У тебя уже есть обе функции.

<CodeExercise id="similarity" />

<Check
  id="1-p-check-boss"
  question="Запрос [1, 0, 1], кандидаты: кот [1, 0, 1], забор [0, 1, 1], он [0, 0, 0.5]. Кто получит наибольшую долю?"
  options={['кот', 'забор', 'он']}
  answer={0}
  explain="Оценки: кот — 2, забор — 1, он — 0.5. Softmax сохраняет порядок, так что кот получает около 63%."
/>

<Sidenote>До настоящего внимания осталось два шага: деление оценок на √dₖ и взвешенная сумма значений. Оба уже знакомы — модуль 3 просто соберёт их вместе.</Sidenote>

---

## Итог

<Summary
  points={[
    'Модуль 1 собран: векторы, скалярное произведение, матрицы, умножение матриц, транспонирование, softmax.',
    'Цепочка «скалярные произведения → softmax» — первый шаг внимания; осталось добавить √dₖ и взвешенную сумму.',
  ]}
  cards={cards}
/>
```

- [ ] **Step 4: Контент-тесты, браузер, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS (практика: 8 Check + 1 Faded + 1 CodeExercise ≥ 3; Summary; Recall; 2 карточки).

В браузере (`/courses/attention/1-p-practice`): урок проходится до «Завершить урок», `/courses/attention` показывает модуль 1 полностью пройденным (7/7).

```bash
git add content e2e/lesson-flow.spec.ts
git commit -m "feat(content): lesson 1.P «Смешанная практика» with the similarity boss exercise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Волна полировки — доступность ворот, игра после перезагрузки, `useHydrated`, резервная копия

**Files:**
- Create: `components/review/BackupPanel.tsx`, `components/review/BackupPanel.test.tsx`
- Modify: `components/lesson/blocks/Levels.tsx`, `components/lesson/gates/Check.tsx`, `components/lesson/gates/Faded.tsx`, `components/lesson/gates/ExplainBack.tsx`, `components/lesson/gates/NextWordGame.tsx`, `lib/progress/useHydrated.ts`, `lib/progress/storage.ts`, `lib/progress/store.ts`, `app/review/page.tsx`
- Test: `components/lesson/blocks/content-blocks.test.tsx`, `components/lesson/gates/gates.test.tsx`, `components/lesson/gates/NextWordGame.test.tsx`, `lib/progress/store.test.ts`

**Interfaces:**
- Produces: `readBackup(): string | null` (storage); `restoreBackup(): boolean` (store) — принимает запись zustand `{ version, state }` v1/v2 или сырой экспорт; `<BackupPanel />`; `Levels` с roving tabindex и стрелками; `Check` помечает верный вариант `aria-checked` после перезагрузки и не реагирует на Enter в пустом поле; `ExplainBack` держит «Готово» недоступной при коротком тексте; `NextWordGame` после перезагрузки показывает ответы.

- [ ] **Step 1: Падающие тесты**

В `components/lesson/blocks/content-blocks.test.tsx`, `describe('Levels')`:

```ts
  it('moves between levels with the arrow keys (roving tabindex)', async () => {
    render(
      <Levels>
        <Level title="История"><p>сказка</p></Level>
        <Level title="Геометрия"><p>картинка</p></Level>
        <Level title="Алгебра"><p>формула</p></Level>
      </Levels>,
    )
    const first = screen.getByRole('tab', { name: 'История' })
    expect(first).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Алгебра' })).toHaveAttribute('tabindex', '-1')
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Геометрия' })).toHaveFocus()
    expect(screen.getByText('картинка')).toBeVisible()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Алгебра' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'История' })).toHaveFocus()
  })
```

В `components/lesson/gates/gates.test.tsx`:

```ts
describe('Check polish', () => {
  it('marks the right option as checked after a reload', () => {
    useProgress.getState().recordAttempt('q7', true)
    render(<Check id="q7" question="2 + 2?" options={['3', '4']} answer={1} />)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'false')
  })

  it('ignores Enter in an empty field instead of complaining', async () => {
    render(<Check id="q8" question="Сколько?" answer={2} />)
    const field = screen.getByRole('textbox', { name: 'Твой ответ' })
    field.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByText(/Введи число/)).toBeNull()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})

describe('ExplainBack polish', () => {
  it('disables «Готово» again if the explanation is erased below the minimum', async () => {
    render(<ExplainBack id="e2" prompt="Объясни" reference={<span>Эталон</span>} points={['пункт']} />)
    const area = screen.getByRole('textbox', { name: 'Твоё объяснение' })
    await userEvent.type(area, 'Достаточно длинное объяснение для сравнения')
    await userEvent.click(screen.getByRole('button', { name: 'Сравнить с эталоном' }))
    const done = screen.getByRole('button', { name: 'Готово, я сравнил' })
    expect(done).toBeEnabled()
    await userEvent.clear(area)
    expect(done).toBeDisabled()
  })
})
```

В `components/lesson/gates/NextWordGame.test.tsx`:

```ts
  it('shows the best answers and notes for a game passed before a reload', () => {
    useProgress.getState().passGate('nw2')
    render(
      <NextWordGame
        id="nw2"
        rounds={[{ context: 'Я пью горячий…', options: ['чай', 'снег'], answers: [0], note: 'Напиток.' }]}
      />,
    )
    expect(screen.getByRole('button', { name: 'чай' })).toHaveAttribute('data-right', 'true')
    expect(screen.getByText(/✓ Напиток\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'снег' })).toHaveAttribute('aria-disabled', 'true')
  })
```

В `lib/progress/store.test.ts`, в `describe('migration to schema v2…')`:

```ts
  it('restores a v1 backup envelope and rejects a broken one', () => {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ version: 1, state: v1 }))
    expect(s().restoreBackup()).toBe(true)
    expect(s().lessons['attention/0.1'].status).toBe('completed')
    localStorage.setItem(BACKUP_KEY, '{oops')
    expect(s().restoreBackup()).toBe(false)
    localStorage.removeItem(BACKUP_KEY)
    expect(s().restoreBackup()).toBe(false)
  })
```

`components/review/BackupPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { BACKUP_KEY } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'
import { BackupPanel } from './BackupPanel'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('BackupPanel', () => {
  it('renders nothing when there is no backup', () => {
    const { container } = render(<BackupPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('restores a v1 backup under the attention course', async () => {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ version: 1, state: { lessons: { '0.1': { status: 'completed', unlockedStep: 3 } } } }),
    )
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(useProgress.getState().lessons['attention/0.1'].status).toBe('completed')
    expect(screen.getByRole('status')).toHaveTextContent(/восстановлена/)
  })

  it('reports a broken backup instead of crashing', async () => {
    localStorage.setItem(BACKUP_KEY, '{oops')
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(screen.getByRole('status')).toHaveTextContent(/повреждена/)
  })
})
```

- [ ] **Step 2: Запустить — падают**

Run: `npx vitest run components/lesson components/review lib/progress`
Expected: FAIL по всем новым тестам.

- [ ] **Step 3: `Levels` — стрелки и roving tabindex**

В `components/lesson/blocks/Levels.tsx` добавить обработчик и атрибуты кнопок:

```tsx
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = levels.length - 1
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    document.getElementById(tabId(next))?.focus()
  }
```

и у `<button role="tab">`: `tabIndex={active === i ? 0 : -1}` и `onKeyDown={(e) => onKeyDown(e, i)}`. (Импортировать `type KeyboardEvent` из `react` вместо `React.KeyboardEvent`, если `React` не в области видимости.)

- [ ] **Step 4: `Check`, `Faded`, `ExplainBack`**

`components/lesson/gates/Check.tsx`:
- после `const solved = gate.passed` добавить `const shownChoice = solved && selected === null ? answer : selected` с комментарием `// после перезагрузки локального выбора нет — помечаем верный вариант, чтобы читалка знала ответ`; в кнопках вариантов использовать `shownChoice` в `aria-checked={shownChoice === i}` и `data-selected={shownChoice === i}`;
- в `onKeyDown` поля: `if (e.key === 'Enter' && text.trim() !== '') submit()`;
- три блока с `role="status"` заменить одним постоянным контейнером (живая область должна существовать до появления текста, иначе читалка её не объявит):

```tsx
      <div role="status" aria-live="polite">
        {!solved && verdict === 'wrong' && <p className="feedback-wrong">{wrongText}</p>}
        {!solved && verdict === 'not-a-number' && <p className="feedback-wrong">Введи число, например 0.5 или −2</p>}
        {solved && (
          <div className="feedback-right">
            <p className="m-0">
              {gate.revealed ? `Ответ: ${answerText}. Этот вопрос вернётся к тебе на повторении.` : '✓ Верно!'}
            </p>
            {explain && <div className="mt-2 text-ink">{explain}</div>}
          </div>
        )}
      </div>
```

`components/lesson/gates/Faded.tsx`: в `onKeyDown` поля `if (e.key === 'Enter' && values[i].trim() !== '') check()`.

`components/lesson/gates/ExplainBack.tsx`: кнопке «Готово, я сравнил» добавить `disabled={!canCompare}`.

- [ ] **Step 5: `NextWordGame` после перезагрузки**

В `components/lesson/gates/NextWordGame.tsx`:

```tsx
  // После перезагрузки локальных ответов нет, а ворота пройдены: показываем лучшие ответы и комментарии
  const restored = gate.passed && picks.every((p) => p === null)
```

и в `rounds.map`: `const picked = restored ? round.answers[0] : picks[r]`; в `pick()` первой строкой `if (gate.passed || picks[round] !== null) return`.

- [ ] **Step 6: `useHydrated` через `useSyncExternalStore`**

`lib/progress/useHydrated.ts` целиком:

```ts
import { useSyncExternalStore } from 'react'
import { useProgress } from './store'

const subscribe = (onChange: () => void) => useProgress.persist.onFinishHydration(onChange)
const getSnapshot = () => useProgress.persist.hasHydrated()
const getServerSnapshot = () => false

/**
 * false — на сервере и при гидратации (совпадает с серверным HTML); true — когда прогресс из localStorage загружен.
 * useSyncExternalStore гидратационно безопасен по построению: серверный снимок всегда false.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

Run: `npx vitest run lib/progress/useHydrated.test.tsx` → PASS без изменений теста.

- [ ] **Step 7: Резервная копия — чтение, восстановление, панель**

`lib/progress/storage.ts`, после `readRawProgress`:

```ts
/** Резервная копия как есть (битый JSON, чужая версия) — для восстановления или выгрузки. */
export function readBackup(): string | null {
  try {
    return window.localStorage.getItem(BACKUP_KEY)
  } catch {
    return null
  }
}
```

`lib/progress/store.ts`: в `ProgressActions` добавить `restoreBackup(): boolean`; импортировать `readBackup` из `./storage`; реализация после `importProgress`:

```ts
      restoreBackup: () => {
        const raw = readBackup()
        if (raw === null) return false
        try {
          const parsed: unknown = JSON.parse(raw)
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return false
          const envelope = parsed as { version?: unknown; state?: unknown }
          // копия — либо запись zustand persist { version, state }, либо сырой экспорт прогресса
          const data = typeof envelope.state === 'object' && envelope.state !== null ? envelope.state : parsed
          const version = envelope.version
          if (version !== 1 && version !== CURRENT_VERSION) return false
          set(migrateProgress(data, version))
          return true
        } catch {
          return false
        }
      },
```

`components/review/BackupPanel.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { downloadText } from '@/lib/download'
import { todayISO } from '@/lib/progress/scheduler'
import { readBackup } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'

/** Резервная копия появляется, когда прогресс не удалось прочитать. Отсюда её можно вернуть или скачать. */
export function BackupPanel() {
  const restoreBackup = useProgress((s) => s.restoreBackup)
  const [backup, setBackup] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage читается только на клиенте после монтирования
    setBackup(readBackup())
  }, [])

  if (backup === null) return null

  return (
    <section aria-labelledby="backup-title" className="mt-10 rounded-xl border border-dashed border-line p-5">
      <p id="backup-title" className="gate-label">
        Резервная копия
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Когда-то прогресс не удалось прочитать, и он был сохранён отдельно. Можно попробовать вернуть его или скачать файл.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            setMessage(
              restoreBackup()
                ? 'Резервная копия восстановлена. Обнови страницу, чтобы увидеть изменения.'
                : 'Не получилось: копия повреждена. Скачай её — возможно, часть данных удастся достать вручную.',
            )
          }
        >
          Восстановить
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => downloadText(`ailearning-backup-${todayISO()}.json`, backup, 'application/octet-stream')}
        >
          Скачать копию
        </button>
      </div>
      <p role="status" className="mt-3 text-sm text-ink-soft">
        {message}
      </p>
    </section>
  )
}
```

`app/review/page.tsx`: импорт `BackupPanel` и `<BackupPanel />` после `<div className="mt-8"><ReviewDeck … /></div>`.

- [ ] **Step 8: Запустить всё, коммит**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add components lib/progress app/review/page.tsx
git commit -m "fix(ux): keyboard tabs, honest live regions, game state after reload, hydration via useSyncExternalStore, backup restore panel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Тесты раннера и полного урока, иконка сайта, заметки, финальная проверка

**Files:**
- Create: `components/code/useRunner.test.tsx`, `app/icon.svg`
- Delete: `app/favicon.ico`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Modify: `e2e/lesson-flow.spec.ts`, `README.md`, `docs/superpowers/notes/2026-10-20-m1a-followups.md`

- [ ] **Step 1: Тесты `useRunner` с поддельным Worker**

`components/code/useRunner.test.tsx`:

```tsx
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRunner } from './useRunner'

type Listener = (e: { data?: unknown; message?: string }) => void

/** Поддельный Worker: запоминает сообщения и позволяет тесту ответить или «упасть». */
class FakeWorker {
  static instances: FakeWorker[] = []
  listeners: Record<string, Listener[]> = { message: [], error: [] }
  posted: { requestId: number; exerciseId: string; source: string }[] = []
  terminated = false
  constructor() {
    FakeWorker.instances.push(this)
  }
  addEventListener(type: string, fn: Listener) {
    this.listeners[type].push(fn)
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn)
  }
  postMessage(msg: { requestId: number; exerciseId: string; source: string }) {
    this.posted.push(msg)
  }
  terminate() {
    this.terminated = true
  }
  reply(requestId: number, result: unknown) {
    for (const l of [...this.listeners.message]) l({ data: { requestId, result } })
  }
  fail(message: string) {
    for (const l of [...this.listeners.error]) l({ message })
  }
}

beforeEach(() => {
  FakeWorker.instances = []
  vi.stubGlobal('Worker', FakeWorker)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useRunner', () => {
  it('resolves with the result that carries its own requestId and ignores others', async () => {
    const { result } = renderHook(() => useRunner())
    const promise = result.current('code', 'dot')
    const worker = FakeWorker.instances[0]
    const { requestId } = worker.posted[0]
    worker.reply(requestId + 1000, { status: 'timeout' })
    worker.reply(requestId, { status: 'ok', results: [] })
    await expect(promise).resolves.toEqual({ status: 'ok', results: [] })
    expect(worker.terminated).toBe(false)
  })

  it('stops a hung worker on timeout and prepares a fresh one', async () => {
    const { result } = renderHook(() => useRunner(2000))
    const promise = result.current('while (true) {}', 'dot')
    vi.advanceTimersByTime(2000)
    await expect(promise).resolves.toEqual({ status: 'timeout' })
    expect(FakeWorker.instances[0].terminated).toBe(true)
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('turns a worker error into a runtime error and replaces the worker', async () => {
    const { result } = renderHook(() => useRunner())
    const promise = result.current('x', 'dot')
    FakeWorker.instances[0].fail('boom')
    await expect(promise).resolves.toEqual({ status: 'runtime-error', message: 'boom' })
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('terminates the worker and clears pending timers on unmount', () => {
    const { result, unmount } = renderHook(() => useRunner())
    void result.current('x', 'dot')
    unmount()
    expect(FakeWorker.instances[0].terminated).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
```

Run: `npx vitest run components/code/useRunner.test.tsx` → PASS (хук уже ведёт себя так; тесты фиксируют поведение).

- [ ] **Step 2: E2E — урок 0.1 целиком и перезагрузка**

Добавить в `e2e/lesson-flow.spec.ts`:

```ts
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
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ailearning:v1')!))
  expect(stored.version).toBe(2)
  expect(Object.keys(stored.state.cards)).toEqual(expect.arrayContaining(['attention/c-0-1-next-word']))
})
```

Убедиться, что `READY` содержит все девять готовых уроков: `0-1-riddle`, `0-2-journey-map`, `1-1-vector`, `1-2-vector-ops`, `1-3-dot-product`, `1-4-matrix`, `1-5-matmul`, `1-6-softmax`, `1-p-practice`.

- [ ] **Step 3: Иконка сайта вместо шаблонных файлов**

Создать `app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0a0e1f"/>
  <circle cx="32" cy="32" r="16" fill="none" stroke="#22d3ee" stroke-opacity=".35" stroke-width="3"/>
  <circle cx="32" cy="32" r="9" fill="#22d3ee"/>
</svg>
```

Удалить `app/favicon.ico` и `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (ни один не используется: `grep -rn "\.svg" app components` пуст). Next сам подставит `<link rel="icon" href="/icon.svg">`.

- [ ] **Step 4: README и заметки**

`README.md`, раздел «Как устроен урок»: в перечень компонентов добавить `<MatrixTransform3D>`, `<MatMulExplorer>`, `<ShapeGame>`, `<SoftmaxBars>`; добавить абзац:

> Прогресс хранится под курсом: в MDX id короткие (`1-4-check-shape`), в localStorage — `attention/1-4-check-shape`. Префикс добавляет `LessonProvider`; при обращении к прогрессу из навигации используй `scopeId(course.id, id)`.

`docs/superpowers/notes/2026-10-20-m1a-followups.md`: перед каждым пунктом, закрытым этим планом, поставить `✅ M1b —` (softmax и маски; отчёт об упражнениях; карточки после «Показать ответ»; связь сцены и текста; сброс прогресса молча; `useHydrated`; `Levels` стрелки; `AttentionArcs` проценты; `Check`/`Faded` Enter и `aria-checked`; `ExplainBack` «Готово»; `NextWordGame`; e2e полного урока; тесты `useRunner`; шаблонные svg и favicon). Остальное (синхронизация вкладок в одну секунду, парсер id карточек, `flatten-segments`, `NEXT_PUBLIC_SITE_URL`) оставить открытым.

- [ ] **Step 5: Полная проверка**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run e2e
```

Expected: всё зелёное; `out/courses/attention/1-p-practice.html` существует; `out/icon.svg` существует.

Lighthouse (десктоп) на `/courses/attention/1-6-softmax` через `npx serve out -l 3100` и Chrome DevTools: Performance ≥ 85, SEO ≥ 95, Accessibility ≥ 90. Если Accessibility ниже — смотреть контраст подписей в обсерватории (`text-space-muted` на тёмном) и имена полей.

- [ ] **Step 6: Коммит и push**

```bash
git add components/code/useRunner.test.tsx e2e app/icon.svg README.md docs/superpowers/notes
git rm app/favicon.ico public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
git commit -m "test: runner hook and full lesson e2e; chore: site icon, README and M1a follow-up notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

## Самопроверка плана (выполнена при написании)

**Покрытие спецификации.** §10 (1.4 `MatrixTransform3D` + `matVec`; 1.5 «много векторов сразу», игра форм, транспонирование, `matMul`; 1.6 `SoftmaxBars`, температура, Predict «+10», `softmax` с тестом `[1000, 1001]`; 1.P вперемешку + босс dot+softmax) — Task 7–11. §3.2 карточки после «Показать ответ» у всех ворот — Task 5 и Task 9 (`ShapeGame`). §5.4 связь сцены и текста и `InfoCard` у дуг — Task 6. §5.6 прогресс — Task 1–3 (с отклонением, описанным в §11). Долги из заметки M1a «до или вместе с M1b» — Task 4, 5, 6; «UX и доступность» — Task 12; «Тесты» — Task 13; «Публикация» (svg/favicon) — Task 13.

**Согласованность имён.** `scopeId` (Task 1) используется в Task 2, 3, 12; `useProgressKey` (Task 2) — в `Recall`, `ExplainBack`, `CodeExercise`; `NumberField` (Task 7) — в `MatrixInputs` и `SoftmaxBars`; `IMPOSSIBLE`, `formatShape`, `productShape`, `shapeOptions`, `type Shape` (Task 7) — в `ShapeGame` (Task 9); `LessonProvider` всюду принимает `courseId`; `LessonStatusBadge({ courseId, lessonId })` — в странице урока; `restoreBackup` (Task 12) объявлен в `ProgressActions`.

**Review Focus → тесты.** 1 → Task 1 (`migration to schema v2`), Task 12 (`restoreBackup`, `BackupPanel`); 2 → Task 2 (`gates inside a lesson`, `CodeExercise` под провайдером), Task 3 (`readyCardIds` с префиксом); 3 → Task 7 (`MatrixTransform3D` запятая/зажим/abc), Task 10 (`SoftmaxBars` 1000 → 50, без NaN); 4 → Task 4 (`formatValue`, 8 знаков), Task 10 (упражнение `softmax`, наивное решение); 5 → Task 5 (три компонента), Task 9 (`ShapeGame` «Показать правило»).
