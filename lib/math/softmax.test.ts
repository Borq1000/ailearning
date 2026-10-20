import { describe, expect, it } from 'vitest'
import { softmax } from './softmax'

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

describe('softmax', () => {
  it('turns any scores into probabilities that sum to 1', () => {
    const p = softmax([2, 1, 0.1])
    expect(sum(p)).toBeCloseTo(1)
    expect(p[0]).toBeGreaterThan(p[1])
    expect(p[1]).toBeGreaterThan(p[2])
  })

  it('gives equal shares to equal scores', () => {
    expect(softmax([0, 0])).toEqual([0.5, 0.5])
  })

  it('does not change when the same number is added to every score', () => {
    const a = softmax([1, 2, 3])
    const b = softmax([11, 12, 13])
    a.forEach((x, i) => expect(x).toBeCloseTo(b[i]))
  })

  it('stays numerically stable for huge scores', () => {
    const p = softmax([1000, 1001])
    expect(p[0]).toBeCloseTo(0.2689, 4)
    expect(p[1]).toBeCloseTo(0.7311, 4)
  })

  it('gets sharper with lower temperature', () => {
    expect(softmax([1, 2], 0.5)[1]).toBeGreaterThan(softmax([1, 2], 1)[1])
    expect(() => softmax([1, 2], 0)).toThrow(/temperature/)
  })

  it('returns an empty list for no scores', () => {
    expect(softmax([])).toEqual([])
  })
})
