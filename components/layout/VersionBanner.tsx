'use client'

import { useSyncExternalStore } from 'react'
import { isBlockedByNewerVersion, subscribeVersionGuard } from '@/lib/progress/version-guard'

/** Другая вкладка уже открыла новую версию сайта: эта вкладка перестала сохранять прогресс и просит перезагрузку. */
export function VersionBanner() {
  const blocked = useSyncExternalStore(subscribeVersionGuard, isBlockedByNewerVersion, () => false)
  if (!blocked) return null
  return (
    <div role="alert" className="bg-error-bg px-4 py-2 text-center text-sm text-error">
      Сайт обновился в другой вкладке. Обнови эту страницу, чтобы прогресс сохранялся.
    </div>
  )
}
