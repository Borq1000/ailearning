/** Превращает любые оценки в вероятности. Вычитание максимума защищает от переполнения exp. */
export function softmax(xs: number[], temperature = 1): number[] {
  // `!(t > 0)`, а не `t <= 0`: NaN не проходит ни одно сравнение, и его тоже надо отвергнуть
  if (!(temperature > 0)) throw new Error('softmax: temperature must be positive')
  if (xs.length === 0) return []
  const scaled = xs.map((x) => x / temperature)
  const max = Math.max(...scaled)
  // Все оценки −∞ (все позиции закрыты маской): смотреть некуда — делим внимание поровну, а не отдаём NaN
  if (max === -Infinity) return xs.map(() => 1 / xs.length)
  const exps = scaled.map((x) => Math.exp(x - max))
  const total = exps.reduce((s, x) => s + x, 0)
  return exps.map((x) => x / total)
}
