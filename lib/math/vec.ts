export type Vec = number[]

function assertSameLength(a: Vec, b: Vec, op: string): void {
  if (a.length !== b.length) {
    throw new Error(`${op}: vectors must have the same length (got ${a.length} and ${b.length})`)
  }
}

export function add(a: Vec, b: Vec): Vec {
  assertSameLength(a, b, 'add')
  return a.map((x, i) => x + b[i])
}

export function sub(a: Vec, b: Vec): Vec {
  assertSameLength(a, b, 'sub')
  return a.map((x, i) => x - b[i])
}

export function scale(a: Vec, k: number): Vec {
  return a.map((x) => x * k)
}

export function dot(a: Vec, b: Vec): number {
  assertSameLength(a, b, 'dot')
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

export function norm(a: Vec): number {
  return Math.sqrt(dot(a, a))
}

/** Косинусная похожесть; для нулевого вектора — 0 (направления нет). */
export function cosine(a: Vec, b: Vec): number {
  const lengths = norm(a) * norm(b)
  return lengths === 0 ? 0 : dot(a, b) / lengths
}

/** Угол между векторами в градусах; для нулевого вектора — NaN. */
export function angleDeg(a: Vec, b: Vec): number {
  if (norm(a) === 0 || norm(b) === 0) return NaN
  const c = Math.min(1, Math.max(-1, cosine(a, b)))
  return (Math.acos(c) * 180) / Math.PI
}
