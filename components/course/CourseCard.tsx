import Link from 'next/link'
import { plural } from '@/lib/plural'
import { flatLessons } from '@/lib/course/registry'
import type { CourseMeta } from '@/lib/course/types'

export function CourseCard({ course }: { course: CourseMeta }) {
  const all = flatLessons(course)
  const ready = all.filter((l) => l.availability === 'ready').length
  const modules = course.modules.length
  return (
    <Link href={`/courses/${course.id}`} className="group block rounded-2xl border border-line bg-card p-6 transition hover:border-ink">
      <p className="gate-label">Курс 1</p>
      <h3 className="mt-2 font-serif text-2xl">{course.title}</h3>
      <p className="mt-2 text-ink-soft">{course.subtitle}</p>
      <p className="mt-4 text-sm text-muted">
        {modules} {plural(modules, ['модуль', 'модуля', 'модулей'])} · {all.length}{' '}
        {plural(all.length, ['урок', 'урока', 'уроков'])} · готово {ready}
      </p>
      <span className="mt-4 inline-block text-sm font-semibold group-hover:underline">Открыть программу →</span>
    </Link>
  )
}
