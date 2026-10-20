import { describe, expect, it } from 'vitest'
import { approxEqual } from './approx-equal'

describe('approxEqual', () => {
  it('compares numbers within the tolerance', () => {
    expect(approxEqual(0.1 + 0.2, 0.3, 1e-9)).toBe(true)
    expect(approxEqual(32.0000001, 32, 1e-6)).toBe(true)
    expect(approxEqual(1, 1.1, 0.01)).toBe(false)
  })

  it('treats -0 and 0 as equal', () => {
    expect(approxEqual(-0, 0, 1e-6)).toBe(true)
  })

  it('compares arrays element by element, including nested ones (matrices)', () => {
    expect(approxEqual([1, [2, 3]], [1, [2, 3.0000001]], 1e-6)).toBe(true)
    expect(approxEqual([[1, 2]], [[1, 3]], 1e-6)).toBe(false)
  })

  it('rejects different lengths and shapes', () => {
    expect(approxEqual([1, 2], [1, 2, 3], 1e-6)).toBe(false)
    expect(approxEqual([1], 1, 1e-6)).toBe(false)
    expect(approxEqual(1, [1], 1e-6)).toBe(false)
  })

  it('scales the tolerance for large numbers but stays absolute near zero', () => {
    expect(approxEqual(10000.005, 10000, 1e-6)).toBe(true)
    expect(approxEqual(1e-5, 0, 1e-6)).toBe(false)
    expect(approxEqual(1.0000005, 1, 1e-6)).toBe(true)
  })

  it('never throws on whatever student code returns', () => {
    for (const bad of [undefined, null, '32', Number.NaN, {}, () => 32, Number.POSITIVE_INFINITY]) {
      expect(approxEqual(bad, 32, 1e-6)).toBe(false)
    }
  })
})
