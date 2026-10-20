'use client'

import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react'

export function Level({ children }: { title: string; children?: ReactNode }) {
  return <>{children}</>
}

/** Одна идея на трёх уровнях: История → Геометрия → Алгебра (concreteness fading). */
export function Levels({ children }: { children?: ReactNode }) {
  const levels = Children.toArray(children).filter(isValidElement) as ReactElement<{
    title: string
    children?: ReactNode
  }>[]
  const [active, setActive] = useState(0)

  return (
    <div className="levels">
      <div role="tablist" aria-label="Уровень объяснения" className="levels-tabs">
        {levels.map((level, i) => (
          <button
            key={level.props.title}
            type="button"
            role="tab"
            aria-selected={active === i}
            className="levels-tab"
            onClick={() => setActive(i)}
          >
            {level.props.title}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="levels-panel">
        {levels[active]}
      </div>
    </div>
  )
}
