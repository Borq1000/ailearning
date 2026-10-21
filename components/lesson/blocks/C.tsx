'use client'

import type { CSSProperties, ReactNode } from 'react'
import { CONCEPTS, type ConceptKey } from '@/lib/theme/concepts'
import { useHighlight } from '@/lib/viz/highlight'

/** Цветной термин: тот же цвет, что у объекта в сцене; подсвечивается, пока на объект наведён курсор. */
export function C({ k, children }: { k: ConceptKey; children?: ReactNode }) {
  const concept = CONCEPTS[k]
  const active = useHighlight((s) => s.concept === k)
  const style = { color: concept.ink, borderBottomColor: concept.glow, '--concept-glow': concept.glow } as CSSProperties
  return (
    <span className="concept" data-active={active} style={style}>
      {children}
    </span>
  )
}
