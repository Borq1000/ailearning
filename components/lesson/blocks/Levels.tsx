'use client'

import { Children, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'

export function Level({ children }: { title: string; children?: ReactNode }) {
  return <>{children}</>
}

/**
 * Одна идея на трёх уровнях: История → Геометрия → Алгебра (concreteness fading).
 * В разметке есть все уровни (неактивные — `hidden`): их текст видят поисковики и читатели без JS.
 */
export function Levels({ children }: { children?: ReactNode }) {
  const levels = Children.toArray(children).filter(isValidElement) as ReactElement<{
    title: string
    children?: ReactNode
  }>[]
  const [active, setActive] = useState(0)
  const baseId = useId()
  const tabId = (i: number) => `${baseId}-tab-${i}`
  const panelId = (i: number) => `${baseId}-panel-${i}`

  return (
    <div className="levels">
      <div role="tablist" aria-label="Уровень объяснения" className="levels-tabs">
        {levels.map((level, i) => (
          <button
            key={level.props.title}
            id={tabId(i)}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-controls={panelId(i)}
            className="levels-tab"
            onClick={() => setActive(i)}
          >
            {level.props.title}
          </button>
        ))}
      </div>
      {levels.map((level, i) => (
        <div
          key={level.props.title}
          id={panelId(i)}
          role="tabpanel"
          aria-labelledby={tabId(i)}
          hidden={active !== i}
          className="levels-panel"
        >
          {level}
        </div>
      ))}
    </div>
  )
}
