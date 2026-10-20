import { BACKUP_KEY } from './storage'
import type { ProgressData } from './types'

export const CURRENT_VERSION = 1

const RECORD_KEYS = ['lessons', 'gates', 'code', 'explanations', 'cards', 'customCards'] as const

export function emptyProgress(): ProgressData {
  return { version: 1, lessons: {}, gates: {}, code: {}, explanations: {}, cards: {}, customCards: {} }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Берёт из сырых данных только разделы правильной формы; остальное заменяет пустым. */
export function normalizeProgress(raw: unknown): ProgressData {
  const result = emptyProgress()
  if (!isPlainObject(raw)) return result
  for (const key of RECORD_KEYS) {
    const section = raw[key]
    if (isPlainObject(section)) (result as unknown as Record<string, unknown>)[key] = section
  }
  return result
}

function backupRaw(data: unknown): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(BACKUP_KEY, JSON.stringify(data))
  } catch {
    // хранилище недоступно — резервную копию сделать нельзя
  }
}

/** v1 — первая схема. Любая другая версия неизвестна: сохраняем копию и начинаем с чистого листа. */
export function migrateProgress(persisted: unknown, version: number): ProgressData {
  if (version === CURRENT_VERSION) return normalizeProgress(persisted)
  backupRaw(persisted)
  return emptyProgress()
}
