'use client'

import { useState, type ReactNode } from 'react'
import { matMul, transpose, type Mat } from '@/lib/math'
import { dotBreakdown, formatNum } from '@/lib/viz/vector-helpers'
import { Observatory } from '@/components/viz/stage/Observatory'

type Cell = [number, number]

function MatrixTable({
  name,
  m,
  rowLabels,
  colLabels,
  hotRow,
  hotCol,
  selected,
  onSelect,
}: {
  name: string
  m: Mat
  rowLabels?: string[]
  colLabels?: string[]
  hotRow?: number
  hotCol?: number
  selected?: Cell | null
  onSelect?: (i: number, j: number) => void
}) {
  return (
    <table className="mat-table">
      <caption className="mat-caption">{name}</caption>
      {colLabels && (
        <thead>
          <tr>
            {rowLabels && <td />}
            {colLabels.map((label) => (
              <th key={label} scope="col" className="mat-label">
                {label}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {m.map((row, i) => (
          <tr key={i}>
            {rowLabels && (
              <th scope="row" className="mat-label">
                {rowLabels[i]}
              </th>
            )}
            {row.map((x, j) => {
              const pressed = selected != null && selected[0] === i && selected[1] === j
              return (
                <td key={j} className="mat-cell" data-hot={hotRow === i || hotCol === j}>
                  {onSelect ? (
                    <button
                      type="button"
                      className="mat-cell-btn"
                      aria-pressed={pressed}
                      aria-label={`строка ${i + 1}, столбец ${j + 1}: ${formatNum(x)}`}
                      onClick={() => onSelect(i, j)}
                    >
                      {formatNum(x)}
                    </button>
                  ) : (
                    formatNum(x)
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A·B как три таблицы: клик по ячейке результата подсвечивает строку A и столбец B и раскладывает скалярное произведение. */
export function MatMulExplorer({
  a,
  b: b0,
  aLabel = 'A',
  bLabel = 'B',
  rowLabels,
  colLabels,
  transposeB = false,
  caption,
}: {
  a: Mat
  b: Mat
  aLabel?: string
  bLabel?: string
  /** Подписи строк A (и строк результата). */
  rowLabels?: string[]
  /** Подписи столбцов B после транспонирования, если оно включено (и столбцов результата). */
  colLabels?: string[]
  transposeB?: boolean
  caption?: ReactNode
}) {
  const b = transposeB ? transpose(b0) : b0
  const product = matMul(a, b)
  const [cell, setCell] = useState<Cell | null>(null)
  const bName = transposeB ? `${bLabel}ᵀ` : bLabel
  const row = cell ? a[cell[0]] : null
  const col = cell ? b.map((r) => r[cell[1]]) : null

  return (
    <Observatory
      wide
      caption={caption}
      footer={
        <p className="readout m-0" role="status">
          {cell && row && col
            ? `${aLabel}[строка ${cell[0] + 1}] · ${bName}[столбец ${cell[1] + 1}] = ${dotBreakdown(row, col)}`
            : 'Нажми на ячейку результата — увидишь, из какой строки и какого столбца она получилась.'}
        </p>
      }
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 p-4 font-mono text-[13px]">
        <MatrixTable name={aLabel} m={a} rowLabels={rowLabels} hotRow={cell?.[0]} />
        <span className="text-2xl text-space-muted" aria-hidden>
          ·
        </span>
        <MatrixTable name={bName} m={b} colLabels={colLabels} hotCol={cell?.[1]} />
        <span className="text-2xl text-space-muted" aria-hidden>
          =
        </span>
        <MatrixTable
          name={`${aLabel}·${bName}`}
          m={product}
          rowLabels={rowLabels}
          colLabels={colLabels}
          selected={cell}
          onSelect={(i, j) => setCell([i, j])}
        />
      </div>
    </Observatory>
  )
}
