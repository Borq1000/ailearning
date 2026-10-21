'use client'

import { useState } from 'react'
import type { Card } from '@/lib/course/types'

export function CardView({ card, onAnswer }: { card: Card; onAnswer: (correct: boolean) => void }) {
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  function answer(correct: boolean) {
    if (done) return
    setDone(true)
    onAnswer(correct)
  }

  return (
    <div className="recall-card" data-done={done}>
      <p className="m-0 font-serif text-base">{card.prompt}</p>

      {card.kind === 'choice' && card.options ? (
        <div className="mt-3 flex flex-col gap-2">
          {card.options.map((option, i) => (
            <button
              key={option}
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
              {option}
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
