'use client'

import { useId, useState, type ReactNode } from 'react'
import { softmax } from '@/lib/math'
import { formatNum } from '@/lib/viz/vector-helpers'
import { NumberField } from '@/components/viz/stage/NumberField'
import { Observatory } from '@/components/viz/stage/Observatory'

/** Оценки держим в разумных пределах: при x/T > 709 eˣ уже Infinity, а сцена должна показывать числа, а не ошибки. */
export const SCORE_BOUND = 50
const MIN_TEMPERATURE = 0.2

const COLORS = { score: '#22d3ee', exp: '#fb923c', share: '#a3e635', negative: '#fb7185' }

/** Экспоненты быстро растут, а у отрицательных оценок почти исчезают: крайности показываем в экспоненциальной записи, чтобы не выдать «0». */
function formatExp(x: number): string {
  return x >= 10000 || (x > 0 && x < 0.01) ? x.toExponential(2) : formatNum(x)
}

/** Доля, которая округлилась бы до 0%, но не равна нулю, подписывается «<1%». */
function formatPercent(x: number): string {
  return x > 0 && x < 0.005 ? '<1%' : `${Math.round(x * 100)}%`
}

/** То же для строки итога: доля, которая округлилась бы до 0, подписывается «<0.01». */
function formatShare(x: number): string {
  return x > 0 && x < 0.005 ? '<0.01' : formatNum(x)
}

function BarColumn({
  title,
  names,
  values,
  max,
  format,
  color,
  signed,
}: {
  title: string
  names: string[]
  values: number[]
  max: number
  format: (x: number) => string
  color: string
  /** Отрицательные значения рисуются другим цветом (только у оценок). */
  signed?: boolean
}) {
  const titleId = useId()
  return (
    <div>
      {/* без uppercase: он превратил бы eˣ в Eˣ, а это другой символ */}
      <p id={titleId} className="m-0 mb-2 font-mono text-[11px] tracking-wider text-space-muted">
        {title}
      </p>
      <ul aria-labelledby={titleId} className="m-0 list-none space-y-1.5 p-0">
        {values.map((x, i) => (
          <li key={i} className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2">
            <span className="truncate text-space-muted" title={names[i]}>
              {names[i]}
            </span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${max === 0 ? 0 : Math.min(100, (Math.abs(x) / max) * 100)}%`,
                  backgroundColor: signed && x < 0 ? COLORS.negative : color,
                }}
              />
            </span>
            <span className="text-right text-space-text">{format(x)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Оценки → экспоненты → доли: три колонки столбиков, живые поля оценок, ползунок температуры. */
export function SoftmaxBars({
  initial = [2, 1, 0.1],
  labels,
  caption,
}: {
  initial?: number[]
  labels?: string[]
  caption?: ReactNode
}) {
  const [scores, setScores] = useState<number[]>(initial)
  const [temperature, setTemperature] = useState(1)
  const names = scores.map((_, i) => labels?.[i] ?? `x${i + 1}`)
  const exps = scores.map((x) => Math.exp(x / temperature))
  const shares = softmax(scores, temperature)
  const total = shares.reduce((s, x) => s + x, 0)
  const canAddTen = Math.max(...scores) + 10 <= SCORE_BOUND

  return (
    <Observatory
      caption={caption}
      footer={
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
            <span className="text-space-muted">оценки:</span>
            {scores.map((x, i) => (
              <NumberField
                key={i}
                value={x}
                bound={SCORE_BOUND}
                label={`оценка ${names[i]}`}
                onCommit={(n) => setScores(scores.map((y, j) => (j === i ? n : y)))}
              />
            ))}
            <button
              type="button"
              className="stage-chip"
              disabled={!canAddTen}
              title={canAddTen ? undefined : `Дальше оценки не растут: предел ${SCORE_BOUND}`}
              onClick={() => setScores(scores.map((x) => x + 10))}
            >
              +10 ко всем
            </button>
            <button
              type="button"
              className="stage-chip"
              onClick={() => {
                setScores(initial)
                setTemperature(1)
              }}
            >
              сбросить
            </button>
          </div>
          <label className="flex flex-wrap items-center gap-3 font-mono text-sm">
            температура T = {formatNum(temperature)}
            <input
              type="range"
              min={MIN_TEMPERATURE}
              max={5}
              step={0.1}
              value={temperature}
              aria-label="Температура"
              className="accent-[#a3e635]"
              onChange={(e) => setTemperature(Number(e.target.value))}
            />
          </label>
          <p className="readout">
            softmax = [{shares.map(formatShare).join(', ')}] · сумма = {formatNum(total)}
          </p>
        </div>
      }
    >
      <div className="grid gap-5 p-5 font-mono text-xs sm:grid-cols-3">
        <BarColumn
          title="1 · оценки x"
          names={names}
          values={scores}
          max={Math.max(1, ...scores.map(Math.abs))}
          format={formatNum}
          color={COLORS.score}
          signed
        />
        <BarColumn
          title={temperature === 1 ? '2 · eˣ' : '2 · e^(x/T)'}
          names={names}
          values={exps}
          max={Math.max(...exps)}
          format={formatExp}
          color={COLORS.exp}
        />
        <BarColumn
          title={temperature === 1 ? '3 · доли: eˣ / сумма' : '3 · доли: e^(x/T) / сумма'}
          names={names}
          values={shares}
          max={1}
          format={formatPercent}
          color={COLORS.share}
        />
      </div>
    </Observatory>
  )
}
