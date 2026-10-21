'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ADJECTIVE, pronounAttention, type Variant } from '@/content/attention/toy-model'
import { CONCEPTS } from '@/lib/theme/concepts'
import { InfoCard } from '@/components/viz/stage/InfoCard'
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
  const [selected, setSelected] = useState<number | null>(null)
  const { tokens, weights, target } = useMemo(() => pronounAttention(variant), [variant])

  const focus = tokens.indexOf('он')
  const widths = tokens.map((t) => t.length * CHAR + PAD)
  const xs = widths.map((w, i) => widths.slice(0, i).reduce((s, x) => s + x, 0) + w / 2)
  const width = widths.reduce((s, w) => s + w, 0)
  const label = `«он» сильнее всего смотрит на «${target}» — ${percent(weights[tokens.indexOf(target)])} внимания`
  // процент виден у слова под курсором, у выбранного слова и у всех — если так попросил урок
  const shown = hovered ?? selected

  function select(i: number) {
    setSelected((current) => (current === i ? null : i))
  }

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
          onClick={() => {
            setVariant(v)
            setSelected(null)
          }}
        >
          {ADJECTIVE[v]}
        </button>
      ))}
      <span className="ml-auto font-mono text-xs text-space-muted">нажми на слово — увидишь %</span>
    </div>
  )

  return (
    <Observatory wide caption={caption} footer={footer}>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} 230`} role="group" aria-label={label} className="block w-full min-w-[640px] px-2">
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
                  opacity: shown === null || shown === i ? 0.3 + weights[i] * 0.7 : 0.1,
                  transition: 'stroke-width 0.6s ease, opacity 0.3s ease',
                }}
              />
            ),
          )}
          {tokens.map((token, i) => {
            const word = i !== focus
            return (
              <g
                key={i}
                role={word ? 'button' : undefined}
                tabIndex={word ? 0 : undefined}
                aria-label={word ? `${token}: ${percent(weights[i])} внимания` : undefined}
                aria-pressed={word ? selected === i : undefined}
                className={word ? 'attn-word cursor-pointer outline-none' : undefined}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onClick={() => word && select(i)}
                onKeyDown={(e) => {
                  if (word && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    select(i)
                  }
                }}
              >
                {word && (
                  <rect
                    className="attn-focus"
                    x={xs[i] - widths[i] / 2 + 2}
                    y={BASELINE - 20}
                    width={widths[i] - 4}
                    height={30}
                    rx={6}
                    fill="none"
                  />
                )}
                <text
                  x={xs[i]}
                  y={BASELINE}
                  textAnchor="middle"
                  fontSize="15"
                  className="font-mono"
                  fontWeight={i === focus || token === target ? 700 : 400}
                  fill={i === focus ? CONCEPTS.focus.glow : token === target ? CONCEPTS.target.glow : '#dbe6ff'}
                  opacity={i === focus || weights[i] > 0.05 ? 1 : 0.55}
                  textDecoration={selected === i ? 'underline' : undefined}
                >
                  {token}
                </text>
                {(showWeights || shown === i) && word && (
                  <text x={xs[i]} y={BASELINE + 24} textAnchor="middle" fontSize="12" fill="#7c8db5" className="font-mono">
                    {percent(weights[i])}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {selected !== null && selected !== focus && (
        <InfoCard
          info={{
            title: `он → ${tokens[selected]}`,
            body: (
              <>
                {percent(weights[selected])} внимания.{' '}
                {tokens[selected] === target
                  ? 'Самая толстая дуга: именно это слово объясняет, кто такой «он».'
                  : 'Слабая связь: это слово мало говорит о том, кто такой «он».'}{' '}
                В уроке 3.3 ты посчитаешь это число сам.
              </>
            ),
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </Observatory>
  )
}
