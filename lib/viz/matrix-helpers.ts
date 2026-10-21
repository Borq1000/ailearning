import { dot, matVec, type Mat, type Vec } from '@/lib/math'
import { formatNum, formatVec } from './vector-helpers'

/** Границы ячейки матрицы в полях сцены: ±3 хватает для поворотов, растяжений и сплющиваний, а куб не улетает за сетку. */
export const MATRIX_BOUND = 3
/** Сетка сцены матрицы — клетки от −3 до 3 по каждой оси. */
export const MATRIX_GRID_BOUND = 3

/** Точка вышла за сетку сцены хотя бы по одной координате. */
export function outsideGrid(v: Vec, bound = MATRIX_GRID_BOUND): boolean {
  return v.some((x) => Math.abs(x) > bound)
}

export type PresetId = 'identity' | 'stretch-x' | 'rotate-z' | 'flatten-z' | 'swap-xy'

export interface MatrixPreset {
  id: PresetId
  label: string
  matrix: Mat
  hint: string
}

export const PRESETS: MatrixPreset[] = [
  {
    id: 'identity',
    label: 'как было',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    hint: 'Единичная матрица: каждая стрелка остаётся на месте.',
  },
  {
    id: 'stretch-x',
    label: 'растянуть X ×2',
    matrix: [
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    hint: 'Первая координата удваивается, остальные не меняются.',
  },
  {
    id: 'rotate-z',
    label: 'повернуть на 90°',
    matrix: [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    hint: 'Поворот вокруг оси Z: ось X переходит туда, где была ось Y.',
  },
  {
    id: 'flatten-z',
    label: 'сплющить Z',
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    hint: 'Третья координата обнуляется: всё пространство ложится на плоскость XY. Такая матрица есть в игрушечной модели из урока 0.1: «он» перенимает у прилагательного свойство, но не предметность.',
  },
  {
    id: 'swap-xy',
    label: 'поменять X и Y',
    matrix: [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    hint: 'Первая и вторая координаты меняются местами.',
  },
]

/** Вершины куба со стороной size и углом в начале координат; бит i номера вершины — координата i. */
export function cubeCorners(size = 1): Vec[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? size : 0, i & 2 ? size : 0, i & 4 ? size : 0])
}

/** Пары индексов вершин, соединённых ребром: соседи отличаются ровно одним битом. */
export const CUBE_EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

export function transformPoints(m: Mat, points: Vec[]): Vec[] {
  return points.map((p) => matVec(m, p))
}

/** Столбец j матрицы — образ j-й оси. */
export function column(m: Mat, j: number): Vec {
  return m.map((row) => row[j])
}

/** «[1, 0, 2]·[1, 2, 3] = 7» для каждой строки: M·v как несколько скалярных произведений. */
export function matVecBreakdown(m: Mat, v: Vec): string[] {
  return m.map((row) => `${formatVec(row)}·${formatVec(v)} = ${formatNum(dot(row, v))}`)
}

export function matEquals(a: Mat, b: Mat, eps = 1e-9): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) => row.length === b[i].length && row.every((x, j) => Math.abs(x - b[i][j]) <= eps))
  )
}

export type Shape = [number, number]

export const IMPOSSIBLE = 'Перемножить нельзя'

export function formatShape(s: Shape): string {
  return `${s[0]}×${s[1]}`
}

/** Форма A·B или null, если столбцов A не столько, сколько строк B. */
export function productShape(a: Shape, b: Shape): Shape | null {
  return a[1] === b[0] ? [a[0], b[1]] : null
}

/** Варианты ответа для игры: правильный, «перепутанные» формы и «нельзя»; без повторов, в фиксированном порядке. */
export function shapeOptions(a: Shape, b: Shape): string[] {
  const candidates = [formatShape([a[0], b[1]]), formatShape([a[1], b[0]]), formatShape([b[0], a[1]]), IMPOSSIBLE]
  return candidates.filter((option, i) => candidates.indexOf(option) === i)
}
