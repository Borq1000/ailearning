'use client'

import { isDue, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function ReviewBadge() {
  const hydrated = useHydrated()
  const due = useProgress((s) => Object.values(s.cards).filter((c) => isDue(c, todayISO())).length)
  if (!hydrated || due === 0) return null
  return (
    <span className="rounded-full bg-glow-orange px-1.5 text-[11px] font-semibold text-ink">
      {due}
      <span className="sr-only"> карточек к повторению</span>
    </span>
  )
}
