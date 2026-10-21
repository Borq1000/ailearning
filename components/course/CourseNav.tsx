'use client'

import Link from 'next/link'
import type { CourseMeta } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

function StatusDot({ status }: { status?: string }) {
  const label = status === 'completed' ? 'пройден' : status === 'in-progress' ? 'в процессе' : 'не начат'
  const style =
    status === 'completed' ? 'bg-success' : status === 'in-progress' ? 'bg-glow-cyan' : 'border border-muted'
  return <span role="img" aria-label={label} title={label} className={`inline-block h-2 w-2 shrink-0 rounded-full ${style}`} />
}

export function CourseNavList({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  const hydrated = useHydrated()
  const lessons = useProgress((s) => s.lessons)

  return (
    <div className="text-sm">
      {course.modules.map((m) => (
        <div key={m.id} className="mb-5">
          <p className="gate-label">
            {m.number}. {m.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {m.lessons.map((l) => {
              if (l.availability !== 'ready') {
                return (
                  <li key={l.id} className="flex items-center gap-2 px-2 py-1 text-muted">
                    <span aria-hidden className="inline-block h-2 w-2 shrink-0" />
                    {l.id} {l.title}
                    <span className="ml-auto text-[10px] tracking-wider uppercase">скоро</span>
                  </li>
                )
              }
              const current = l.slug === currentSlug
              return (
                <li key={l.id}>
                  <Link
                    href={`/courses/${course.id}/${l.slug}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-paper-deep ${current ? 'bg-paper-deep font-semibold' : ''}`}
                  >
                    <StatusDot status={hydrated ? lessons[scopeId(course.id, l.id)]?.status : undefined} />
                    {l.id} {l.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function CourseNav({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  return (
    <nav aria-label="Содержание курса" className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
        <CourseNavList course={course} currentSlug={currentSlug} />
      </div>
    </nav>
  )
}

export function MobileCourseNav({ course, currentSlug }: { course: CourseMeta; currentSlug?: string }) {
  return (
    <details className="mb-8 rounded-xl border border-line bg-card p-4 lg:hidden">
      <summary className="cursor-pointer font-semibold">Содержание курса</summary>
      <div className="mt-4">
        <CourseNavList course={course} currentSlug={currentSlug} />
      </div>
    </details>
  )
}
