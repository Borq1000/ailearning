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
