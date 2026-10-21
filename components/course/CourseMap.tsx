'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getCourse } from '@/lib/course/registry'
import { LEVEL_LABEL } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

export function CourseMap({ courseId = 'attention' }: { courseId?: string }) {
  const course = getCourse(courseId)
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)
  const [open, setOpen] = useState<string | null>(null)
  if (!course) return null

  return (
    <ol className="relative my-8 list-none space-y-3 p-0 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-line">
      {course.modules.map((m) => {
        const hasReady = m.lessons.some((l) => l.availability === 'ready')
        const done = hydrated ? m.lessons.filter((l) => lessons[scopeId(course.id, l.id)]?.status === 'completed').length : 0
        const expanded = open === m.id
        return (
          <li key={m.id} className="relative m-0 pl-14">
            <span
              aria-hidden
              className={`absolute top-3 left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 font-serif text-lg ${
                done === m.lessons.length ? 'border-success bg-success-bg' : hasReady ? 'border-ink bg-card' : 'border-line bg-paper'
              }`}
            >
              {m.number}
            </span>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : m.id)}
              className="w-full rounded-xl border border-line bg-card p-4 text-left transition hover:border-ink"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-lg">{m.title}</span>
                <span className="text-xs text-muted">
                  {LEVEL_LABEL[m.level]} · {done}/{m.lessons.length}
                </span>
              </span>
              <span className="mt-1 block text-sm text-ink-soft">{m.description}</span>
            </button>
            {expanded && (
              <ul className="mt-2 list-none space-y-1 p-0 pl-2">
                {m.lessons.map((l) => (
                  <li key={l.id} className="m-0 text-sm">
                    {l.availability === 'ready' ? (
                      <Link className="text-ink-cyan underline" href={`/courses/${course.id}/${l.slug}`}>
                        {l.id} {l.title}
                      </Link>
                    ) : (
                      <span className="text-muted">
                        {l.id} {l.title} · скоро
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
