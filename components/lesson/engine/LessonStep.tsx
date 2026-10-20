'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { todayISO } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { useHydrated } from '@/lib/progress/useHydrated'
import { useLesson } from '@/components/lesson/engine/LessonContext'
import { StepContext } from './StepContext'

export function LessonStep({ index, total, children }: { index: string; total: string; children?: ReactNode }) {
  const i = Number(index)
  const n = Number(total)
  const { lessonId, lessonCardIds } = useLesson()
  const hydrated = useHydrated()
  const lesson = useProgress((s) => s.lessons[lessonId])
  const gates = useProgress((s) => s.gates)
  const unlockStep = useProgress((s) => s.unlockStep)
  const completeLesson = useProgress((s) => s.completeLesson)
  const [gateIds, setGateIds] = useState<string[]>([])

  const registerGate = useCallback((id: string) => {
    setGateIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    return () => setGateIds((ids) => ids.filter((x) => x !== id))
  }, [])
  const stepContext = useMemo(() => ({ index: i, registerGate }), [i, registerGate])

  const completed = lesson?.status === 'completed'
  const unlockedStep = lesson?.unlockedStep ?? 0
  // До загрузки прогресса показываем всё — так совпадает серверный HTML (и его видят поисковики).
  const open = !hydrated || completed || i <= unlockedStep
  const teaser = hydrated && !completed && i === unlockedStep + 1
  const current = hydrated && !completed && i === unlockedStep
  const allPassed = gateIds.every((id) => gates[id]?.passed)
  const isLast = i === n - 1

  function goNext() {
    unlockStep(lessonId, i + 1)
    requestAnimationFrame(() =>
      document.querySelector(`[data-step="${i + 1}"]`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }),
    )
  }

  if (!open && !teaser) {
    return (
      <StepContext.Provider value={stepContext}>
        <section data-step={i} data-state="locked" hidden>
          {children}
        </section>
      </StepContext.Provider>
    )
  }

  return (
    <StepContext.Provider value={stepContext}>
      <section data-step={i} data-state={teaser ? 'teaser' : 'open'} className="lesson-step relative">
        {teaser ? (
          <>
            <div inert aria-hidden className="max-h-44 overflow-hidden opacity-50 blur-[3px] select-none">
              {children}
            </div>
            <div className="lock-pill">🔒 Сначала пройди шаг выше</div>
          </>
        ) : (
          children
        )}
        {current && (
          <div className="step-footer">
            {isLast ? (
              <button
                type="button"
                className="btn-primary"
                disabled={!allPassed}
                onClick={() => completeLesson(lessonId, lessonCardIds, todayISO())}
              >
                Завершить урок ✓
              </button>
            ) : (
              <button type="button" className="btn-primary" disabled={!allPassed} onClick={goNext}>
                Дальше →
              </button>
            )}
            {!allPassed && <span className="text-sm text-muted">Ответь на вопрос выше, чтобы продолжить</span>}
          </div>
        )}
      </section>
    </StepContext.Provider>
  )
}
