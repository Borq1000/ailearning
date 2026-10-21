'use client'

import { scopeId } from '@/lib/progress/scope'
import { useLessonOptional } from './LessonContext'

/**
 * Ключ сущности урока в прогрессе: внутри урока — с префиксом курса («attention/1-3-check-unit»),
 * вне урока (так рендерятся тесты компонентов) — как есть.
 */
export function useProgressKey(id: string): string {
  const lesson = useLessonOptional()
  return lesson ? scopeId(lesson.courseId, id) : id
}
