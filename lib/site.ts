export const SITE = {
  name: 'Учебник ИИ',
  description:
    'Интерактивный учебник: от векторов до статьи «Attention Is All You Need» — с 3D-сценами, задачами и кодом.',
  // `||`, а не `??`: пустая переменная (NEXT_PUBLIC_SITE_URL=) тоже считается незаданной.
  // Для боевой сборки адрес обязателен — next.config.ts предупреждает, если его нет.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const
