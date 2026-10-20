'use client'

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { CardView } from '@/components/review/CardView'
import type { Card } from '@/lib/course/types'
import { downloadText } from '@/lib/download'
import { plural } from '@/lib/plural'
import { isDue, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function ReviewDeck({ cards }: { cards: Card[] }) {
  const hydrated = useHydrated()
  const states = useProgress((s) => s.cards)
  const customCards = useProgress((s) => s.customCards)
  const reviewCard = useProgress((s) => s.reviewCard)
  const exportProgress = useProgress((s) => s.exportProgress)
  const importProgress = useProgress((s) => s.importProgress)
  const [session, setSession] = useState<string[] | null>(null)
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const today = todayISO()

  const byId = useMemo(
    () => new Map([...cards, ...Object.values(customCards)].map((card) => [card.id, card])),
    [cards, customCards],
  )

  // Набор карточек на сессию фиксируется в начале, чтобы ответы не меняли очередь на ходу.
  useEffect(() => {
    if (!hydrated || session !== null) return
    const current = useProgress.getState().cards
    // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние зависит от localStorage и вычисляется только после гидратации
    setSession([...byId.keys()].filter((cardId) => current[cardId] && isDue(current[cardId], todayISO())))
  }, [hydrated, session, byId])

  const card = session && index < session.length ? byId.get(session[index]) : undefined
  const upcoming = Object.entries(states)
    .filter(([cardId, state]) => byId.has(cardId) && state.due > today)
    .map(([, state]) => state.due)
    .sort()[0]

  function download() {
    downloadText(`ailearning-progress-${today}.json`, exportProgress())
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = importProgress(await file.text())
    setMessage(ok ? 'Прогресс загружен. Обнови страницу, чтобы увидеть изменения.' : 'Не получилось: это не файл прогресса учебника.')
  }

  return (
    <div>
      {!hydrated || session === null ? (
        <p className="text-muted">Загружаю колоду…</p>
      ) : card ? (
        <div>
          <p className="gate-label">
            Карточка {index + 1} из {session.length}
          </p>
          <div className="mt-3">
            <CardView
              key={card.id}
              card={card}
              onAnswer={(correct) => {
                reviewCard(card.id, correct, todayISO())
                setAnswered(true)
              }}
            />
          </div>
          {answered && (
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                setIndex((i) => i + 1)
                setAnswered(false)
              }}
            >
              Следующая карточка →
            </button>
          )}
        </div>
      ) : (
        <div className="summary-card">
          <p className="m-0 font-serif text-xl">
            {session.length > 0
              ? `На сегодня всё! 🎉 Повторено: ${session.length} ${plural(session.length, ['карточка', 'карточки', 'карточек'])}.`
              : 'На сегодня всё! 🎉'}
          </p>
          <p className="mt-2 mb-0 text-ink-soft">
            {upcoming
              ? `Следующее повторение — ${formatDate(upcoming)}.`
              : 'Пройди урок до конца — его карточки появятся в колоде.'}
          </p>
        </div>
      )}

      <section className="mt-14 border-t border-line pt-6">
        <h2 className="font-serif text-xl">Резервная копия</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Прогресс хранится только в этом браузере. Скачай файл, чтобы перенести его на другое устройство или не потерять.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost" onClick={download}>
            Скачать прогресс
          </button>
          <label className="btn-ghost cursor-pointer">
            Загрузить из файла
            <input type="file" accept="application/json" className="sr-only" onChange={upload} />
          </label>
        </div>
        {message && (
          <p role="status" className="mt-3 text-sm text-ink-soft">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
