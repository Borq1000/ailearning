import { attentionCourse } from '@/content/attention/course'
import type { CourseMeta, FlatLesson } from './types'

const COURSES: Record<string, CourseMeta> = { [attentionCourse.id]: attentionCourse }

export function getCourse(id: string): CourseMeta | undefined {
  return COURSES[id]
}

export function listCourses(): CourseMeta[] {
  return Object.values(COURSES)
}

export function flatLessons(course: CourseMeta): FlatLesson[] {
  return course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleNumber: m.number, moduleTitle: m.title })),
  )
}

export function readyLessons(course: CourseMeta): FlatLesson[] {
  return flatLessons(course).filter((l) => l.availability === 'ready')
}

export function findLesson(course: CourseMeta, slug: string): FlatLesson | undefined {
  return flatLessons(course).find((l) => l.slug === slug)
}

export function findLessonById(course: CourseMeta, id: string): FlatLesson | undefined {
  return flatLessons(course).find((l) => l.id === id)
}

export function neighbors(course: CourseMeta, slug: string): { prev?: FlatLesson; next?: FlatLesson } {
  const ready = readyLessons(course)
  const i = ready.findIndex((l) => l.slug === slug)
  if (i === -1) return {}
  return { prev: ready[i - 1], next: ready[i + 1] }
}

export function lessonsBefore(course: CourseMeta, slug: string): FlatLesson[] {
  const flat = flatLessons(course)
  const i = flat.findIndex((l) => l.slug === slug)
  return flat.slice(0, Math.max(i, 0)).filter((l) => l.availability === 'ready')
}

export function nextLessonToStudy(
  course: CourseMeta,
  statuses: Record<string, { status: string } | undefined>,
): FlatLesson | undefined {
  const ready = readyLessons(course)
  return ready.find((l) => statuses[l.id]?.status !== 'completed') ?? ready[ready.length - 1]
}
