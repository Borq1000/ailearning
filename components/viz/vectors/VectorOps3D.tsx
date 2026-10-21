'use client'

import { useState, type ReactNode } from 'react'
import { add, scale, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import type { VectorSpec } from './VectorScene'
import { VectorInputs } from './VectorInputs'

const A = CONCEPTS.a.glow
const B = CONCEPTS.b.glow
const R = CONCEPTS.result.glow

export function VectorOps3D({
  mode,
  a: a0 = [2, 0, 1],
  b: b0 = [0, 2, 1],
  caption,
}: {
  mode: 'add' | 'scale'
  a?: Vec
  b?: Vec
  caption?: ReactNode
}) {
  const [a, setA] = useState<Vec>(a0)
  const [b, setB] = useState<Vec>(b0)
  const [k, setK] = useState(2)

  if (mode === 'add') {
    const sum = add(a, b)
    const vectors: VectorSpec[] = [
      { id: 'a', value: a, color: A, label: 'a', draggable: true, concept: 'a' },
      { id: 'b', value: b, color: B, label: 'b', draggable: true, concept: 'b' },
      { id: 'b-moved', value: b, from: a, color: B, label: '', concept: 'b' },
      {
        id: 'sum',
        value: sum,
        color: R,
        label: 'a + b',
        concept: 'result',
        info: { title: 'Сумма a + b', body: `Пройди по a, потом по b — окажешься в ${formatVec(sum)}.` },
      },
    ]
    return (
      <Stage
        caption={caption}
        fallback={<StageFallbackNote />}
        controls={
          <div className="space-y-1.5">
            <VectorInputs label="a" color={A} value={a} onChange={setA} />
            <VectorInputs label="b" color={B} value={b} onChange={setB} />
            <p className="readout">
              a + b = {formatVec(a)} + {formatVec(b)} = <span style={{ color: R }}>{formatVec(sum)}</span>
            </p>
          </div>
        }
      >
        <LazyVectorScene vectors={vectors} onChange={(id, v) => (id === 'a' ? setA(v) : setB(v))} />
      </Stage>
    )
  }

  const scaled = scale(a, k)
  return (
    <Stage
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-1.5">
          <VectorInputs label="a" color={A} value={a} onChange={setA} />
          <label className="flex items-center gap-3 font-mono text-sm">
            k = {formatNum(k)}
            <input
              type="range"
              min={-2}
              max={3}
              step={0.5}
              value={k}
              aria-label="Множитель k"
              className="accent-[#a3e635]"
              onChange={(e) => setK(Number(e.target.value))}
            />
          </label>
          <p className="readout">
            {formatNum(k)}·{formatVec(a)} = <span style={{ color: R }}>{formatVec(scaled)}</span>
          </p>
        </div>
      }
    >
      <LazyVectorScene
        vectors={[
          { id: 'a', value: a, color: A, label: 'a', draggable: true, concept: 'a' },
          { id: 'ka', value: scaled, color: R, label: `${formatNum(k)}·a`, concept: 'result' },
        ]}
        onChange={(_, v) => setA(v)}
      />
    </Stage>
  )
}
