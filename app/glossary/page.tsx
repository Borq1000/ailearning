import type { Metadata } from 'next'
import Link from 'next/link'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById, getCourse } from '@/lib/course/registry'

export const metadata: Metadata = { title: 'Глоссарий', description: 'Термины курса с короткими определениями.' }

export default function GlossaryPage() {
  const entries = Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term, 'ru'))
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12">
      <p className="gate-label">Справочник</p>
      <h1 className="mt-2 font-serif text-4xl">Глоссарий</h1>
      <dl className="mt-8 divide-y divide-line">
        {entries.map((entry) => {
          const course = getCourse(entry.courseId)
          const lesson = course ? findLessonById(course, entry.lessonId) : undefined
          return (
            <div key={entry.id} id={entry.id} className="py-4">
              <dt className="font-serif text-lg">{entry.term}</dt>
              <dd className="mt-1 text-ink-soft">
                {entry.short}
                {course && lesson && (
                  <span className="mt-1 block text-xs text-muted">
                    {lesson.availability === 'ready' ? (
                      <Link className="text-ink-cyan underline" href={`/courses/${course.id}/${lesson.slug}`}>
                        Урок {lesson.id}: {lesson.title}
                      </Link>
                    ) : (
                      `Урок ${lesson.id}: ${lesson.title} (скоро)`
                    )}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </main>
  )
}
