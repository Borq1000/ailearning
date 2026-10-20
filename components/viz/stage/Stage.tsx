'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { detectWebGL } from '@/lib/webgl'
import { InfoCard } from './InfoCard'
import { Observatory } from '@/components/viz/stage/Observatory'
import { StageInfoContext, type StageInfo } from '@/components/viz/stage/stage-context'

function StageLoading() {
  return <div className="flex h-full items-center justify-center font-mono text-xs text-space-muted">Загружаю 3D…</div>
}

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false, loading: StageLoading })

export interface StageProps {
  height?: number
  caption?: ReactNode
  hint?: string
  /** Что показать без WebGL. */
  fallback: ReactNode
  /** DOM-управление под сценой (поля, ползунки) — работает и без WebGL. */
  controls?: ReactNode
  camera?: [number, number, number]
  frameloop?: 'demand' | 'always'
  wide?: boolean
  children?: ReactNode
}

export function Stage({
  height = 360,
  caption,
  hint = '⟲ потяни фон, чтобы вращать',
  fallback,
  controls,
  camera,
  frameloop,
  wide,
  children,
}: StageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [lost, setLost] = useState(false)
  const [info, setInfo] = useState<StageInfo | null>(null)
  const infoApi = useMemo(() => ({ show: setInfo, hide: () => setInfo(null) }), [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние зависит от браузера (WebGL) и вычисляется только после гидратации
    setWebgl(detectWebGL())
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  let body: ReactNode
  if (webgl === false || lost) {
    body = (
      <div className="stage-fallback">
        {lost && (
          <p className="m-0">
            3D-сцена отключилась.{' '}
            <button type="button" className="stage-chip" onClick={() => setLost(false)}>
              Перезапустить
            </button>
          </p>
        )}
        {fallback}
      </div>
    )
  } else if (webgl && inView) {
    body = (
      <SceneCanvas camera={camera} frameloop={frameloop} onContextLost={() => setLost(true)}>
        {children}
      </SceneCanvas>
    )
  } else {
    body = <StageLoading />
  }

  return (
    <StageInfoContext.Provider value={infoApi}>
      <Observatory caption={caption} hint={webgl && !lost ? hint : undefined} wide={wide} footer={controls}>
        <div ref={ref} style={{ height }} className="relative">
          {body}
          {info && <InfoCard info={info} onClose={() => setInfo(null)} />}
        </div>
      </Observatory>
    </StageInfoContext.Provider>
  )
}
