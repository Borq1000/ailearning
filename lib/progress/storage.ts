import type { StateStorage } from 'zustand/middleware'

export const STORAGE_KEY = 'ailearning:v1'
export const BACKUP_KEY = 'ailearning:backup'

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

export function createMemoryStorage(): StateStorage {
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
export function createSafeStorage(): StateStorage {
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
