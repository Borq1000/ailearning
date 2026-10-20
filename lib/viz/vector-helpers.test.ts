import { describe, expect, it } from 'vitest'
import { arcPoints, describeDot, dotBreakdown, formatNum, formatVec, snapVec, vecEquals } from './vector-helpers'

describe('snapVec', () => {
  it('rounds to the grid step and clamps to the bounds', () => {
    expect(snapVec([1.26, -0.24, 9])).toEqual([1.5, 0, 4])
    expect(snapVec([-7, 0.74, 2.25])).toEqual([-4, 0.5, 2.5])
  })

  it('never returns negative zero', () => {
    expect(Object.is(snapVec([-0.1])[0], -0)).toBe(false)
  })
})

describe('formatting', () => {
  it('prints short, readable numbers', () => {
    expect(formatNum(1 / 3)).toBe('0.33')
    expect(formatNum(-0)).toBe('0')
    expect(formatNum(Number.NaN)).toBe('—')
    expect(formatVec([1, 0.5, -2])).toBe('[1, 0.5, -2]')
  })
})

describe('vecEquals', () => {
  it('compares within a tolerance', () => {
    expect(vecEquals([2, 1, 3], [2.004, 1, 3], 0.01)).toBe(true)
    expect(vecEquals([2, 1, 3], [2, 1], 0.01)).toBe(false)
  })
})

describe('dot product helpers', () => {
  it('describes the sign of the dot product', () => {
    expect(describeDot(4)).toBe('same')
    expect(describeDot(0)).toBe('perpendicular')
    expect(describeDot(-0.5)).toBe('opposite')
  })

  it('spells out the computation', () => {
    expect(dotBreakdown([2, -1, 0], [3, 4, 5])).toBe('2·3 + (-1)·4 + 0·5 = 2')
  })

  it('builds an angle arc between two directions', () => {
    const points = arcPoints([1, 0, 0], [0, 1, 0])!
    expect(points).toHaveLength(25)
    expect(points[0][0]).toBeCloseTo(0.8)
    expect(points[24][1]).toBeCloseTo(0.8)
  })

  it('skips the arc for parallel or zero vectors', () => {
    expect(arcPoints([1, 0, 0], [2, 0, 0])).toBeNull()
    expect(arcPoints([0, 0, 0], [1, 0, 0])).toBeNull()
  })
})
