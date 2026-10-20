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
