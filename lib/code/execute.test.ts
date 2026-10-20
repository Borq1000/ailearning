// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { executeExercise } from './execute'
import type { ExerciseDef } from './types'

const exercise: ExerciseDef = {
  id: 'sum',
  title: 'sum',
  entry: 'sum',
  prompt: '',
  starter: '',
  solution: '',
  hints: [],
  tests: [
    { name: 'sum([1, 2]) = 3', args: [[1, 2]], expected: 3 },
    { name: 'sum([]) = 0', args: [[]], expected: 0 },
  ],
}

describe('executeExercise', () => {
  it('runs TypeScript and reports every test', () => {
    expect(executeExercise('function sum(xs: number[]): number { return xs.reduce((s, x) => s + x, 0) }', exercise)).toEqual({
      status: 'ok',
      results: [
        { name: 'sum([1, 2]) = 3', pass: true, expectedText: '3', actualText: '3' },
        { name: 'sum([]) = 0', pass: true, expectedText: '0', actualText: '0' },
      ],
    })
  })

  it('accepts an exported function', () => {
    expect(executeExercise('export function sum(xs: number[]) { return 3 }', exercise).status).toBe('ok')
  })

  it('reports syntax errors', () => {
    expect(executeExercise('function sum(xs: number[] { return 0 }', exercise).status).toBe('compile-error')
  })

  it('reports a missing function by name', () => {
    expect(executeExercise('function total() { return 0 }', exercise)).toMatchObject({
      status: 'runtime-error',
      message: expect.stringContaining('sum'),
    })
  })

  it('reports errors thrown while the code is loading', () => {
    expect(executeExercise('throw new Error("boom")\nfunction sum() { return 0 }', exercise)).toEqual({
      status: 'runtime-error',
      message: 'boom',
    })
  })

  it('turns an exception inside one test into a failed test, not a crash', () => {
    const result = executeExercise('function sum(xs: number[]) { if (xs.length === 0) throw new Error("пусто"); return 3 }', exercise)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.results[0].pass).toBe(true)
    expect(result.results[1]).toMatchObject({ pass: false, error: 'пусто' })
  })

  it('isolates tests from arguments mutated by student code', () => {
    const twice: ExerciseDef = {
      ...exercise,
      tests: [
        { name: 'a', args: [[1, 2]], expected: 3 },
        { name: 'b', args: [[1, 2]], expected: 3 },
      ],
    }
    const result = executeExercise('function sum(xs: number[]) { const s = xs[0] + xs[1]; xs.push(100); return s }', twice)
    expect(result.status === 'ok' && result.results.every((t) => t.pass)).toBe(true)
    expect(twice.tests[0].args).toEqual([[1, 2]])
  })

  it('fails tests, without crashing, when the wrong type is returned', () => {
    const result = executeExercise('function sum() { return "3" }', exercise)
    expect(result.status === 'ok' && result.results.map((t) => t.pass)).toEqual([false, false])
    expect(result.status === 'ok' && result.results[0].actualText).toBe('"3"')
  })

  it('provides helper functions declared by the exercise', () => {
    const usesDot: ExerciseDef = {
      ...exercise,
      entry: 'twice',
      helpers: ['dot'],
      tests: [{ name: 't', args: [[1, 2], [3, 4]], expected: 22 }],
    }
    const result = executeExercise('function twice(a: number[], b: number[]) { return 2 * dot(a, b) }', usesDot)
    expect(result.status === 'ok' && result.results[0].pass).toBe(true)
  })
})
