import { dot, type Vec } from './vec'

export type Mat = number[][]

/** Размер матрицы [строк, столбцов]. «Рваная» матрица (строки разной длины) — ошибка, а не тихий мусор. */
export function shape(m: Mat): [number, number] {
  const cols = m.length === 0 ? 0 : m[0].length
  const ragged = m.findIndex((row) => row.length !== cols)
  if (ragged !== -1) {
    throw new Error(`mat: ragged matrix (row ${ragged} has ${m[ragged].length} columns, expected ${cols})`)
  }
  return [m.length, cols]
}

export function transpose(m: Mat): Mat {
  const [rows, cols] = shape(m)
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => m[i][j]))
}

/** Матрица × вектор: каждая строка матрицы скалярно умножается на вектор. */
export function matVec(m: Mat, v: Vec): Vec {
  return m.map((row) => dot(row, v))
}

export function matMul(a: Mat, b: Mat): Mat {
  const [, aCols] = shape(a)
  const [bRows] = shape(b)
  if (aCols !== bRows) {
    throw new Error(`matMul: shapes ${shape(a).join('×')} and ${shape(b).join('×')} are incompatible`)
  }
  const bt = transpose(b)
  return a.map((row) => bt.map((col) => dot(row, col)))
}
