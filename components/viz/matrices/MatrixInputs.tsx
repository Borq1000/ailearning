'use client'

import type { Mat } from '@/lib/math'
import { MATRIX_BOUND } from '@/lib/viz/matrix-helpers'
import { NumberField } from '@/components/viz/stage/NumberField'

/** Таблица 3×3 полей; каждая ячейка — обычное числовое поле сцены (запятая, минус, зажим в границы). */
export function MatrixInputs({
  label = 'M',
  value,
  onChange,
  disabled,
}: {
  label?: string
  value: Mat
  onChange: (m: Mat) => void
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label={`Матрица ${label}`} className="flex items-center gap-2 font-mono text-sm">
      <span className="font-semibold text-space-text">{label} =</span>
      <span className="text-2xl text-space-muted" aria-hidden>
        [
      </span>
      <div className="grid grid-cols-3 gap-1">
        {value.map((row, i) =>
          row.map((x, j) => (
            <NumberField
              key={`${i}-${j}`}
              value={x}
              bound={MATRIX_BOUND}
              disabled={disabled}
              label={`${label}, строка ${i + 1}, столбец ${j + 1}`}
              onCommit={(n) => onChange(value.map((r, ii) => (ii === i ? r.map((y, jj) => (jj === j ? n : y)) : r)))}
            />
          )),
        )}
      </div>
      <span className="text-2xl text-space-muted" aria-hidden>
        ]
      </span>
    </div>
  )
}
