/**
 * Флаг «прогресс записала более новая версия сайта». Такие данные эта вкладка не понимает: она не читает их,
 * не стирает и ничего не пишет поверх, а прогресс держит в памяти, пока ученик не обновит страницу.
 */
let blocked = false
const listeners = new Set<() => void>()

export function markNewerVersion(): void {
  if (blocked) return
  blocked = true
  listeners.forEach((cb) => cb())
}

export function isBlockedByNewerVersion(): boolean {
  return blocked
}

export function subscribeVersionGuard(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Только для тестов: флаг живёт в модуле, а не в хранилище. */
export function resetVersionGuard(): void {
  blocked = false
}
