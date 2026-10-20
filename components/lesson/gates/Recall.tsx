'use client'

import { useEffect, useState } from 'react'
import type { Card } from '@/lib/course/types'
import { isDue, pickRecallCards, todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'
import { CardView } from '@/components/review/CardView'
import { useLesson } from '@/components/lesson/engine/LessonContext'
import { useGate } from '@/components/lesson/engine/useGate'

interface RecallSet {
  cards: Card[]
  /** Карточки, срок которых действительно подошёл: только их ответы двигают расписание. */
  due: ReadonlySet<string>
}

export function Recall({ id }: { id: string }) {
  const { passed, pass } = useGate(id)
  const { recallCards } = useLesson()
  const hydrated = useHydrated()
  const reviewCard = useProgress((s) => s.reviewCard)
  const [picked, setPicked] = useState<RecallSet | null>(null)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [answered, setAnswered] = useState(0)

  // Карточки выбираются один раз, после загрузки прогресса: дальнейшие ответы не меняют набор.
  useEffect(() => {
    if (!hydrated || picked !== null) return
    const { cards: states, customCards, gates } = useProgress.getState()
    if (gates[id]?.passed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- состояние зависит от localStorage и вычисляется только после гидратации
      setAlreadyDone(true)
      setPicked({ cards: [], due: new Set() })
      return
    }
    const today = todayISO()
    const pool = new Map<string, Card>()
    for (const card of [...recallCards, ...Object.values(customCards)]) pool.set(card.id, card)
    const ids = pickRecallCards([...pool.keys()], states, today, id)
    setPicked({
      cards: ids.map((cardId) => pool.get(cardId)).filter((c): c is Card => c !== undefined),
      // Если подошедших карточек нет, разминка берёт любые прошлые — это тренировка, расписание она не трогает.
      due: new Set(ids.filter((cardId) => states[cardId] !== undefined && isDue(states[cardId], today))),
    })
  }, [hydrated, picked, recallCards, id])

  useEffect(() => {
    if (picked?.cards.length === 0 && !passed) pass()
  }, [picked, passed, pass])

  function onAnswer(card: Card, correct: boolean) {
    if (picked?.due.has(card.id)) reviewCard(card.id, correct, todayISO())
    const count = answered + 1
    setAnswered(count)
    if (picked && count >= picked.cards.length) pass()
  }

  const cards = picked?.cards
  return (
    <div className="gate-card" data-gate="recall" data-passed={passed}>
      <p className="gate-label">Разминка · вспомни, не подглядывая</p>
      {picked === null && <p className="mt-2 text-sm text-muted">Подбираю карточки из прошлых уроков…</p>}
      {alreadyDone && <p className="mt-2 text-sm text-success">✓ Разминка этого урока уже пройдена.</p>}
      {cards?.length === 0 && !alreadyDone && (
        <p className="mt-2 text-sm text-ink-soft">
          Разминки пока нет: карточки появятся, когда ты пройдёшь первые уроки.
        </p>
      )}
      {cards && cards.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {cards.map((card) => (
            <CardView key={card.id} card={card} onAnswer={(correct) => onAnswer(card, correct)} />
          ))}
        </div>
      )}
      {passed && cards && cards.length > 0 && (
        <p className="feedback-right">
          {picked?.due.size
            ? '✓ Разминка пройдена. Карточки перенесены в расписание повторений.'
            : '✓ Разминка пройдена.'}
        </p>
      )}
    </div>
  )
}
