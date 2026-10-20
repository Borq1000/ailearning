'use client'

import { useEffect } from 'react'
import { STORAGE_KEY } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'

/**
 * Загружает прогресс из localStorage после гидратации страницы (чтобы серверный и клиентский HTML совпали)
 * и перечитывает его, когда прогресс сохраняет другая вкладка: иначе вкладки затирали бы изменения друг друга.
 */
export function ProgressHydrator(): null {
  useEffect(() => {
    void useProgress.persist.rehydrate()
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) void useProgress.persist.rehydrate()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return null
}
