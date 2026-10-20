import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseNav, MobileCourseNav } from '@/components/course/CourseNav'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { LessonPager } from '@/components/lesson/engine/LessonPager'
import { LessonStatusBadge } from '@/components/lesson/engine/LessonStatusBadge'
import { loadLessonModule } from '@/lib/course/lesson-module'
import { findLesson, getCourse, lessonsBefore, listCourses, neighbors, readyLessons } from '@/lib/course/registry'

type Params = { course: string; lesson: string }

export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return listCourses().flatMap((c) => readyLessons(c).map((l) => ({ course: c.id, lesson: l.slug })))
}

async function resolveLesson(params: Promise<Params>) {
  const { course: courseId, lesson: slug } = await params
  const course = getCourse(courseId)
  const lesson = course ? findLesson(course, slug) : undefined
  if (!course || !lesson || lesson.availability !== 'ready') notFound()
  return { course, lesson, mod: await loadLessonModule(course.id, lesson.slug) }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lesson, mod } = await resolveLesson(params)
  return {
    title: `${lesson.id} ${lesson.title}`,
    description: mod.metadata.description,
    openGraph: { title: lesson.title, description: mod.metadata.description, type: 'article' },
  }
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { course, lesson, mod } = await resolveLesson(params)
  const { prev, next } = neighbors(course, lesson.slug)
  const previous = await Promise.all(lessonsBefore(course, lesson.slug).map((l) => loadLessonModule(course.id, l.slug)))
  const Content = mod.default

  return (
    <main className="mx-auto flex max-w-7xl gap-10 px-4 py-10 lg:px-8">
      <CourseNav course={course} currentSlug={lesson.slug} />
      <article className="min-w-0 flex-1">
        <MobileCourseNav course={course} currentSlug={lesson.slug} />
        <header className="mx-auto mb-10 max-w-[680px] lg:mx-0">
          <p className="gate-label">
            Модуль {lesson.moduleNumber} · {lesson.moduleTitle} · урок {lesson.id} · {lesson.minutes} мин
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-tight">{lesson.title}</h1>
          <p className="mt-3 text-ink-soft">{mod.metadata.description}</p>
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            {mod.metadata.objectives.map((o) => (
              <li key={o}>✦ {o}</li>
            ))}
          </ul>
          <LessonStatusBadge lessonId={lesson.id} />
        </header>
        <LessonProvider
          lessonId={lesson.id}
          lessonCardIds={mod.cards.map((c) => c.id)}
          recallCards={previous.flatMap((m) => m.cards)}
        >
          <div className="prose-lesson mx-auto max-w-[680px] lg:mx-0">
            <Content />
          </div>
        </LessonProvider>
        <div className="mx-auto max-w-[680px] lg:mx-0">
          <LessonPager courseId={course.id} prev={prev} next={next} />
        </div>
      </article>
    </main>
  )
}
