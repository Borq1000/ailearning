'use client'

import { scopeId } from '@/lib/progress/scope'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function LessonStatusBadge({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const hydrated = useHydrated()
  const key = scopeId(courseId, lessonId)
  const completed = useProgress((s) => s.lessons[key]?.status === 'completed')
  if (!hydrated || !completed) return null
  return (
    <p className="mt-4 inline-flex rounded-full bg-success-bg px-3 py-1 text-sm text-success">
      ✓ Урок пройден — все шаги открыты, его можно перечитывать как справочник
    </p>
  )
}
