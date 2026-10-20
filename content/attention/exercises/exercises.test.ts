// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { executeExercise } from '@/lib/code/execute'
import { EXERCISES } from './index'

describe.each(Object.values(EXERCISES))('exercise $id', (exercise) => {
  it('reference solution passes every test', () => {
    const result = executeExercise(exercise.solution, exercise)
    expect(result.status).toBe('ok')
    if (result.status === 'ok') for (const t of result.results) expect(t.pass, t.name).toBe(true)
  })

  it('starter code fails at least one test (the exercise is not solved by itself)', () => {
    const result = executeExercise(exercise.starter, exercise)
    expect(result.status !== 'ok' || result.results.some((t) => !t.pass)).toBe(true)
  })

  it('has hints and a starter with the right function name', () => {
    expect(exercise.hints.length).toBeGreaterThan(0)
    expect(exercise.starter).toContain(`function ${exercise.entry}(`)
  })
})
