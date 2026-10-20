'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface StageInfo {
  title: string
  body: ReactNode
}

export interface StageInfoApi {
  show: (info: StageInfo) => void
  hide: () => void
}

export const StageInfoContext = createContext<StageInfoApi | null>(null)

/** Доступ к информационной карточке сцены (R3F v9 автоматически пробрасывает контекст внутрь Canvas). */
export function useStageInfo(): StageInfoApi | null {
  return useContext(StageInfoContext)
}
