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
import { flatLessons, getCourse } from '@/lib/course/registry'
import remarkSteps from '@/lib/mdx/remark-steps.mjs'

const course = getCourse('attention')!
const lessonsDir = path.join(process.cwd(), 'content/attention/lessons')
const ready = flatLessons(course).filter((l) => l.availability === 'ready')
const firstLessonId = flatLessons(course)[0].id
const GATE_TAGS = ['Predict', 'Check', 'Recall', 'ExplainBack', 'Faded', 'VectorTask', 'NextWordGame', 'CodeExercise']

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

      it('imports nothing (components come from mdx-components.tsx)', () => {
        expect(src).not.toMatch(/^import\s/m)
      })

      it('references only existing glossary terms and exercises', () => {
        for (const [, id] of src.matchAll(/<Term id="([^"]+)"/g)) expect(GLOSSARY[id], `unknown term ${id}`).toBeDefined()
        for (const [, id] of src.matchAll(/<CodeExercise id="([^"]+)"/g)) expect(EXERCISES[id], `unknown exercise ${id}`).toBeDefined()
      })
    })
  }

  it('uses unique gate ids and card ids across the course', async () => {
    const gateIds: string[] = []
    const cardIds: string[] = []
    for (const lesson of ready) {
      const src = sourceOf(lesson.slug)
      for (const tag of GATE_TAGS) {
        for (const [, id] of src.matchAll(new RegExp(`<${tag}\\b[^>]*?\\bid="([^"]+)"`, 'g'))) gateIds.push(`${tag}:${id}`)
      }
      const mod = await compile(src)
      cardIds.push(...mod.cards.map((c) => c.id))
    }
    expect(new Set(gateIds).size).toBe(gateIds.length)
    expect(new Set(cardIds).size).toBe(cardIds.length)
  })
})
