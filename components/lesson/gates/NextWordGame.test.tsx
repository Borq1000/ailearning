import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { NextWordGame } from './NextWordGame'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('NextWordGame', () => {
  it('comments every guess and passes after the last round', async () => {
    render(
      <NextWordGame
        id="nw"
        rounds={[
          { context: 'Я пью горячий…', options: ['чай', 'снег'], answers: [0], note: 'Напиток.' },
          { context: 'Он открыл…', options: ['дверь', 'книгу'], answers: [0, 1], note: 'Подходит всё.' },
        ]}
      />,
    )
    const wrong = screen.getByRole('button', { name: 'снег' })
    await userEvent.click(wrong)
    expect(wrong).toHaveFocus()
    expect(wrong).toHaveAttribute('aria-disabled', 'true')
    const verdict = screen.getByText(/Вероятнее всего — «чай»/)
    expect(verdict).toBeInTheDocument()
    expect(screen.getAllByRole('status').some((el) => el.contains(verdict))).toBe(true)
    expect(useProgress.getState().gates.nw?.passed).toBeFalsy()
    await userEvent.click(screen.getByRole('button', { name: 'книгу' }))
    expect(screen.getByText(/✓ Подходит всё/)).toBeInTheDocument()
    expect(useProgress.getState().gates.nw.passed).toBe(true)
  })

  it('shows the best answers and notes for a game passed before a reload', () => {
    useProgress.getState().passGate('nw2')
    render(
      <NextWordGame
        id="nw2"
        rounds={[{ context: 'Я пью горячий…', options: ['чай', 'снег'], answers: [0], note: 'Напиток.' }]}
      />,
    )
    expect(screen.getByRole('button', { name: 'чай' })).toHaveAttribute('data-right', 'true')
    expect(screen.getByText(/✓ Напиток\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'снег' })).toHaveAttribute('aria-disabled', 'true')
  })
})
