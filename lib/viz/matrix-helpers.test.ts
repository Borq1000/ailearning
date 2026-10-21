import { describe, expect, it } from 'vitest'
import {
  CUBE_EDGES,
  IMPOSSIBLE,
  PRESETS,
  column,
  cubeCorners,
  matEquals,
  matVecBreakdown,
  productShape,
  shapeOptions,
  transformPoints,
} from './matrix-helpers'

describe('matrix helpers', () => {
  it('builds a cube with 8 corners and 12 edges between neighbouring corners', () => {
    const corners = cubeCorners(1)
    expect(corners).toHaveLength(8)
    expect(CUBE_EDGES).toHaveLength(12)
    for (const [a, b] of CUBE_EDGES) {
      const differing = corners[a].filter((x, i) => x !== corners[b][i]).length
      expect(differing).toBe(1)
    }
    expect(transformPoints([[2, 0, 0], [0, 1, 0], [0, 0, 1]], corners)[7]).toEqual([2, 1, 1])
  })

  it('reads columns and explains M·v row by row', () => {
    const m = [
      [1, 0, 2],
      [0, 3, 0],
      [1, 1, 1],
    ]
    expect(column(m, 2)).toEqual([2, 0, 1])
    expect(matVecBreakdown(m, [1, 2, 3])).toEqual([
      '[1, 0, 2]·[1, 2, 3] = 7',
      '[0, 3, 0]·[1, 2, 3] = 6',
      '[1, 1, 1]·[1, 2, 3] = 6',
    ])
  })

  it('knows which shapes multiply and what comes out', () => {
    expect(productShape([2, 3], [3, 4])).toEqual([2, 4])
    expect(productShape([2, 3], [2, 3])).toBeNull()
    expect(shapeOptions([2, 3], [3, 4])).toEqual(['2×4', '3×3', IMPOSSIBLE])
    expect(shapeOptions([2, 3], [2, 3])).toEqual(['2×3', '3×2', IMPOSSIBLE])
    expect(shapeOptions([1, 3], [3, 1])).toEqual(['1×1', '3×3', IMPOSSIBLE])
  })

  it('compares matrices approximately and ships sensible presets', () => {
    expect(matEquals([[1, 0], [0, 1]], [[1, 0], [0, 1 + 1e-12]])).toBe(true)
    expect(matEquals([[1, 0], [0, 1]], [[1, 0], [0, 2]])).toBe(false)
    expect(matEquals([[1]], [[1, 2]])).toBe(false)
    expect(PRESETS.map((p) => p.id)).toEqual(['identity', 'stretch-x', 'rotate-z', 'flatten-z', 'swap-xy'])
    expect(new Set(PRESETS.map((p) => p.label)).size).toBe(PRESETS.length)
  })
})
