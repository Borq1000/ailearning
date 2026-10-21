'use client'

import { useState, type ReactNode } from 'react'
import type { Card } from '@/lib/course/types'
import { parseNumber } from '@/lib/parse-number'
import { useGate } from '@/components/lesson/engine/useGate'

export interface CheckProps {
  id: string
  question: string
  /** Варианты ответа; если не заданы — ответ вводится числом. */
  options?: string[]
  /** Индекс верного варианта или верное число. */
  answer: number
  tolerance?: number
  explain?: ReactNode
  /** Пояснение для каждого неверного варианта. */
  feedback?: string[]
}

export function Check({ id, question, options, answer, tolerance = 0.01, explain, feedback }: CheckProps) {
  const gate = useGate(id)
  const [selected, setSelected] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [verdict, setVerdict] = useState<'wrong' | 'not-a-number' | null>(null)
  // результат объявляем читалке только после действия на этой странице, а не когда прогресс подгрузился из хранилища
  const [announce, setAnnounce] = useState(false)
  const solved = gate.passed
  // после перезагрузки локального выбора нет — помечаем верный вариант, чтобы читалка знала ответ
  const shownChoice = solved && selected === null ? answer : selected

  function submit() {
    if (options) {
      if (selected === null) return
      setAnnounce(true)
      const correct = selected === answer
      setVerdict(correct ? null : 'wrong')
      gate.record(correct)
      return
    }
    const value = parseNumber(text)
    if (value === null) {
      setVerdict('not-a-number')
      return
    }
    setAnnounce(true)
    const correct = Math.abs(value - answer) <= tolerance
    setVerdict(correct ? null : 'wrong')
    gate.record(correct)
  }

  function revealAnswer() {
    setAnnounce(true)
    const card: Card = options
      ? { id: `check:${id}`, kind: 'choice', prompt: question, options, correct: answer, answer: options[answer] }
      : { id: `check:${id}`, kind: 'flip', prompt: question, answer: String(answer) }
    gate.reveal(card)
  }

  const answerText = options ? options[answer] : String(answer)
  const wrongText =
    (options && selected !== null && feedback?.[selected]) || 'Пока нет. Подумай ещё раз — ты справишься.'
  const solvedBlock = (
    <div className="feedback-right">
      <p className="m-0">
        {gate.revealed ? `Ответ: ${answerText}. Этот вопрос вернётся к тебе на повторении.` : '✓ Верно!'}
      </p>
      {explain && <div className="mt-2 text-ink">{explain}</div>}
    </div>
  )

  return (
    <div className="gate-card" data-gate="check" data-passed={solved}>
      <p className="gate-label">Проверь себя</p>
      <p className="gate-question">{question}</p>

      {options ? (
        <div role="radiogroup" aria-label={question} className="mt-3 flex flex-col gap-2">
          {options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={shownChoice === i}
              className="option-btn"
              data-selected={shownChoice === i}
              data-right={solved && i === answer}
              disabled={solved}
              onClick={() => {
                setSelected(i)
                setVerdict(null)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-label="Твой ответ"
          className="text-input"
          value={solved && text === '' ? answerText : text}
          disabled={solved}
          onChange={(e) => {
            setText(e.target.value)
            setVerdict(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && text.trim() !== '') submit()
          }}
        />
      )}

      {!solved && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={submit}
            disabled={options ? selected === null : text.trim() === ''}
          >
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={revealAnswer}>
              Показать ответ
            </button>
          )}
        </div>
      )}

      <div role="status" aria-live="polite">
        {!solved && verdict === 'wrong' && <p className="feedback-wrong">{wrongText}</p>}
        {!solved && verdict === 'not-a-number' && <p className="feedback-wrong">Введи число, например 0.5 или −2</p>}
        {solved && announce && solvedBlock}
      </div>
      {solved && !announce && solvedBlock}
    </div>
  )
}
