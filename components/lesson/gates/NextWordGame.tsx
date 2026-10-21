'use client'

import { useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'

export interface WordRound {
  context: string
  options: string[]
  /** Индексы вариантов, которые считаются хорошими продолжениями. */
  answers: number[]
  note: string
}

/** Мини-игра «угадай следующее слово»: показывает, как контекст сужает выбор. */
export function NextWordGame({ id, rounds }: { id: string; rounds: WordRound[] }) {
  const gate = useGate(id)
  const [picks, setPicks] = useState<(number | null)[]>(() => rounds.map(() => null))

  // После перезагрузки локальных ответов нет, а ворота пройдены: показываем лучшие ответы и комментарии
  const restored = gate.passed && picks.every((p) => p === null)

  function pick(round: number, option: number) {
    if (gate.passed || picks[round] !== null) return
    const next = picks.map((p, i) => (i === round ? option : p))
    setPicks(next)
    if (next.every((p) => p !== null)) gate.pass()
  }

  return (
    <div className="gate-card" data-gate="next-word" data-passed={gate.passed}>
      <p className="gate-label m-0">Игра · угадай следующее слово</p>
      <ol className="mt-3 list-none space-y-5 p-0">
        {rounds.map((round, r) => {
          const picked = restored ? round.answers[0] : picks[r]
          const good = picked !== null && round.answers.includes(picked)
          return (
            <li key={round.context} className="m-0">
              <p className="m-0 font-serif text-lg">
                {round.context} <span className="text-muted">▁▁▁</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Варианты для «${round.context}»`}>
                {round.options.map((option, i) => (
                  <button
                    key={option}
                    type="button"
                    className="option-btn w-auto"
                    aria-disabled={picked !== null}
                    data-selected={picked === i}
                    data-right={picked !== null && round.answers.includes(i)}
                    onClick={() => pick(r, i)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p role="status" className={`mt-2 mb-0 text-sm ${good ? 'text-success' : 'text-ink-soft'}`}>
                {picked !== null && (
                  <>
                    {good ? '✓ ' : `Вероятнее всего — «${round.options[round.answers[0]]}». `}
                    {round.note}
                  </>
                )}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
