'use client'

import { useEffect } from 'react'
import { useProgress } from '@/lib/progress/store'

/** Загружает прогресс из localStorage после гидратации страницы (чтобы серверный и клиентский HTML совпали). */
export function ProgressHydrator(): null {
  useEffect(() => {
    void useProgress.persist.rehydrate()
  }, [])
  return null
}
