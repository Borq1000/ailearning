'use client'

import Link from 'next/link'
import { nextLessonToStudy } from '@/lib/course/registry'
import type { CourseMeta } from '@/lib/course/types'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function ContinueButton({ course }: { course: CourseMeta }) {
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)
  const lesson = nextLessonToStudy(course, hydrated ? lessons : {})
  if (!lesson) return null
  const started = hydrated && Object.keys(lessons).length > 0
  return (
    <Link href={`/courses/${course.id}/${lesson.slug}`} className="btn-primary px-5 py-3 text-base">
      {started ? `Продолжить: ${lesson.id} ${lesson.title}` : 'Начать с первого урока'} →
    </Link>
  )
}
