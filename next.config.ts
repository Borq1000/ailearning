import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
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

export default withMDX(nextConfig)
