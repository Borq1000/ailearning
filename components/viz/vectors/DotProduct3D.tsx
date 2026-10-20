'use client'

import { useState, type ReactNode } from 'react'
import { angleDeg, dot, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { DOT_RELATION_TEXT, arcPoints, describeDot, dotBreakdown, formatNum } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

const RELATION_COLOR = { same: '#a3e635', perpendicular: '#e2e8f0', opposite: '#fb7185' } as const

export function DotProduct3D({
  a: a0 = [2, 1, 0],
  b: b0 = [1, 2, 0],
  caption,
}: {
  a?: Vec
  b?: Vec
  caption?: ReactNode
}) {
  const [a, setA] = useState<Vec>(a0)
  const [b, setB] = useState<Vec>(b0)
  const relation = describeDot(dot(a, b))
  const angle = angleDeg(a, b)
  const points = arcPoints(a, b)
  const color = RELATION_COLOR[relation]

  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-1.5">
          <VectorInputs label="a" color={CONCEPTS.a.glow} value={a} onChange={setA} />
          <VectorInputs label="b" color={CONCEPTS.b.glow} value={b} onChange={setB} />
          <p className="readout">a·b = {dotBreakdown(a, b)}</p>
          <p className="readout">
            угол θ = {Number.isNaN(angle) ? '—' : `${formatNum(angle)}°`} ·{' '}
            <span style={{ color }}>{DOT_RELATION_TEXT[relation]}</span>
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          { id: 'a', value: a, color: CONCEPTS.a.glow, label: 'a', draggable: true },
          { id: 'b', value: b, color: CONCEPTS.b.glow, label: 'b', draggable: true },
        ]}
        onChange={(id, v) => (id === 'a' ? setA(v) : setB(v))}
        arc={points ? { points, color } : null}
      />
    </Stage>
  )
}
