'use client'

import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function LessonStatusBadge({ lessonId }: { lessonId: string }) {
  const hydrated = useHydrated()
  const completed = useProgress((s) => s.lessons[lessonId]?.status === 'completed')
  if (!hydrated || !completed) return null
  return (
    <p className="mt-4 inline-flex rounded-full bg-success-bg px-3 py-1 text-sm text-success">
      ✓ Урок пройден — все шаги открыты, его можно перечитывать как справочник
    </p>
  )
}
