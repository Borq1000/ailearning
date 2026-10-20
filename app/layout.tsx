import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono, Literata } from 'next/font/google'
import 'katex/dist/katex.min.css'
import './globals.css'
import { StorageBanner } from '@/components/layout/StorageBanner'
import { TopBar } from '@/components/layout/TopBar'
import { ProgressHydrator } from '@/components/progress/ProgressHydrator'
import { readyCardIds } from '@/lib/course/card-ids'
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
  // Значок повторения считает только карточки, которые есть в колоде (id из старых версий курса не в счёт).
  const knownCardIds = readyCardIds()
  return (
    <html lang="ru" className={`${literata.variable} ${plex.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ProgressHydrator />
        <StorageBanner />
        <TopBar knownCardIds={knownCardIds} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-8 text-center text-xs text-muted">
          Учебник ИИ · по статье Vaswani et al., «Attention Is All You Need» (NeurIPS 2017)
        </footer>
      </body>
    </html>
  )
}
