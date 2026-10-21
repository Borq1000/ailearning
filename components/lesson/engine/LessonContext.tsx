'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'

export interface LessonContextValue {
  courseId: string
  lessonId: string
  /** Ключ урока в прогрессе: `<курс>/<id>`. */
  lessonKey: string
  /** Ключи карточек этого урока в прогрессе: попадут в колоду при завершении. */
  lessonCardKeys: string[]
  /** Карточки предыдущих уроков (id уже с префиксом курса): материал для разминки. */
  recallCards: Card[]
}

export interface LessonProviderProps {
  courseId: string
  lessonId: string
  /** Короткие id карточек из `cards` урока. */
  lessonCardIds: string[]
  /** Карточки предыдущих уроков с короткими id. */
  recallCards: Card[]
  children: ReactNode
}

const LessonContext = createContext<LessonContextValue | null>(null)

/** Единственное место, где короткие id контента превращаются в ключи прогресса под курсом. */
export function LessonProvider({ courseId, lessonId, lessonCardIds, recallCards, children }: LessonProviderProps) {
  const value = useMemo<LessonContextValue>(
    () => ({
      courseId,
      lessonId,
      lessonKey: scopeId(courseId, lessonId),
      lessonCardKeys: lessonCardIds.map((id) => scopeId(courseId, id)),
      recallCards: recallCards.map((card) => ({ ...card, id: scopeId(courseId, card.id) })),
    }),
    [courseId, lessonId, lessonCardIds, recallCards],
  )
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
