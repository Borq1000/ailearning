import { add, dot, norm, scale, type Vec } from '@/lib/math'

/** Половина размера видимого пространства сцены (координаты от −4 до 4). */
export const BOUND = 4

export function snapVec(v: Vec, step = 0.5, bound = BOUND): Vec {
  return v.map((x) => {
    const clamped = Math.max(-bound, Math.min(bound, Math.round(x / step) * step))
    return clamped === 0 ? 0 : clamped
  })
}

export function formatNum(x: number): string {
  if (!Number.isFinite(x)) return '—'
  const rounded = Math.round(x * 100) / 100
  return String(rounded === 0 ? 0 : rounded)
}

export function formatVec(v: Vec): string {
  return `[${v.map(formatNum).join(', ')}]`
}

export function vecEquals(a: Vec, b: Vec, eps = 1e-9): boolean {
  return a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= eps)
}

export type DotRelation = 'same' | 'perpendicular' | 'opposite'

export function describeDot(d: number, eps = 1e-9): DotRelation {
  if (Math.abs(d) <= eps) return 'perpendicular'
  return d > 0 ? 'same' : 'opposite'
}

export const DOT_RELATION_TEXT: Record<DotRelation, string> = {
  same: 'смотрят в одну сторону: a·b > 0',
  perpendicular: 'перпендикулярны: a·b = 0',
  opposite: 'смотрят в разные стороны: a·b < 0',
}

function signed(x: number): string {
  return x < 0 ? `(${formatNum(x)})` : formatNum(x)
}

/** «2·3 + (-1)·4 + 0·5 = 2» — вычисление скалярного произведения по шагам. */
export function dotBreakdown(a: Vec, b: Vec): string {
  const terms = a.map((x, i) => `${signed(x)}·${signed(b[i])}`)
  return `${terms.join(' + ')} = ${formatNum(dot(a, b))}`
}

/** Точки дуги угла между векторами (на сфере радиуса radius); null, если угла нет. */
export function arcPoints(a: Vec, b: Vec, radius = 0.8, segments = 24): Vec[] | null {
  const na = norm(a)
  const nb = norm(b)
  if (na === 0 || nb === 0) return null
  const ua = scale(a, 1 / na)
  const ub = scale(b, 1 / nb)
  if (Math.abs(dot(ua, ub)) > 0.9999) return null
  return Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments
    const p = add(scale(ua, 1 - t), scale(ub, t))
    return scale(p, radius / norm(p))
  })
}
