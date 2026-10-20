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
        window.localStorage.setItem(BACKUP_KEY, raw)
        window.localStorage.removeItem(key)
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
    removeItem: (key) => window.localStorage.removeItem(key),
  }
}
