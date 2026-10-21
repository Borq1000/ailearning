'use client'

import { useCallback } from 'react'
import type { Card } from '@/lib/course/types'
import { scopeId } from '@/lib/progress/scope'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useIsomorphicLayoutEffect } from '@/lib/react/use-isomorphic-layout-effect'
import { useLessonOptional } from './LessonContext'
import { useStep } from './StepContext'

export interface GateApi {
  passed: boolean
  attempts: number
  revealed: boolean
  choice?: number
  record: (correct: boolean, choice?: number) => void
  pass: () => void
  reveal: (card?: Card) => void
}

export function useGate(id: string): GateApi {
  const lesson = useLessonOptional()
  // Внутри урока ключи живут под курсом; вне урока (тесты компонентов) — как есть.
  const key = lesson ? scopeId(lesson.courseId, id) : id
  const registerGate = useStep()?.registerGate
  useIsomorphicLayoutEffect(() => registerGate?.(key), [registerGate, key])

  const gate = useProgress((s) => s.gates[key])
  const recordAttempt = useProgress((s) => s.recordAttempt)
  const passGate = useProgress((s) => s.passGate)
  const revealGate = useProgress((s) => s.revealGate)

  const record = useCallback((correct: boolean, choice?: number) => recordAttempt(key, correct, choice), [recordAttempt, key])
  const pass = useCallback(() => passGate(key), [passGate, key])
  const reveal = useCallback(
    (card?: Card) => {
      // карточка-копия тоже живёт под курсом: по этому id её находят колода и значок повторения
      const scoped = card && lesson ? { ...card, id: scopeId(lesson.courseId, card.id) } : card
      revealGate(key, scoped, todayISO())
    },
    [revealGate, key, lesson],
  )

  return {
    passed: gate?.passed ?? false,
    attempts: gate?.attempts ?? 0,
    revealed: gate?.revealed ?? false,
    choice: gate?.choice,
    record,
    pass,
    reveal,
  }
}
