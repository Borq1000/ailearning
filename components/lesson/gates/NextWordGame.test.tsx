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
    await userEvent.click(screen.getByRole('button', { name: 'снег' }))
    expect(screen.getByText(/чаще говорят «чай»/)).toBeInTheDocument()
    expect(useProgress.getState().gates.nw?.passed).toBeFalsy()
    await userEvent.click(screen.getByRole('button', { name: 'книгу' }))
    expect(screen.getByText(/✓ Подходит всё/)).toBeInTheDocument()
    expect(useProgress.getState().gates.nw.passed).toBe(true)
  })
})
