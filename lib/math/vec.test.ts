import { describe, expect, it } from 'vitest'
import { add, angleDeg, cosine, dot, norm, scale, sub } from './vec'

describe('vec', () => {
  it('adds, subtracts and scales coordinate-wise', () => {
    expect(add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9])
    expect(sub([4, 5, 6], [1, 2, 3])).toEqual([3, 3, 3])
    expect(scale([1, -2, 0.5], 2)).toEqual([2, -4, 1])
  })

  it('computes the dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32)
    expect(dot([1, 0, 0], [0, 1, 0])).toBe(0)
    expect(dot([], [])).toBe(0)
  })

  it('refuses vectors of different length', () => {
    expect(() => dot([1, 2], [1, 2, 3])).toThrow(/same length/)
    expect(() => add([1], [1, 2])).toThrow(/same length/)
  })

  it('computes length, cosine and angle', () => {
    expect(norm([3, 4, 0])).toBe(5)
    expect(cosine([1, 1, 0], [3, 3, 0])).toBeCloseTo(1)
    expect(cosine([1, 0, 0], [0, 2, 0])).toBeCloseTo(0)
    expect(cosine([1, 0, 0], [-5, 0, 0])).toBeCloseTo(-1)
    expect(cosine([0, 0, 0], [1, 2, 3])).toBe(0)
    expect(angleDeg([1, 0, 0], [0, 1, 0])).toBeCloseTo(90)
    expect(angleDeg([1, 0, 0], [1, 0, 0])).toBeCloseTo(0)
    expect(angleDeg([0, 0, 0], [1, 0, 0])).toBeNaN()
  })
})
