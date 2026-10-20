import { describe, expect, it } from 'vitest'
import { EMBEDDINGS, pronounAttention, sentence, type Variant } from './toy-model'

const VARIANTS: Variant[] = ['tall', 'tired']

describe('toy model of the «он» riddle', () => {
  it('has a 3-number embedding for every token of both sentences', () => {
    for (const v of VARIANTS) for (const token of sentence(v)) expect(EMBEDDINGS[token], token).toHaveLength(3)
  })

  it('makes «он» look at «забор» when the fence is tall', () => {
    const { tokens, weights, target } = pronounAttention('tall')
    const fence = weights[tokens.indexOf('забор')]
    const cat = weights[tokens.indexOf('кот')]
    expect(target).toBe('забор')
    expect(fence).toBeGreaterThan(0.6)
    expect(fence / cat).toBeGreaterThan(5)
  })

  it('makes «он» look at «кот» when the cat is tired', () => {
    const { tokens, weights, target } = pronounAttention('tired')
    const fence = weights[tokens.indexOf('забор')]
    const cat = weights[tokens.indexOf('кот')]
    expect(target).toBe('кот')
    expect(cat).toBeGreaterThan(0.6)
    expect(cat / fence).toBeGreaterThan(5)
  })

  it('produces a probability distribution over the sentence', () => {
    for (const v of VARIANTS) {
      const { weights, tokens } = pronounAttention(v)
      expect(weights).toHaveLength(tokens.length)
      expect(weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1)
    }
  })
})
