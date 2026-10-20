'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'

export interface LessonContextValue {
  lessonId: string
  /** Карточки этого урока: попадут в колоду при завершении. */
  lessonCardIds: string[]
  /** Карточки предыдущих уроков: материал для разминки. */
  recallCards: Card[]
}

const LessonContext = createContext<LessonContextValue | null>(null)

export function LessonProvider({ children, ...value }: LessonContextValue & { children: ReactNode }) {
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
}

export function useLesson(): LessonContextValue {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used inside <LessonProvider>')
  return ctx
}

export function useLessonOptional(): LessonContextValue | null {
  return useContext(LessonContext)
}
