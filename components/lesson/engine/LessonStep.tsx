import type { ReactNode } from 'react'

export function LessonStep({ index, children }: { index: string; total: string; children?: ReactNode }) {
  return (
    <section data-step={index} className="lesson-step">
      {children}
    </section>
  )
}
