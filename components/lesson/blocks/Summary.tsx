'use client'

import type { Card } from '@/lib/course/types'
import { plural } from '@/lib/plural'
import { useProgress } from '@/lib/progress/store'
import { useLesson } from '@/components/lesson/engine/LessonContext'

export function Summary({ points, cards }: { points: string[]; cards: Card[] }) {
  const { lessonKey } = useLesson()
  const completed = useProgress((s) => s.lessons[lessonKey]?.status === 'completed')
  const n = cards.length

  return (
    <div className="summary-card">
      <p className="gate-label">Итог урока</p>
      <ul className="mt-2">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="mt-4 mb-0 text-sm text-ink-soft">
        🗂{' '}
        {completed
          ? `${n} ${plural(n, ['карточка добавлена', 'карточки добавлены', 'карточек добавлено'])} в колоду повторения.`
          : `После завершения урока ${n} ${plural(n, ['карточка попадёт', 'карточки попадут', 'карточек попадут'])} в колоду повторения.`}
      </p>
    </div>
  )
}
