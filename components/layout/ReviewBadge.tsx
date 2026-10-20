'use client'

import { useMemo } from 'react'
import { plural } from '@/lib/plural'
import { isDue, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

/**
 * Сколько карточек ждёт повторения. Считаются только карточки, которые колода может показать:
 * из готовых уроков (`knownCardIds`) и созданные из подсмотренных ответов (`customCards`).
 */
export function ReviewBadge({ knownCardIds }: { knownCardIds: readonly string[] }) {
  const hydrated = useHydrated()
  const known = useMemo(() => new Set(knownCardIds), [knownCardIds])
  const due = useProgress((s) => {
    const today = todayISO()
    return Object.entries(s.cards).filter(
      ([id, card]) => (known.has(id) || Object.hasOwn(s.customCards, id)) && isDue(card, today),
    ).length
  })
  if (!hydrated || due === 0) return null
  return (
    <span className="rounded-full bg-glow-orange px-1.5 text-[11px] font-semibold text-ink">
      {due}
      <span className="sr-only"> {plural(due, ['карточка', 'карточки', 'карточек'])} к повторению</span>
    </span>
  )
}
