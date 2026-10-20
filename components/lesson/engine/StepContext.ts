'use client'

import { createContext, useContext } from 'react'

export interface StepContextValue {
  index: number
  /** Регистрирует «ворота» в шаге; возвращает функцию отмены регистрации. */
  registerGate: (gateId: string) => () => void
}

export const StepContext = createContext<StepContextValue | null>(null)

export function useStep(): StepContextValue | null {
  return useContext(StepContext)
}
