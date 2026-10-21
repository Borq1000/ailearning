import type { StateStorage } from 'zustand/middleware'

export const STORAGE_KEY = 'ailearning:v2'
/**
 * Ключ прошлых версий сайта (M1a и ранние сборки M1b). Его читают и пишут вкладки старой версии,
 * поэтому новый код читает его один раз — для переноса прогресса — и никогда не пишет и не удаляет.
 */
export const LEGACY_STORAGE_KEY = 'ailearning:v1'
/** Отметка «прогресс из старого ключа уже перенесён»: после аварийного сброса он не должен вернуться. */
export const LEGACY_IMPORTED_KEY = 'ailearning:v1-imported'
export const BACKUP_KEY = 'ailearning:backup'

/** Хранилище с синхронным чтением: localStorage или его замена в памяти. */
export interface SyncStorage extends StateStorage<void> {
  getItem: (key: string) => string | null
}

export function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__ailearning_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function createMemoryStorage(): SyncStorage {
  const memory = new Map<string, string>()
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  }
}

/** Сохранённый прогресс как есть, без разбора — для аварийной выгрузки. */
export function readRawProgress(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Прогресс из старого ключа для одноразового переноса. null — если его уже перенесли, если его нет
 * или он не разбирается как JSON (тогда его не трогаем: старая вкладка разберётся с ним сама).
 */
export function readLegacyProgress(): string | null {
  try {
    if (window.localStorage.getItem(LEGACY_IMPORTED_KEY) !== null) return null
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw === null) return null
    JSON.parse(raw)
    return raw
  } catch {
    return null
  }
}

export function markLegacyImported(): void {
  try {
    window.localStorage.setItem(LEGACY_IMPORTED_KEY, '1')
  } catch {
    // хранилище недоступно — переносить было нечего
  }
}

/** Резервная копия как есть (битый JSON, чужая версия) — для восстановления или выгрузки. */
export function readBackup(): string | null {
  try {
    return window.localStorage.getItem(BACKUP_KEY)
  } catch {
    return null
  }
}

/** Аварийный сброс: копия прогресса уходит в `ailearning:backup`, затем сам прогресс удаляется. */
export function resetStoredProgress(): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return
    try {
      window.localStorage.setItem(BACKUP_KEY, raw)
    } catch {
      // места на копию нет — прогресс всё равно сбрасываем, иначе сайт не откроется
    }
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // хранилище недоступно — сбрасывать нечего
  }
}

/** localStorage с защитой: битый JSON уходит в резервную копию, переполнение не роняет приложение. */
export function createSafeStorage(): SyncStorage {
  if (typeof window === 'undefined' || !isLocalStorageAvailable()) return createMemoryStorage()
  return {
    getItem: (key) => {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return null
      try {
        JSON.parse(raw)
        return raw
      } catch {
        try {
          window.localStorage.setItem(BACKUP_KEY, raw)
          window.localStorage.removeItem(key)
        } catch {
          // не удалось сохранить копию — всё равно сообщаем, что данных нет
        }
        return null
      }
    },
    setItem: (key, value) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // квота переполнена: состояние остаётся в памяти до конца сессии
      }
    },
    removeItem: (key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // хранилище недоступно — удалять нечего
      }
    },
  }
}
