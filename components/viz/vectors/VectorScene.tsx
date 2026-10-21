'use client'

import { Html, Line } from '@react-three/drei'
import type { ReactNode } from 'react'
import { add, sub, type Vec } from '@/lib/math'
import type { ConceptKey } from '@/lib/theme/concepts'
import { useHighlight } from '@/lib/viz/highlight'
import { formatVec } from '@/lib/viz/vector-helpers'
import { useStageInfo, type StageInfo } from '@/components/viz/stage/stage-context'
import { Arrow3D, pad3 } from './three/Arrow3D'
import { Axes3D } from './three/Axes3D'
import { DragHandle } from './three/DragHandle'

export interface VectorSpec {
  id: string
  value: Vec
  color: string
  label: string
  /** Начало стрелки (по умолчанию — начало координат). */
  from?: Vec
  draggable?: boolean
  /** Понятие, чьи термины <C> подсвечивать при наведении. */
  concept?: ConceptKey
  info?: StageInfo
}

export function VectorScene({
  vectors,
  onChange,
  arc,
  children,
}: {
  vectors: VectorSpec[]
  onChange?: (id: string, value: Vec) => void
  arc?: { points: Vec[]; color: string } | null
  children?: ReactNode
}) {
  const info = useStageInfo()
  const highlight = useHighlight((s) => s.highlight)
  const release = useHighlight((s) => s.release)
  return (
    <>
      <Axes3D />
      {vectors.map((v) => {
        const from = v.from ?? [0, 0, 0]
        const tip = add(from, v.value)
        return (
          <group
            key={v.id}
            onPointerOver={() => v.concept && highlight(v.concept)}
            onPointerOut={() => v.concept && release(v.concept)}
          >
            <Arrow3D
              from={from}
              to={tip}
              color={v.color}
              onClick={(e) => {
                e.stopPropagation()
                info?.show(v.info ?? { title: v.label, body: `${v.label} = ${formatVec(v.value)}` })
              }}
            />
            <Html position={pad3(tip)} className="vector-label" style={{ color: v.color, transform: 'translate(10px, -20px)' }}>
              {v.label}
            </Html>
            {v.draggable && onChange && (
              <DragHandle position={tip} color={v.color} onDrag={(p) => onChange(v.id, sub(p, from))} />
            )}
          </group>
        )
      })}
      {arc && <Line points={arc.points.map(pad3)} color={arc.color} lineWidth={2} />}
      {children}
    </>
  )
}
