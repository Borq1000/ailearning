import type { ExerciseDef } from '@/lib/code/types'

export const similarityExercise: ExerciseDef = {
  id: 'similarity',
  title: 'Напиши similarity(query, vectors)',
  entry: 'similarity',
  prompt: 'Насколько слово-запрос похоже на каждое из слов: скалярные произведения → softmax. Получатся доли, которые в сумме дают 1 — почти настоящие веса внимания.',
  helpers: ['dot', 'softmax'],
  starter: `function similarity(query: number[], vectors: number[][]): number[] {
  // 1) оценки: dot(query, v) для каждого v из vectors
  // 2) softmax превращает оценки в доли
  return []
}
`,
  tests: [
    {
      name: '«кот» среди [кот, забор, он]: оценки 2, 1, 0.5 → доли ≈ [0.63, 0.23, 0.14]',
      args: [[1, 0, 1], [[1, 0, 1], [0, 1, 1], [0, 0, 0.5]]],
      expected: [0.62853, 0.23122, 0.14025],
      tolerance: 1e-3,
    },
    {
      name: 'запрос перпендикулярен всем словам — доли равны',
      args: [[0, 0, 1], [[1, 0, 0], [0, 1, 0]]],
      expected: [0.5, 0.5],
    },
    {
      name: 'одно слово намного ближе остальных — оно получает почти всё',
      args: [[3, 0, 0], [[3, 0, 0], [0, 3, 0]]],
      expected: [0.99988, 0.00012],
      tolerance: 1e-3,
    },
    { name: 'нет слов — нет долей', args: [[1, 2, 3], []], expected: [] },
  ],
  hints: [
    'Оценки — это массив: vectors.map((v) => dot(query, v)).',
    'softmax уже умеет превращать массив оценок в доли: softmax(оценки).',
    'Итого одна строка: return softmax(vectors.map((v) => dot(query, v)))',
  ],
  solution: `function similarity(query: number[], vectors: number[][]): number[] {
  return softmax(vectors.map((v) => dot(query, v)))
}
`,
}
