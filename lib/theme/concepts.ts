/** Цвет понятия одинаков в тексте (ink — на бумаге) и в сценах (glow — в обсерватории). */
export const CONCEPTS = {
  query: { ink: '#0e7490', glow: '#22d3ee', label: 'запрос' },
  key: { ink: '#c2410c', glow: '#fb923c', label: 'ключ' },
  value: { ink: '#6d28d9', glow: '#a78bfa', label: 'значение' },
  focus: { ink: '#0e7490', glow: '#22d3ee', label: 'фокус' },
  target: { ink: '#c2410c', glow: '#fb923c', label: 'цель' },
  a: { ink: '#0e7490', glow: '#22d3ee', label: 'a' },
  b: { ink: '#c2410c', glow: '#fb923c', label: 'b' },
  result: { ink: '#3f6212', glow: '#a3e635', label: 'результат' },
} as const

export type ConceptKey = keyof typeof CONCEPTS
