import type { ExerciseDef } from '@/lib/code/types'

export const matMulExercise: ExerciseDef = {
  id: 'matMul',
  title: 'Напиши matMul(a, b)',
  entry: 'matMul',
  prompt: 'Ячейка (i, j) результата — скалярное произведение строки i матрицы a на столбец j матрицы b. Доступны dot и transpose.',
  helpers: ['dot', 'transpose'],
  starter: `function matMul(a: number[][], b: number[][]): number[][] {
  // transpose(b) превращает столбцы b в строки — тогда каждая ячейка это dot(строка a, строка transpose(b)).
  return []
}
`,
  tests: [
    {
      name: '[[1, 2], [3, 4]]·[[5, 6], [7, 8]] = [[19, 22], [43, 50]]',
      args: [[[1, 2], [3, 4]], [[5, 6], [7, 8]]],
      expected: [[19, 22], [43, 50]],
    },
    {
      name: 'единичная матрица не меняет матрицу',
      args: [[[1, 0], [0, 1]], [[2, 3], [4, 5]]],
      expected: [[2, 3], [4, 5]],
    },
    {
      name: '2×3 на 3×2 даёт 2×2',
      args: [[[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]],
      expected: [[58, 64], [139, 154]],
    },
    {
      name: 'строка на столбец — одно число: [[1, 2, 3]]·[[4], [5], [6]] = [[32]]',
      args: [[[1, 2, 3]], [[4], [5], [6]]],
      expected: [[32]],
    },
    {
      name: 'b — это уже Kᵀ: Q·Kᵀ для трёх слов — таблица похожестей',
      args: [[[1, 0, 1], [0, 1, 1], [0, 0, 0.5]], [[1, 0, 0], [0, 1, 0], [1, 1, 0.5]]],
      expected: [[2, 1, 0.5], [1, 2, 0.5], [0.5, 0.5, 0.25]],
    },
  ],
  hints: [
    'Сначала bt = transpose(b): теперь bt[j] — это j-й столбец b, записанный строкой.',
    'Строка i результата — это массив из dot(a[i], bt[j]) для каждого j: a.map((row) => bt.map((col) => dot(row, col))).',
    'Итого две строки: const bt = transpose(b); return a.map((row) => bt.map((col) => dot(row, col)))',
  ],
  solution: `function matMul(a: number[][], b: number[][]): number[][] {
  const bt = transpose(b)
  return a.map((row) => bt.map((col) => dot(row, col)))
}
`,
}
