'use client'

import { useState, type ReactNode } from 'react'
import { norm, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

export function VectorSpace3D({ initial = [2, 1, 2], label = 'v', caption }: { initial?: Vec; label?: string; caption?: ReactNode }) {
  const [v, setV] = useState<Vec>(initial)
  const color = CONCEPTS.a.glow
  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div>
          <VectorInputs label={label} color={color} value={v} onChange={setV} />
          <p className="readout">
            длина |{label}| = {formatNum(norm(v))}
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          {
            id: 'v',
            value: v,
            color,
            label,
            draggable: true,
            info: {
              title: `Вектор ${label}`,
              body: `${formatVec(v)}: ${formatNum(v[0])} по X, ${formatNum(v[1])} по Y, ${formatNum(v[2])} по Z.`,
            },
          },
        ]}
        onChange={(_, next) => setV(next)}
      />
    </Stage>
  )
}
