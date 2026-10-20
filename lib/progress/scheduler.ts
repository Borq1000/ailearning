import type { Box, CardState } from './types'

/** Интервал (в днях) для коробок Лейтнера 1–5. */
export const INTERVALS = [1, 3, 7, 16, 35] as const
export const MAX_BOX = 5

/** Локальная дата пользователя в формате 'YYYY-MM-DD'. */
export function todayISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function newCard(today: string): CardState {
  return { box: 1, due: addDays(today, INTERVALS[0]) }
}

export function nextReview(card: CardState, correct: boolean, today: string): CardState {
  const box = (correct ? Math.min(card.box + 1, MAX_BOX) : 1) as Box
  return { box, due: addDays(today, INTERVALS[box - 1]) }
}

/** ISO-даты сравниваются как строки. */
export function isDue(card: CardState, today: string): boolean {
  return card.due <= today
}

/** FNV-1a: строка → 32-битное число (зерно для перемешивания). */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Детерминированное перемешивание Фишера–Йетса: одинаковое зерно → одинаковый порядок. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = mulberry32(hashString(seed))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Какие карточки показать в разминке урока.
 * Правила (их фиксируют тесты): берём только из candidateIds; если среди них есть карточки
 * со сроком «сегодня или раньше» — до трёх таких; если нет ни одной — две любые
 * (детерминированно по seed); результат одинаков для одинаковых аргументов.
 */
export function pickRecallCards(
  candidateIds: readonly string[],
  states: Readonly<Record<string, CardState>>,
  today: string,
  seed: string,
): string[] {
  // Для новичка сначала укрепляем самое шаткое: меньшая коробка первой, среди равных — самая просроченная.
  const due = candidateIds.filter((id) => states[id] !== undefined && isDue(states[id], today))
  if (due.length > 0) {
    return [...due]
      .sort((a, b) => states[a].box - states[b].box || states[a].due.localeCompare(states[b].due) || a.localeCompare(b))
      .slice(0, 3)
  }
  return seededShuffle(candidateIds, seed).slice(0, 2)
}
