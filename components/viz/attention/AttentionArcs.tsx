'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ADJECTIVE, pronounAttention, type Variant } from '@/content/attention/toy-model'
import { CONCEPTS } from '@/lib/theme/concepts'
import { Observatory } from '@/components/viz/stage/Observatory'

const CHAR = 9.4
const PAD = 20
const BASELINE = 190

export function arcPath(x1: number, x2: number, baseline: number): string {
  const h = Math.min(120, Math.abs(x2 - x1) * 0.42 + 12)
  return `M ${x1} ${baseline} Q ${(x1 + x2) / 2} ${baseline - h} ${x2} ${baseline}`
}

const percent = (w: number) => `${Math.round(w * 100)}%`

export function AttentionArcs({
  initial = 'tall',
  showWeights = false,
  caption,
}: {
  initial?: Variant
  showWeights?: boolean
  caption?: ReactNode
}) {
  const [variant, setVariant] = useState<Variant>(initial)
  const [hovered, setHovered] = useState<number | null>(null)
  const { tokens, weights, target } = useMemo(() => pronounAttention(variant), [variant])

  const focus = tokens.indexOf('он')
  const widths = tokens.map((t) => t.length * CHAR + PAD)
  const xs = widths.map((w, i) => widths.slice(0, i).reduce((s, x) => s + x, 0) + w / 2)
  const width = widths.reduce((s, w) => s + w, 0)
  const label = `«он» сильнее всего смотрит на «${target}» — ${percent(weights[tokens.indexOf(target)])} внимания`

  const footer = (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Конец фразы">
      <span className="font-mono text-xs text-space-muted">…потому что он был слишком</span>
      {(['tall', 'tired'] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={variant === v}
          className="stage-chip"
          data-active={variant === v}
          onClick={() => setVariant(v)}
        >
          {ADJECTIVE[v]}
        </button>
      ))}
      <span className="ml-auto font-mono text-xs text-space-muted">наведи на слово — увидишь %</span>
    </div>
  )

  return (
    <Observatory wide caption={caption} footer={footer}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} 230`} role="img" aria-label={label} className="block w-full min-w-[640px] px-2">
          {tokens.map((token, i) =>
            i === focus ? null : (
              <path
                key={i}
                d={arcPath(xs[focus], xs[i], BASELINE - 24)}
                fill="none"
                strokeLinecap="round"
                stroke={token === target ? CONCEPTS.target.glow : CONCEPTS.focus.glow}
                style={{
                  strokeWidth: 1 + weights[i] * 14,
                  opacity: hovered === null || hovered === i ? 0.3 + weights[i] * 0.7 : 0.1,
                  transition: 'stroke-width 0.6s ease, opacity 0.3s ease',
                }}
              />
            ),
          )}
          {tokens.map((token, i) => (
            <g key={i} onPointerEnter={() => setHovered(i)} onPointerLeave={() => setHovered(null)}>
              <text
                x={xs[i]}
                y={BASELINE}
                textAnchor="middle"
                fontSize="15"
                className="font-mono"
                fontWeight={i === focus || token === target ? 700 : 400}
                fill={i === focus ? CONCEPTS.focus.glow : token === target ? CONCEPTS.target.glow : '#dbe6ff'}
                opacity={i === focus || weights[i] > 0.05 ? 1 : 0.55}
              >
                {token}
              </text>
              {(showWeights || hovered === i) && i !== focus && (
                <text x={xs[i]} y={BASELINE + 24} textAnchor="middle" fontSize="12" fill="#7c8db5" className="font-mono">
                  {percent(weights[i])}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </Observatory>
  )
}
