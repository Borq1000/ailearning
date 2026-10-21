'use client'

import { useEffect, useRef, useState } from 'react'
import { plural } from '@/lib/plural'
import { seededShuffle } from '@/lib/progress/scheduler'
import { IMPOSSIBLE, formatShape, productShape, shapeOptions, type Shape } from '@/lib/viz/matrix-helpers'
import { useGate } from '@/components/lesson/engine/useGate'

export interface ShapeRound {
  a: Shape
  b: Shape
}

const RULE = 'Столбцов A должно быть столько же, сколько строк B. Результат: строк как у A, столбцов как у B.'

function correctAnswer(round: ShapeRound): string {
  const shape = productShape(round.a, round.b)
  return shape ? formatShape(shape) : IMPOSSIBLE
}

/** Игра «какие формы перемножаются»: раунд за раундом ученик называет форму A·B или говорит, что умножить нельзя. */
export function ShapeGame({ id, rounds }: { id: string; rounds: ShapeRound[] }) {
  const gate = useGate(id)
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const finished = gate.passed
  const current = rounds[Math.min(round, rounds.length - 1)]
  // порядок вариантов перемешан детерминированно: правильный ответ не стоит всегда первым
  const options = seededShuffle(shapeOptions(current.a, current.b), `${id}-${round}`)
  const answer = correctAnswer(current)
  const inner = current.a[1] === current.b[0]

  // кнопка, на которую нажали, исчезает вместе с раундом: фокус переносим на первый вариант нового раунда
  useEffect(() => {
    if (round > 0) optionsRef.current?.querySelector('button')?.focus()
  }, [round])

  function choose(option: string) {
    if (finished) return
    setConfirmed(null)
    if (option !== answer) {
      setWrong(option)
      gate.record(false)
      return
    }
    setWrong(null)
    if (round + 1 >= rounds.length) {
      gate.record(true)
      return
    }
    const shape = productShape(current.a, current.b)
    const verdict = shape ? `A·B — ${formatShape(shape)}` : 'перемножить нельзя'
    setConfirmed(`✓ Верно: ${verdict}. Раунд ${round + 2} из ${rounds.length}.`)
    setRound(round + 1)
  }

  function showRule() {
    gate.reveal({
      id: `shape-game:${id}`,
      kind: 'flip',
      prompt: 'Когда две матрицы можно перемножить и какой формы получится результат?',
      answer: RULE,
    })
  }

  return (
    <div className="gate-card" data-gate="shape-game" data-passed={finished}>
      <p className="gate-label m-0">Игра · какие формы перемножаются</p>
      {!finished && (
        <>
          <p className="gate-question">
            Раунд {round + 1} из {rounds.length}: A — {formatShape(current.a)}, B — {formatShape(current.b)}. Какой формы A·B?
          </p>
          <div ref={optionsRef} className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Форма результата">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className="option-btn w-auto"
                data-selected={wrong === option}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div role="status">
            {confirmed && <p className="feedback-right">{confirmed}</p>}
            {wrong && (
              <p className="feedback-wrong">
                Не то. Внутренние размеры: у A {current.a[1]} {plural(current.a[1], ['столбец', 'столбца', 'столбцов'])}, у B{' '}
                {current.b[0]} {plural(current.b[0], ['строка', 'строки', 'строк'])}.{' '}
                {inner
                  ? 'Они совпали — значит, перемножить можно, а остаются внешние размеры.'
                  : 'Они не совпали — скалярному произведению строки на столбец не сойтись.'}
              </p>
            )}
          </div>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost mt-3" onClick={showRule}>
              Показать правило
            </button>
          )}
        </>
      )}
      {finished && (
        <div role="status" className="feedback-right">
          <p className="m-0">
            {gate.revealed ? `Правило: ${RULE} Этот вопрос вернётся к тебе на повторении.` : '✓ Все раунды пройдены!'}
          </p>
          <ul className="mt-2 mb-0 list-none p-0 font-mono text-[13px]">
            {rounds.map((r, i) => (
              <li key={i}>
                {formatShape(r.a)} · {formatShape(r.b)} → {correctAnswer(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
