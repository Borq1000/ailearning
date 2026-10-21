'use client'

import { useState } from 'react'
import { parseNumber } from '@/lib/parse-number'
import { useGate } from '@/components/lesson/engine/useGate'

export interface FadedStep {
  text: string
  /** Если задан — в шаге есть пропуск ▢, который заполняет ученик. */
  answer?: number
  tolerance?: number
}

export function Faded({ id, title, steps }: { id: string; title?: string; steps: FadedStep[] }) {
  const gate = useGate(id)
  const [values, setValues] = useState<string[]>(() => steps.map(() => ''))
  const [wrong, setWrong] = useState<boolean[]>(() => steps.map(() => false))
  const solved = gate.passed

  function check() {
    const results = steps.map((step, i) => {
      if (step.answer === undefined) return true
      const value = parseNumber(values[i])
      return value !== null && Math.abs(value - step.answer) <= (step.tolerance ?? 0.01)
    })
    setWrong(results.map((ok) => !ok))
    gate.record(results.every(Boolean))
  }

  /** Карточка на повторение: вопрос — шаги с пропусками, ответ — те же шаги с подставленными числами. */
  function revealAnswers() {
    const filled = steps.map((s) => (s.answer === undefined ? s.text : s.text.replace('▢', String(s.answer))))
    const line = (parts: (string | undefined)[]) => parts.filter((p): p is string => Boolean(p)).join(' · ')
    gate.reveal({
      id: `faded:${id}`,
      kind: 'flip',
      prompt: line([title, ...steps.map((s) => s.text)]),
      answer: line([title, ...filled]),
    })
  }

  return (
    <div className="gate-card" data-gate="faded" data-passed={solved}>
      <p className="gate-label m-0">Реши сам · часть шагов уже сделана</p>
      {title && <p className="gate-question">{title}</p>}
      <ol className="mt-3 list-none space-y-2 p-0">
        {steps.map((step, i) => (
          <li key={i} className="flex flex-wrap items-center gap-3 font-mono text-[15px]">
            <span>{step.text}</span>
            {step.answer !== undefined && (
              <label className="flex items-center gap-2">
                <span className="text-muted">▢ =</span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Пропуск в шаге ${i + 1}`}
                  className="text-input mt-0 w-24"
                  value={gate.revealed || (solved && values[i] === '') ? String(step.answer) : values[i]}
                  disabled={solved}
                  onChange={(e) => setValues((vs) => vs.map((v, j) => (j === i ? e.target.value : v)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') check()
                  }}
                />
                {wrong[i] && !solved && <span className="text-sm text-error">не то</span>}
              </label>
            )}
          </li>
        ))}
      </ol>
      {!solved && (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={check}>
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={revealAnswers}>
              Показать ответы
            </button>
          )}
        </div>
      )}
      {solved && (
        <p role="status" className="feedback-right">
          {gate.revealed
            ? 'Ответы подставлены. Пройди по шагам ещё раз и проверь каждый.'
            : '✓ Все пропуски заполнены верно!'}
        </p>
      )}
    </div>
  )
}
