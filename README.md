# Учебник ИИ

Интерактивный учебник: от векторов до статьи «Attention Is All You Need».

## Команды

```bash
npm run dev        # разработка: http://localhost:3000
npm test           # юнит- и контент-тесты (Vitest)
npm run e2e        # сквозные тесты (Playwright; сам соберёт и поднимет сайт на :3100)
npm run build      # статическая сборка в out/
npm start          # посмотреть сборку: http://localhost:3000
npm run serve:out  # то же на :3100 (этот адрес используют e2e)
```

`npm run e2e` переиспользует сервер, который уже слушает порт 3100 (например, оставленный `npm run serve:out`),
и тогда проверяет **его** сборку, а не текущий код. Чтобы проверить свежую сборку, сначала останови такой сервер.
В CI (`CI=1`) сайт всегда собирается заново.

## Как устроен урок

Урок — файл `content/attention/lessons/<slug>.mdx`. Шаги разделяются строкой `---`.
Интерактивные компоненты (`<Predict>`, `<Check>`, `<VectorSpace3D>`, `<MatrixTransform3D>`, `<MatMulExplorer>`, `<ShapeGame>`, `<SoftmaxBars>`, `<CodeExercise>` …) регистрируются в `mdx-components.tsx`.
Новый урок нужно добавить в `content/attention/course.ts` и пометить `availability: 'ready'`. `content/content.test.ts` проверит его состав.

Прогресс хранится под курсом: в MDX id короткие (`1-4-check-shape`), в localStorage — `attention/1-4-check-shape`. Префикс добавляет `LessonProvider`; при обращении к прогрессу из навигации используй `scopeId(course.id, id)`.

Ключ localStorage — `ailearning:v2` (схема прогресса версии 2). Прогресс прошлых версий сайта из `ailearning:v1` переносится один раз, после чего ставится отметка `ailearning:v1-imported` (поэтому после аварийного сброса он не возвращается); сам старый ключ новый код не пишет и не удаляет — его может писать вкладка, открытая на старой версии. Если другая вкладка уже записала более новую версию схемы, эта вкладка ничего не стирает и не пишет: прогресс остаётся в памяти, а баннер просит обновить страницу. Битые данные и аварийный сброс оставляют копию в `ailearning:backup` — её можно восстановить или скачать на `/review`.

## Публикация

Для боевой сборки **обязательно** задай адрес сайта — из него строятся `sitemap.xml`, `robots.txt` и ссылки Open Graph:

```bash
NEXT_PUBLIC_SITE_URL=https://example.ru npm run build
```

Без переменной сборка не падает, но печатает предупреждение, и все адреса в sitemap/robots укажут на `http://localhost:3000`.

`out/` — чистая статика. Страницы лежат как `courses/attention/0-1-riddle.html`, а адреса у них **без слеша на конце**
(`/courses/attention/0-1-riddle`). Пример для nginx:

```nginx
root /var/www/ailearning/out;
error_page 404 /404.html;

location / {
    try_files $uri $uri.html $uri/ =404;
}
```

После `npm run build` автоматически запускается `scripts/flatten-segments.mjs` (`postbuild`): он исправляет расположение файлов префетча Next на Windows; на Linux/macOS он ничего не делает.
