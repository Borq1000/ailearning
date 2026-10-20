'use client'

import { useState, type ReactNode } from 'react'
import { useProgress } from '@/lib/progress/store'
import { useGate } from '@/components/lesson/engine/useGate'

const MIN_LENGTH = 20

export interface ExplainBackProps {
  id: string
  prompt: string
  reference: ReactNode
  points: string[]
}

export function ExplainBack({ id, prompt, reference, points }: ExplainBackProps) {
  const gate = useGate(id)
  const text = useProgress((s) => s.explanations?.[id]) ?? ''
  const saveExplanation = useProgress((s) => s.saveExplanation)
  const [compared, setCompared] = useState(false)
  const [checked, setChecked] = useState<boolean[]>(() => points.map(() => false))
  const showReference = compared || gate.passed
  const canCompare = text.trim().length >= MIN_LENGTH

  return (
    <div className="gate-card" data-gate="explain" data-passed={gate.passed}>
      <p className="gate-label">Объясни своими словами</p>
      <p className="gate-question">{prompt}</p>
      <textarea
        aria-label="Твоё объяснение"
        className="text-area"
        rows={5}
        value={text}
        placeholder="Пиши так, будто объясняешь другу…"
        onChange={(e) => saveExplanation(id, e.target.value)}
      />

      {!showReference && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" disabled={!canCompare} onClick={() => setCompared(true)}>
            Сравнить с эталоном
          </button>
          {!canCompare && <span className="text-xs text-muted">Хотя бы пара предложений — от 20 символов.</span>}
        </div>
      )}

      {showReference && (
        <div className="mt-4 rounded-lg bg-paper-deep p-4">
          <p className="gate-label">Эталонный ответ</p>
          <div className="mt-1 text-[15px] leading-relaxed">{reference}</div>
          <p className="gate-label mt-4">Отметь, что ты упомянул</p>
          <ul className="mt-2 list-none space-y-1 p-0">
            {points.map((point, i) => (
              <li key={point}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked[i] ?? false}
                    onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  />
                  {point}
                </label>
              </li>
            ))}
          </ul>
          {!gate.passed && (
            <button type="button" className="btn-primary mt-4" onClick={gate.pass}>
              Готово, я сравнил
            </button>
          )}
          {checked.some((v) => !v) && (
            <p className="mt-2 text-xs text-muted">
              Пропустил пункт — не беда: перечитай эталон и допиши своё объяснение.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
