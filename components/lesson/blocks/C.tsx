import type { ReactNode } from 'react'
import { CONCEPTS, type ConceptKey } from '@/lib/theme/concepts'

/** Цветной термин: тот же цвет, что у объекта в сцене (сигналинг по Майеру). */
export function C({ k, children }: { k: ConceptKey; children?: ReactNode }) {
  const concept = CONCEPTS[k]
  return (
    <span className="concept" style={{ color: concept.ink, borderBottomColor: concept.glow }}>
      {children}
    </span>
  )
}
