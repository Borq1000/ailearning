import { describe, expect, it } from 'vitest'
import type { CourseMeta } from './types'
import {
  findLesson,
  findLessonById,
  flatLessons,
  getCourse,
  lessonsBefore,
  neighbors,
  nextLessonToStudy,
  readyLessons,
} from './registry'

const course: CourseMeta = {
  id: 'test',
  title: 'Тест',
  subtitle: '',
  modules: [
    {
      id: 'm0',
      number: 0,
      title: 'Ноль',
      description: '',
      level: 'kid',
      lessons: [
        { id: '0.1', slug: 'a', title: 'A', minutes: 5, kind: 'lesson', availability: 'ready' },
        { id: '0.2', slug: 'b', title: 'B', minutes: 5, kind: 'lesson', availability: 'soon' },
      ],
    },
    {
      id: 'm1',
      number: 1,
      title: 'Один',
      description: '',
      level: 'student',
      lessons: [{ id: '1.1', slug: 'c', title: 'C', minutes: 5, kind: 'lesson', availability: 'ready' }],
    },
  ],
}

describe('course registry', () => {
  it('flattens lessons in order and annotates their module', () => {
    const flat = flatLessons(course)
    expect(flat.map((l) => l.id)).toEqual(['0.1', '0.2', '1.1'])
    expect(flat[2]).toMatchObject({ moduleId: 'm1', moduleNumber: 1, moduleTitle: 'Один' })
  })

  it('finds lessons by slug and by id', () => {
    expect(findLesson(course, 'c')?.id).toBe('1.1')
    expect(findLessonById(course, '0.2')?.slug).toBe('b')
    expect(findLesson(course, 'nope')).toBeUndefined()
  })

  it('links neighbours through ready lessons only', () => {
    expect(readyLessons(course).map((l) => l.id)).toEqual(['0.1', '1.1'])
    expect(neighbors(course, 'a').next?.id).toBe('1.1')
    expect(neighbors(course, 'c').prev?.id).toBe('0.1')
    expect(neighbors(course, 'a').prev).toBeUndefined()
  })

  it('lists ready lessons before a given one', () => {
    expect(lessonsBefore(course, 'c').map((l) => l.id)).toEqual(['0.1'])
    expect(lessonsBefore(course, 'a')).toEqual([])
  })

  it('suggests the first unfinished ready lesson, or the last one when all are done', () => {
    expect(nextLessonToStudy(course, {})?.id).toBe('0.1')
    expect(nextLessonToStudy(course, { '0.1': { status: 'completed' } })?.id).toBe('1.1')
    expect(
      nextLessonToStudy(course, { '0.1': { status: 'completed' }, '1.1': { status: 'completed' } })?.id,
    ).toBe('1.1')
  })

  it('ships the attention course with unique ids and slugs', () => {
    const attention = getCourse('attention')
    expect(attention?.modules).toHaveLength(9)
    const flat = flatLessons(attention!)
    expect(new Set(flat.map((l) => l.id)).size).toBe(flat.length)
    expect(new Set(flat.map((l) => l.slug)).size).toBe(flat.length)
  })
})
