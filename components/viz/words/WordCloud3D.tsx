'use client'

import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'
import { GROUPS } from '@/content/home/word-cloud'
import { Stage } from '@/components/viz/stage/Stage'

const LazyWordCloudScene = dynamic(() => import('./WordCloudScene').then((m) => m.WordCloudScene), { ssr: false })

const QUERY = '(prefers-reduced-motion: reduce)'
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

export function WordCloud3D() {
  const reducedMotion = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
  const legend = (
    <div className="flex flex-wrap gap-4 font-mono text-xs">
      {Object.values(GROUPS).map((g) => (
        <span key={g.label} style={{ color: g.color }}>
          ● {g.label}
        </span>
      ))}
    </div>
  )
  return (
    <Stage
      height={420}
      frameloop="always"
      camera={[6, 3, 7]}
      caption="Каждое слово — точка в пространстве смыслов. Похожие слова живут рядом. Подробно — в модуле 2."
      fallback={<p className="m-0">Здесь вращается облако слов: животные, предметы, чувства и действия собираются в свои «районы».</p>}
      controls={legend}
    >
      <LazyWordCloudScene rotate={!reducedMotion} />
    </Stage>
  )
}
