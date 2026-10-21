/** Разделитель между id курса и id сущности в ключах прогресса. В id уроков, ворот и карточек он не встречается. */
export const SCOPE_SEPARATOR = '/'

/**
 * Ключ прогресса. В контенте id короткие («1.3», «1-3-check-unit», «c-1-3-formula»), а в хранилище
 * они живут под курсом: «attention/1.3». Так два курса с уроком 1.1 не перемешают прогресс.
 */
export function scopeId(courseId: string, id: string): string {
  return `${courseId}${SCOPE_SEPARATOR}${id}`
}

/** Префиксует ключи записи: { '1.1': x } → { 'attention/1.1': x }. */
export function scopeKeys<T>(record: Readonly<Record<string, T>>, courseId: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).map(([id, value]) => [scopeId(courseId, id), value]))
}
