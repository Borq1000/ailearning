import { attention, matVec, add, type Mat, type Vec } from '@/lib/math'

/** Оси игрушечного пространства смыслов (d = 3). */
export const AXES = ['живое', 'высокое', 'предмет'] as const

export type Variant = 'tall' | 'tired'

export const ADJECTIVE: Record<Variant, string> = { tall: 'высоким', tired: 'уставшим' }

const BASE_TOKENS = ['кот', 'не', 'перепрыгнул', 'через', 'забор', 'потому', 'что', 'он', 'был', 'слишком'] as const

/** Векторы слов: [живое, высокое, предмет]. Прилагательные — «свойства», поэтому предметность у них отрицательная. */
export const EMBEDDINGS: Record<string, Vec> = {
  кот: [1, 0, 1],
  забор: [0, 1, 1],
  он: [0, 0, 0.5],
  высоким: [0, 1, -0.5],
  уставшим: [1, 0, -0.5],
  перепрыгнул: [0.3, 0.3, 0],
  не: [0, 0, 0],
  через: [0, 0, 0],
  потому: [0, 0, 0],
  что: [0, 0, 0],
  был: [0, 0, 0],
  слишком: [0, 0, 0],
}

const IDENTITY: Mat = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]

/** Шаг 1: «он» перенимает у прилагательного свойство (живое/высокое), но не «предметность». */
export const W_V1: Mat = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
]

/** Шаг 2: запрос ищет совпадение свойства (×3) и предметность (×6); ключ и значение — само слово. */
export const W_Q: Mat = [
  [3, 0, 0],
  [0, 3, 0],
  [0, 0, 6],
]
export const W_K: Mat = IDENTITY
export const W_V: Mat = IDENTITY

export function sentence(variant: Variant): string[] {
  return [...BASE_TOKENS, ADJECTIVE[variant]]
}

/** Вектор «он» после первого шага: «он» + свойство прилагательного. */
export function contextualizePronoun(variant: Variant): Vec {
  return add(EMBEDDINGS['он'], matVec(W_V1, EMBEDDINGS[ADJECTIVE[variant]]))
}

export interface PronounAttention {
  tokens: string[]
  weights: number[]
  target: string
}

/** Внимание обогащённого «он» ко всем словам фразы (одна строка softmax(qKᵀ/√3)). */
export function pronounAttention(variant: Variant): PronounAttention {
  const tokens = sentence(variant)
  const query = matVec(W_Q, contextualizePronoun(variant))
  const keys = tokens.map((t) => matVec(W_K, EMBEDDINGS[t]))
  const values = tokens.map((t) => matVec(W_V, EMBEDDINGS[t]))
  const weights = attention([query], keys, values).weights[0]
  const target = tokens[weights.indexOf(Math.max(...weights))]
  return { tokens, weights, target }
}
