import Link from 'next/link'
import { ReviewBadge } from './ReviewBadge'

export function TopBar({ knownCardIds }: { knownCardIds: string[] }) {
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
            Повторение <ReviewBadge knownCardIds={knownCardIds} />
          </Link>
          <Link href="/glossary" className="hover:underline">
            Глоссарий
          </Link>
        </nav>
      </div>
    </header>
  )
}
