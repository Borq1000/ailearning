'use client'

import { useState } from 'react'
import { parseNumber } from '@/lib/parse-number'
import { BOUND, formatNum } from '@/lib/viz/vector-helpers'

/**
 * Числовое поле сцены: показывает число, пока его не редактируют; принимает запятую и минус «−»;
 * применяет значение по Enter или при уходе с поля и зажимает его в [−bound, bound].
 */
export function NumberField({
  value,
  label,
  disabled,
  bound = BOUND,
  onCommit,
}: {
  value: number
  label: string
  disabled?: boolean
  bound?: number
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  function commit() {
    const parsed = parseNumber(text)
    if (parsed === null) return
    const clamped = Math.max(-bound, Math.min(bound, parsed))
    onCommit(clamped)
    setText(formatNum(clamped))
  }

  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
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
