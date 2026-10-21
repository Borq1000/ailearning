'use client'

import { useState, type ReactNode } from 'react'
import { matVec, type Mat, type Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { PRESETS, matEquals, matVecBreakdown, type PresetId } from '@/lib/viz/matrix-helpers'
import { formatVec } from '@/lib/viz/vector-helpers'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from '@/components/viz/vectors/VectorInputs'
import { LazyMatrixScene } from './LazyMatrixScene'
import { MatrixInputs } from './MatrixInputs'

const INPUT_COLOR = '#dbe6ff'

export function MatrixTransform3D({
  initial = 'identity',
  vector: v0 = [1, 0.5, 1],
  caption,
}: {
  initial?: PresetId
  vector?: Vec
  caption?: ReactNode
}) {
  const [matrix, setMatrix] = useState<Mat>(() => PRESETS.find((p) => p.id === initial)!.matrix)
  const [v, setV] = useState<Vec>(v0)
  const image = matVec(matrix, v)
  const preset = PRESETS.find((p) => matEquals(p.matrix, matrix))

  return (
    <Stage
      camera={[3, 2.2, 3.5]}
      caption={caption}
      fallback={<StageFallbackNote />}
      controls={
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Готовые матрицы">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className="stage-chip"
                data-active={preset?.id === p.id}
                onClick={() => setMatrix(p.matrix)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-2">
            <MatrixInputs value={matrix} onChange={setMatrix} />
            <VectorInputs label="v" color={INPUT_COLOR} value={v} onChange={setV} />
          </div>
          <p className="readout">
            M·v = <span style={{ color: CONCEPTS.result.glow }}>{formatVec(image)}</span>
          </p>
          <ol className="readout m-0 list-none space-y-0.5 p-0 text-space-muted">
            {matVecBreakdown(matrix, v).map((line, i) => (
              <li key={i}>
                строка {i + 1}: {line}
              </li>
            ))}
          </ol>
          {preset && <p className="readout text-space-muted">{preset.hint}</p>}
        </div>
      }
    >
      <LazyMatrixScene matrix={matrix} vector={v} onVectorChange={setV} />
    </Stage>
  )
}
