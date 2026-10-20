/**
 * Сравнивает ответ кода ученика с ожидаемым: числа — с допуском, массивы (и матрицы) — поэлементно.
 * Не должна бросать исключений ни на каком входе: код ученика может вернуть что угодно.
 */
export function approxEqual(actual: unknown, expected: unknown, tolerance: number): boolean {
  // Гибридный допуск: абсолютный для маленьких чисел (вероятности softmax), относительный для больших (произведения матриц).
  if (typeof expected === 'number') {
    return (
      typeof actual === 'number' &&
      Number.isFinite(actual) &&
      Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
    )
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, i) => approxEqual(actual[i], item, tolerance))
    )
  }
  return Object.is(actual, expected)
}
