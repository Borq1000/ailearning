'use client'

import { useState } from 'react'
import type { Card } from '@/lib/course/types'
import { seededShuffle } from '@/lib/progress/scheduler'

export function CardView({ card, onAnswer }: { card: Card; onAnswer: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const options = card.kind === 'choice' ? card.options : undefined

  function answer(correct: boolean) {
    if (done) return
    setDone(true)
    onAnswer(correct)
  }

  return (
    <div className="recall-card" data-done={done}>
      <p className="m-0 font-serif text-base whitespace-pre-wrap">{card.prompt}</p>

      {options ? (
        <div className="mt-3 flex flex-col gap-2">
          {/* порядок перемешан по id карточки; верный ответ сверяется по исходному индексу */}
          {seededShuffle(options.map((_, i) => i), card.id).map((i) => (
            <button
              key={options[i]}
              type="button"
              className="option-btn"
              disabled={done}
              data-selected={picked === i}
              data-right={done && i === card.correct}
              onClick={() => {
                setPicked(i)
                answer(i === card.correct)
              }}
            >
              {options[i]}
            </button>
          ))}
          {done && <p className="m-0 text-sm text-ink-soft">{card.answer}</p>}
        </div>
      ) : !revealed ? (
        <button type="button" className="btn-ghost mt-3" onClick={() => setRevealed(true)}>
          Показать ответ
        </button>
      ) : (
        <div className="mt-3">
          <p className="m-0 rounded-lg bg-paper-deep p-3 text-sm whitespace-pre-wrap">{card.answer}</p>
          {!done && (
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary" onClick={() => answer(true)}>
                Помню ✓
              </button>
              <button type="button" className="btn-ghost" onClick={() => answer(false)}>
                Не помню ✗
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
