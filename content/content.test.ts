// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '@/content/attention/exercises'
import { GLOSSARY } from '@/content/glossary'
import { cardIdsInSource, readyCardIds } from '@/lib/course/card-ids'
import { findLessonById, flatLessons, getCourse } from '@/lib/course/registry'
import remarkSteps from '@/lib/mdx/remark-steps.mjs'
import { scopeId } from '@/lib/progress/scope'

const course = getCourse('attention')!
const lessonsDir = path.join(process.cwd(), 'content/attention/lessons')
const ready = flatLessons(course).filter((l) => l.availability === 'ready')
const firstLessonId = flatLessons(course)[0].id
const GATE_TAGS = ['Predict', 'Check', 'Recall', 'ExplainBack', 'Faded', 'VectorTask', 'NextWordGame', 'ShapeGame', 'CodeExercise']

const sourceOf = (slug: string) => readFileSync(path.join(lessonsDir, `${slug}.mdx`), 'utf8')
const count = (src: string, tag: string) => (src.match(new RegExp(`<${tag}[\\s>/]`, 'g')) ?? []).length
interface LessonModule {
  metadata?: { description?: string; objectives: string[] }
  cards: { id: string; kind: string; options?: string[]; correct?: number }[]
}
const compile = async (src: string) =>
  (await evaluate(src, { ...runtime, remarkPlugins: [remarkGfm, remarkMath, remarkSteps] })) as unknown as LessonModule

describe('course content integrity', () => {
  it('has an MDX file for every ready lesson and no orphan files', () => {
    const files = readdirSync(lessonsDir)
      .filter((f) => f.endsWith('.mdx'))
      .map((f) => f.replace(/\.mdx$/, ''))
      .sort()
    expect(files).toEqual(ready.map((l) => l.slug).sort())
  })

  for (const lesson of ready) {
    describe(`${lesson.id} ${lesson.title}`, () => {
      const src = sourceOf(lesson.slug)

      it('exports metadata and review cards', async () => {
        const mod = await compile(src)
        expect(typeof mod.metadata?.description).toBe('string')
        expect(mod.metadata!.objectives.length).toBeGreaterThan(0)
        expect(mod.cards.length).toBeGreaterThanOrEqual(2)
        for (const card of mod.cards) {
          expect(card.id).toMatch(/^c-/)
          if (card.kind === 'choice') {
            expect(card.options!.length).toBeGreaterThan(1)
            expect(card.correct).toBeTypeOf('number')
          }
        }
      })

      it('contains the required building blocks', () => {
        if (lesson.kind === 'lesson') {
          expect(count(src, 'Predict')).toBeGreaterThanOrEqual(1)
          expect(count(src, 'Check')).toBeGreaterThanOrEqual(2)
        } else {
          expect(count(src, 'Check') + count(src, 'Faded') + count(src, 'CodeExercise')).toBeGreaterThanOrEqual(3)
        }
        expect(count(src, 'Summary')).toBe(1)
        expect(count(src, 'Recall')).toBe(lesson.id === firstLessonId ? 0 : 1)
      })

      it('lists the same card ids for the review badge as its `cards` export', async () => {
        const mod = await compile(src)
        expect(cardIdsInSource(src)).toEqual(mod.cards.map((c) => c.id))
      })

      it('imports nothing (components come from mdx-components.tsx)', () => {
        expect(src).not.toMatch(/^import\s/m)
      })

      it('keeps the row breaks of matrices in formulas', () => {
        for (const [, body] of src.matchAll(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g)) {
          expect(body, `lesson ${lesson.id}: a lone backslash in a bmatrix is a space, not a row break`).not.toMatch(/(^|[^\\])\\\s/)
        }
      })

      it('references only existing glossary terms and exercises', () => {
        for (const [, id] of src.matchAll(/<Term id="([^"]+)"/g)) expect(GLOSSARY[id], `unknown term ${id}`).toBeDefined()
        for (const [, id] of src.matchAll(/<CodeExercise id="([^"]+)"/g)) expect(EXERCISES[id], `unknown exercise ${id}`).toBeDefined()
      })
    })
  }

  it('points every glossary term to an existing lesson of an existing course', () => {
    for (const entry of Object.values(GLOSSARY)) {
      const termCourse = getCourse(entry.courseId)
      expect(termCourse, `term ${entry.id}: unknown course ${entry.courseId}`).toBeDefined()
      expect(findLessonById(termCourse!, entry.lessonId), `term ${entry.id}: unknown lesson ${entry.lessonId}`).toBeDefined()
    }
  })

  it('uses unique gate ids and card ids across the course', async () => {
    // Ids must be unique within a course: progress keys only add the course prefix (scopeId → `attention/<id>`),
    // so two gates with one id would share a record. CodeExercise stores `code:${id}`.
    const stored: string[] = []
    const labelled: string[] = []
    const cardIds: string[] = []
    for (const lesson of ready) {
      const src = sourceOf(lesson.slug)
      for (const tag of GATE_TAGS) {
        for (const [, id] of src.matchAll(new RegExp(`<${tag}\\b[^>]*?\\bid="([^"]+)"`, 'g'))) {
          stored.push(tag === 'CodeExercise' ? `code:${id}` : id)
          labelled.push(`${tag}:${id}`)
        }
      }
      const mod = await compile(src)
      cardIds.push(...mod.cards.map((c) => c.id))
    }
    const duplicates = labelled.filter((_, i) => stored.indexOf(stored[i]) !== i || stored.lastIndexOf(stored[i]) !== i)
    expect(duplicates, `gates sharing one progress key: ${duplicates.join(', ')}`).toEqual([])
    expect(new Set(cardIds).size).toBe(cardIds.length)
    // значок «Повторение» в шапке знает ровно эти карточки
    expect(readyCardIds()).toEqual(cardIds.map((id) => scopeId(course.id, id)))
  })
})
