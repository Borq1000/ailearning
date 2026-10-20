/** Разбирает число, введённое человеком: «0,5», «−4» (типографский минус), «1 000». */
export function parseNumber(input: string): number | null {
  const cleaned = input
    .replace(/[\s  ]/g, '')
    .replace(/[−–]/g, '-')
    .replace(',', '.')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null
  return Number(cleaned)
}
