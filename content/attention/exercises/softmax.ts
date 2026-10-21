import type { ExerciseDef } from '@/lib/code/types'

export const softmaxExercise: ExerciseDef = {
  id: 'softmax',
  title: 'Напиши softmax(xs)',
  entry: 'softmax',
  prompt: 'Любые оценки → доли, которые в сумме дают 1: возведи e в каждую оценку и раздели на сумму. И не забудь про большие числа.',
  starter: `function softmax(xs: number[]): number[] {
  // 1) exps — e в степени каждой оценки (Math.exp)
  // 2) total — сумма exps
  // 3) верни exps, делённые на total
  return []
}
`,
  tests: [
    { name: 'softmax([0, 0]) = [0.5, 0.5]', args: [[0, 0]], expected: [0.5, 0.5] },
    {
      name: 'softmax([2, 1, 0]) ≈ [0.665, 0.245, 0.090]',
      args: [[2, 1, 0]],
      expected: [0.66524, 0.24473, 0.09003],
      tolerance: 1e-3,
    },
    {
      name: 'сдвиг не меняет ответ: softmax([11, 12, 13]) = softmax([1, 2, 3])',
      args: [[11, 12, 13]],
      expected: [0.09003, 0.24473, 0.66524],
      tolerance: 1e-3,
    },
    {
      name: 'большие оценки: softmax([1000, 1001]) ≈ [0.269, 0.731]',
      args: [[1000, 1001]],
      expected: [0.26894, 0.73106],
      tolerance: 1e-3,
    },
    {
      name: 'отрицательные оценки тоже годятся: softmax([−1, −1, −1]) = [⅓, ⅓, ⅓]',
      args: [[-1, -1, -1]],
      expected: [1 / 3, 1 / 3, 1 / 3],
      tolerance: 1e-3,
    },
    { name: 'пустой список → пустой список', args: [[]], expected: [] },
  ],
  hints: [
    'Math.exp(x) — это eˣ. Начни с const exps = xs.map((x) => Math.exp(x)).',
    'Сумма: const total = exps.reduce((s, x) => s + x, 0). Доли: exps.map((e) => e / total).',
    'Тест [1000, 1001] падает, потому что Math.exp(1000) = Infinity, а Infinity / Infinity = NaN. Вычти из всех оценок максимум (Math.max(...xs)) перед экспонентой — ответ не изменится (как «+10 ко всем»), а переполнения не будет.',
  ],
  solution: `function softmax(xs: number[]): number[] {
  if (xs.length === 0) return []
  const max = Math.max(...xs)
  const exps = xs.map((x) => Math.exp(x - max))
  const total = exps.reduce((s, x) => s + x, 0)
  return exps.map((e) => e / total)
}
`,
}
