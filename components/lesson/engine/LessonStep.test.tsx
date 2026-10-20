import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { LessonStep } from './LessonStep'
import { useGate } from '@/components/lesson/engine/useGate'

function FakeGate({ id }: { id: string }) {
  const gate = useGate(id)
  return (
    <button type="button" onClick={() => gate.record(true)}>
      {gate.passed ? 'gate passed' : 'pass gate'}
    </button>
  )
}

function Lesson() {
  return (
    <LessonProvider lessonId="9.1" lessonCardIds={['c1']} recallCards={[]}>
      <LessonStep index="0" total="3">
        <p>Шаг ноль</p>
      </LessonStep>
      <LessonStep index="1" total="3">
        <p>Шаг один</p>
        <FakeGate id="g1" />
      </LessonStep>
      <LessonStep index="2" total="3">
        <p>Шаг два</p>
      </LessonStep>
    </LessonProvider>
  )
}

const step = (i: number) => document.querySelector(`[data-step="${i}"]`)!

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('LessonStep', () => {
  it('shows the first step, a teaser of the second and hides the rest', () => {
    render(<Lesson />)
    expect(step(0)).toHaveAttribute('data-state', 'open')
    expect(step(1)).toHaveAttribute('data-state', 'teaser')
    expect(step(2)).toHaveAttribute('data-state', 'locked')
    expect(step(2)).not.toBeVisible()
  })

  it('unlocks the next step with «Дальше» when the step has no gates', async () => {
    render(<Lesson />)
    await userEvent.click(screen.getByRole('button', { name: 'Дальше →' }))
    expect(step(1)).toHaveAttribute('data-state', 'open')
    expect(useProgress.getState().lessons['9.1'].unlockedStep).toBe(1)
  })

  it('keeps «Дальше» disabled until every gate of the step passes', async () => {
    useProgress.getState().unlockStep('9.1', 1)
    render(<Lesson />)
    const next = screen.getByRole('button', { name: 'Дальше →' })
    expect(next).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'pass gate' }))
    expect(next).toBeEnabled()
  })

  it('completes the lesson on the last step and enrolls its cards', async () => {
    useProgress.getState().unlockStep('9.1', 2)
    useProgress.getState().recordAttempt('g1', true)
    render(<Lesson />)
    await userEvent.click(screen.getByRole('button', { name: 'Завершить урок ✓' }))
    expect(useProgress.getState().lessons['9.1'].status).toBe('completed')
    expect(useProgress.getState().cards.c1?.box).toBe(1)
  })

  it('opens every step of a completed lesson and shows no step buttons', () => {
    useProgress.getState().completeLesson('9.1', [], '2026-10-20')
    render(<Lesson />)
    for (const i of [0, 1, 2]) expect(step(i)).toHaveAttribute('data-state', 'open')
    expect(screen.queryByRole('button', { name: 'Дальше →' })).toBeNull()
  })
})
