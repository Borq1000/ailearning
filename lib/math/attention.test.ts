import { describe, expect, it } from 'vitest'
import { attention } from './attention'

describe('attention (scaled dot-product)', () => {
  it('matches a hand-computed example', () => {
    // d_k = 2: оценки [1, 0] / √2 = [0.7071, 0]; softmax → [0.6698, 0.3302]
    const { scores, weights, output } = attention(
      [[1, 0]],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 2],
        [3, 4],
      ],
    )
    expect(scores[0][0]).toBeCloseTo(0.7071, 4)
    expect(scores[0][1]).toBeCloseTo(0, 4)
    expect(weights[0][0]).toBeCloseTo(0.6698, 4)
    expect(weights[0][1]).toBeCloseTo(0.3302, 4)
    expect(output[0][0]).toBeCloseTo(1.6605, 3)
    expect(output[0][1]).toBeCloseTo(2.6605, 3)
  })

  it('produces one probability row per query', () => {
    const Q = [
      [1, 0, 1],
      [0, 1, 0],
    ]
    const K = [
      [1, 1, 0],
      [0, 1, 1],
      [1, 0, 0],
    ]
    const { weights } = attention(Q, K, K)
    expect(weights).toHaveLength(2)
    for (const row of weights) expect(row.reduce((s, x) => s + x, 0)).toBeCloseTo(1)
  })
})
