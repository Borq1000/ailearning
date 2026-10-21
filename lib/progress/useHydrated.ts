import { useSyncExternalStore } from 'react'
import { useProgress } from './store'

const subscribe = (onChange: () => void) => useProgress.persist.onFinishHydration(onChange)
const getSnapshot = () => useProgress.persist.hasHydrated()
const getServerSnapshot = () => false

/**
 * false — на сервере и при гидратации (совпадает с серверным HTML); true — когда прогресс из localStorage загружен.
 * useSyncExternalStore гидратационно безопасен по построению: серверный снимок всегда false.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
