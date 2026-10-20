'use client'

import { Children, useState, type ReactNode } from 'react'

/** Разобранный пример: каждый дочерний блок MDX — шаг; шаги открываются по одному. */
export function WorkedExample({ title, children }: { title?: string; children?: ReactNode }) {
  const steps = Children.toArray(children).filter((child) => !(typeof child === 'string' && child.trim() === ''))
  const [shown, setShown] = useState(1)

  return (
    <div className="worked">
      <p className="gate-label m-0">Разобранный пример</p>
      {title && <p className="gate-question">{title}</p>}
      <ol className="mt-3 list-none space-y-3 p-0">
        {steps.slice(0, shown).map((step, i) => (
          <li key={i} className="worked-step">
            {step}
          </li>
        ))}
      </ol>
      {shown < steps.length && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => setShown(shown + 1)}>
            Следующий шаг ({shown + 1}/{steps.length})
          </button>
          <button type="button" className="btn-ghost" onClick={() => setShown(steps.length)}>
            Показать всё
          </button>
        </div>
      )}
    </div>
  )
}
