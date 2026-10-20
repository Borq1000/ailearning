import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import path from 'node:path'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
}

const withMDX = createMDX({
  options: {
    // Turbopack принимает плагины только строками. Лоадер резолвит их от папки MDX-файла, а не от корня проекта,
    // поэтому локальный плагин задан абсолютным путём
    remarkPlugins: ['remark-gfm', 'remark-math', path.join(process.cwd(), 'lib/mdx/remark-steps.mjs')],
    rehypePlugins: ['rehype-katex'],
  },
})

export default function config(phase: string): NextConfig {
  // Сборку не роняем: локальные сборки и e2e обходятся без адреса. Но в боевой сборке без него
  // sitemap.xml, robots.txt и Open Graph укажут на localhost.
  if (
    phase === PHASE_PRODUCTION_BUILD &&
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_SITE_URL &&
    // next build читает конфиг дважды (сам и в процессе сборщика, который наследует окружение) — предупреждаем один раз
    !process.env.AILEARNING_SITE_URL_WARNED
  ) {
    process.env.AILEARNING_SITE_URL_WARNED = '1'
    console.warn('⚠ NEXT_PUBLIC_SITE_URL не задан — sitemap/robots укажут на localhost')
  }
  return withMDX(nextConfig)
}
