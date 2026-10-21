'use client'

import { Children, isValidElement, useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react'

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

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    // Alt+← — «назад» в браузере, Ctrl/Cmd+стрелки — системные жесты
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const last = levels.length - 1
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    document.getElementById(tabId(next))?.focus()
  }

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
            tabIndex={active === i ? 0 : -1}
            aria-controls={panelId(i)}
            className="levels-tab"
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
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
