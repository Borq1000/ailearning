'use client'

import { Fragment, useState } from 'react'
import type { Vec } from '@/lib/math'
import { parseNumber } from '@/lib/parse-number'
import { BOUND, formatNum } from '@/lib/viz/vector-helpers'

const AXIS_NAMES = ['x', 'y', 'z']

function NumberField({
  value,
  label,
  disabled,
  onCommit,
}: {
  value: number
  label: string
  disabled?: boolean
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  function commit() {
    const parsed = parseNumber(text)
    if (parsed === null) return
    const clamped = Math.max(-BOUND, Math.min(BOUND, parsed))
    onCommit(clamped)
    setText(formatNum(clamped))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      className="stage-input"
      disabled={disabled}
      value={focused ? text : formatNum(value)}
      onFocus={() => {
        setText(formatNum(value))
        setFocused(true)
      }}
      onBlur={() => {
        commit()
        setFocused(false)
      }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}

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
