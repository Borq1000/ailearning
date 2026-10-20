import { useEffect, useState } from 'react'
import { useProgress } from './store'

/**
 * false — на сервере и при первой отрисовке на клиенте (совпадает с серверным HTML);
 * true — когда прогресс из localStorage загружен.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useProgress.persist.hasHydrated())
  useEffect(() => {
    const unsubscribe = useProgress.persist.onFinishHydration(() => setHydrated(true))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние зависит от localStorage и синхронизируется только после гидратации
    setHydrated(useProgress.persist.hasHydrated())
    return unsubscribe
  }, [])
  return hydrated
}
