import { dot, type Vec } from './vec'

export type Mat = number[][]

export function shape(m: Mat): [number, number] {
  return [m.length, m.length === 0 ? 0 : m[0].length]
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
