import { describe, expect, it } from 'vitest'
import { matMul, matVec, shape, transpose } from './mat'

describe('mat', () => {
  it('reports shape and transposes', () => {
    const m = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    expect(shape(m)).toEqual([2, 3])
    expect(transpose(m)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ])
    expect(shape([])).toEqual([0, 0])
  })

  it('multiplies a matrix by a vector as row dot products', () => {
    expect(
      matVec(
        [
          [1, 0, 2],
          [0, 3, 0],
        ],
        [1, 2, 3],
      ),
    ).toEqual([7, 6])
  })

  it('multiplies compatible matrices', () => {
    const a = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    const b = [
      [7, 8],
      [9, 10],
      [11, 12],
    ]
    expect(matMul(a, b)).toEqual([
      [58, 64],
      [139, 154],
    ])
  })

  it('refuses incompatible shapes', () => {
    expect(() => matMul([[1, 2]], [[1, 2]])).toThrow(/incompatible/)
  })
})
