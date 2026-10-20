import type { ExerciseDef } from '@/lib/code/types'

export const dotExercise: ExerciseDef = {
  id: 'dot',
  title: 'Напиши dot(a, b)',
  entry: 'dot',
  prompt: 'Скалярное произведение: перемножь координаты попарно и сложи результаты.',
  starter: `function dot(a: number[], b: number[]): number {
  // Перемножь a[i] и b[i] для каждого i и сложи всё вместе.
  return 0
}
`,
  tests: [
    { name: 'dot([1, 2, 3], [4, 5, 6]) = 32', args: [[1, 2, 3], [4, 5, 6]], expected: 32 },
    { name: 'перпендикулярные: dot([1, 0, 0], [0, 1, 0]) = 0', args: [[1, 0, 0], [0, 1, 0]], expected: 0 },
    { name: 'отрицательные: dot([2, -1], [-3, 4]) = -10', args: [[2, -1], [-3, 4]], expected: -10 },
    { name: 'дроби: dot([0.5, 0.5], [2, 2]) = 2', args: [[0.5, 0.5], [2, 2]], expected: 2 },
    { name: 'пустые векторы: dot([], []) = 0', args: [[], []], expected: 0 },
  ],
  hints: [
    'Заведи переменную sum = 0 и пройди циклом по индексам i от 0 до a.length − 1.',
    'На каждом шаге прибавляй к sum произведение a[i] * b[i].',
    'После цикла верни sum.',
  ],
  solution: `function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}
`,
}
