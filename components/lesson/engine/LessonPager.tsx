import Link from 'next/link'
import type { FlatLesson } from '@/lib/course/types'

export function LessonPager({ courseId, prev, next }: { courseId: string; prev?: FlatLesson; next?: FlatLesson }) {
  return (
    <nav aria-label="Соседние уроки" className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {prev ? (
        <Link href={`/courses/${courseId}/${prev.slug}`} className="rounded-xl border border-line p-4 hover:border-ink">
          <span className="gate-label">← Предыдущий урок</span>
          <span className="mt-1 block font-serif">
            {prev.id} {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/courses/${courseId}/${next.slug}`}
          className="rounded-xl border border-line p-4 text-right hover:border-ink sm:col-start-2"
        >
          <span className="gate-label">Следующий урок →</span>
          <span className="mt-1 block font-serif">
            {next.id} {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}
