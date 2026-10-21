'use client'

import { useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'
import type { Vec } from '@/lib/math'
import { CONCEPTS } from '@/lib/theme/concepts'
import { formatNum, formatVec, vecEquals } from '@/lib/viz/vector-helpers'
import { LazyVectorScene } from './LazyVectorScene'
import { Stage } from '@/components/viz/stage/Stage'
import { StageFallbackNote } from '@/components/viz/stage/StageFallbackNote'
import { VectorInputs } from './VectorInputs'

const AXIS_NAMES = ['X', 'Y', 'Z']
const POSITIVE_HINTS = ['вправо', 'вверх', 'к тебе']
const NEGATIVE_HINTS = ['влево', 'вниз', 'от тебя']

/** Генерирует описание направления для координаты. */
function getAxisHint(value: number, axisIndex: number): string {
  const axisName = AXIS_NAMES[axisIndex]
  if (value === 0) return `по ${axisName}`
  const hint = value > 0 ? POSITIVE_HINTS[axisIndex] : NEGATIVE_HINTS[axisIndex]
  return `по ${axisName} (${hint})`
}

export function VectorTask({ id, target, start = [0, 0, 0] }: { id: string; target: Vec; start?: Vec }) {
  const gate = useGate(id)
  const [v, setV] = useState<Vec>(start)
  const [wrong, setWrong] = useState(false)
  const solved = gate.passed
  // Решённое задание (в т.ч. после перезагрузки, когда локальный v снова равен start) показывает цель.
  const shown = solved ? target : v
  const color = CONCEPTS.a.glow

  function update(next: Vec) {
    setV(next)
    setWrong(false)
  }

  function check() {
    const ok = vecEquals(v, target, 0.01)
    setWrong(!ok)
    gate.record(ok)
  }

  function revealAnswer() {
    // Форматируем числа с типографическим минусом (−) вместо обычного (-)
    const formatNumForCard = (x: number) => formatNum(x).replace('-', '−')
    const answerParts = target.map((x, i) => `${formatNumForCard(x)} ${getAxisHint(x, i)}`)
    gate.reveal({
      id: `vector-task:${id}`,
      kind: 'flip',
      prompt: `Куда указывает вектор v = ${formatVec(target)}? Назови сдвиг по каждой оси.`,
      answer: `${answerParts.join(', ')}.`,
    })
  }

  return (
    <div className="gate-card" data-gate="vector-task" data-passed={solved}>
      <p className="gate-label m-0">Задание</p>
      <p className="gate-question">Поставь стрелку v в точку {formatVec(target)}</p>
      <Stage
        height={300}
        fallback={<StageFallbackNote />}
        controls={<VectorInputs label="v" color={color} value={shown} onChange={update} disabled={solved} />}
      >
        <LazyVectorScene
          vectors={[{ id: 'v', value: shown, color, label: 'v', draggable: !solved }]}
          onChange={(_, next) => update(next)}
        />
      </Stage>
      {!solved && (
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={check}>
            Проверить
          </button>
          {gate.attempts >= 2 && (
            <button type="button" className="btn-ghost" onClick={revealAnswer}>
              Показать ответ
            </button>
          )}
        </div>
      )}
      {wrong && !solved && (
        <p role="status" className="feedback-wrong">
          Пока {formatVec(v)}. Сравни каждую координату с целью: x — вправо, y — вверх, z — к тебе.
        </p>
      )}
      {solved && (
        <p role="status" className="feedback-right">
          {gate.revealed
            ? `Вот так: ${formatNum(target[0])} по X, ${formatNum(target[1])} по Y, ${formatNum(target[2])} по Z.`
            : '✓ Точно в цель!'}
        </p>
      )}
    </div>
  )
}
