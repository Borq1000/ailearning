export const SITE = {
  name: 'Учебник ИИ',
  description:
    'Интерактивный учебник: от векторов до статьи «Attention Is All You Need» — с 3D-сценами, задачами и кодом.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const
