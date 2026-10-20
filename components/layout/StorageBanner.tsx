'use client'

import { useSyncExternalStore } from 'react'
import { isLocalStorageAvailable } from '@/lib/progress/storage'

let cached: boolean | undefined
const getSnapshot = () => (cached ??= isLocalStorageAvailable())
const subscribe = () => () => {}

export function StorageBanner() {
  const available = useSyncExternalStore(subscribe, getSnapshot, () => true)
  if (available) return null
  return (
    <div role="alert" className="bg-error-bg px-4 py-2 text-center text-sm text-error">
      Браузер не даёт сохранять данные (приватный режим?) — прогресс пропадёт после закрытия вкладки.
    </div>
  )
}
