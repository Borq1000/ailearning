import type { Card } from '@/lib/course/types'

export type LessonStatus = 'in-progress' | 'completed'

export interface LessonProgress {
  status: LessonStatus
  /** Индекс последнего открытого шага урока. */
  unlockedStep: number
  completedAt?: string
}

export interface GateProgress {
  passed: boolean
  attempts: number
  /** Ответ был показан после неудачных попыток. */
  revealed: boolean
  /** Последний выбранный вариант (для «Предскажи»). */
  choice?: number
}

export type Box = 1 | 2 | 3 | 4 | 5

export interface CardState {
  box: Box
  /** Дата следующего повторения, 'YYYY-MM-DD'. */
  due: string
}

export interface ProgressData {
  version: 2
  lessons: Record<string, LessonProgress>
  gates: Record<string, GateProgress>
  code: Record<string, string>
  explanations: Record<string, string>
  cards: Record<string, CardState>
  /** Карточки, созданные из вопросов, на которые ученик не ответил сам. */
  customCards: Record<string, Card>
}
