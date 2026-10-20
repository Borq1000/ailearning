import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContinueButton } from '@/components/course/ContinueButton'
import { CourseMap } from '@/components/course/CourseMap'
import { flatLessons, getCourse, listCourses, readyLessons } from '@/lib/course/registry'
import { plural } from '@/lib/plural'

type Params = { course: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return listCourses().map((c) => ({ course: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const course = getCourse((await params).course)
  return course ? { title: course.title, description: course.subtitle } : {}
}

export default async function CoursePage({ params }: { params: Promise<Params> }) {
  const course = getCourse((await params).course)
  if (!course) notFound()
  const total = flatLessons(course).length
  const ready = readyLessons(course).length
  return (
    <main className="mx-auto max-w-[760px] px-4 py-12">
      <p className="gate-label">Курс 1</p>
      <h1 className="mt-2 font-serif text-5xl leading-tight">{course.title}</h1>
      <p className="mt-4 text-lg text-ink-soft">{course.subtitle}</p>
      <p className="mt-3 text-sm text-muted">
        {course.modules.length} {plural(course.modules.length, ['модуль', 'модуля', 'модулей'])} · {total}{' '}
        {plural(total, ['урок', 'урока', 'уроков'])} · готово {ready}
      </p>
      <div className="mt-6">
        <ContinueButton course={course} />
      </div>
      <CourseMap courseId={course.id} />
    </main>
  )
}
