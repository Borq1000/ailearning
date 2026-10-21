'use client'

import { Fragment } from 'react'
import type { Vec } from '@/lib/math'
import { NumberField } from '@/components/viz/stage/NumberField'

const AXIS_NAMES = ['x', 'y', 'z']

export function VectorInputs({
  label,
  color,
  value,
  onChange,
  disabled,
}: {
  label: string
  color: string
  value: Vec
  onChange: (v: Vec) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm">
      <span className="font-semibold" style={{ color }}>
        {label} =
      </span>
      <span className="text-space-muted">[</span>
      {value.map((x, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-space-muted">,</span>}
          <NumberField
            value={x}
            label={`${label}, координата ${AXIS_NAMES[i]}`}
            disabled={disabled}
            onCommit={(n) => onChange(value.map((y, j) => (j === i ? n : y)))}
          />
        </Fragment>
      ))}
      <span className="text-space-muted">]</span>
    </div>
  )
}
