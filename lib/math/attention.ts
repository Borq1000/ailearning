import { matMul, transpose, type Mat } from './mat'
import { softmax } from './softmax'

export interface AttentionResult {
  scores: Mat
  weights: Mat
  output: Mat
}

/** Scaled dot-product attention: softmax(QKᵀ / √dₖ) · V (Vaswani et al., 2017, формула 1). */
export function attention(Q: Mat, K: Mat, V: Mat): AttentionResult {
  const dk = K[0]?.length ?? 0
  if (dk === 0) throw new Error('attention: keys must not be empty')
  const factor = 1 / Math.sqrt(dk)
  const scores = matMul(Q, transpose(K)).map((row) => row.map((s) => s * factor))
  const weights = scores.map((row) => softmax(row))
  return { scores, weights, output: matMul(weights, V) }
}
