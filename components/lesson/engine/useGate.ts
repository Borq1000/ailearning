'use client'

import { useCallback } from 'react'
import type { Card } from '@/lib/course/types'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useIsomorphicLayoutEffect } from '@/lib/react/use-isomorphic-layout-effect'
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
  const registerGate = useStep()?.registerGate
  useIsomorphicLayoutEffect(() => registerGate?.(id), [registerGate, id])

  const gate = useProgress((s) => s.gates[id])
  const recordAttempt = useProgress((s) => s.recordAttempt)
  const passGate = useProgress((s) => s.passGate)
  const revealGate = useProgress((s) => s.revealGate)

  const record = useCallback((correct: boolean, choice?: number) => recordAttempt(id, correct, choice), [recordAttempt, id])
  const pass = useCallback(() => passGate(id), [passGate, id])
  const reveal = useCallback((card?: Card) => revealGate(id, card, todayISO()), [revealGate, id])

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
