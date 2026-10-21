'use client'

import { useState, type ReactNode } from 'react'
import { seededShuffle } from '@/lib/progress/scheduler'
import { useGate } from '@/components/lesson/engine/useGate'

export interface PredictProps {
  id: string
  question: string
  options: string[]
  /** Верный вариант, если он есть (тогда после прогноза покажем, угадал ли ученик). */
  answer?: number
  children?: ReactNode
}

export function Predict({ id, question, options, answer, children }: PredictProps) {
  const gate = useGate(id)
  const [selected, setSelected] = useState<number | null>(null)
  const committed = gate.passed
  const choice = committed ? (gate.choice ?? null) : selected

  return (
    <div className="gate-card" data-gate="predict" data-passed={committed}>
      <p className="gate-label">Предскажи</p>
      <p className="gate-question">{question}</p>
      <div role="radiogroup" aria-label={question} className="mt-3 flex flex-col gap-2">
        {/* порядок перемешан по id (одинаково на сервере и в браузере); в прогресс идёт исходный индекс */}
        {seededShuffle(options.map((_, i) => i), id).map((i) => (
          <button
            key={options[i]}
            type="button"
            role="radio"
            aria-checked={choice === i}
            className="option-btn"
            data-selected={choice === i}
            data-right={committed && answer === i}
            disabled={committed}
            onClick={() => setSelected(i)}
          >
            {options[i]}
          </button>
        ))}
      </div>

      {!committed && (
        <button
          type="button"
          className="btn-primary mt-3"
          disabled={selected === null}
          onClick={() => selected !== null && gate.record(true, selected)}
        >
          Зафиксировать прогноз
        </button>
      )}

      {committed && (
        <div className="mt-4">
          {choice !== null && (
            <p className="text-sm text-ink-soft">
              Твой прогноз: «{options[choice]}».{' '}
              {answer !== undefined &&
                (choice === answer ? (
                  <strong className="text-success">Так и есть!</strong>
                ) : (
                  <>
                    На самом деле — «{options[answer]}». Ошибиться в прогнозе полезно: так объяснение запомнится
                    лучше.
                  </>
                ))}
            </p>
          )}
          <div className="mt-3">{children}</div>
        </div>
      )}
    </div>
  )
}
