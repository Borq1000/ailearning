import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { ShapeGame, type ShapeRound } from './ShapeGame'

const rounds: ShapeRound[] = [
  { a: [2, 3], b: [3, 4] },
  { a: [2, 3], b: [2, 3] },
]

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('ShapeGame', () => {
  it('moves through the rounds and passes after the last correct answer', async () => {
    render(<ShapeGame id="sg" rounds={rounds} />)
    expect(screen.getByText(/Раунд 1 из 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    expect(screen.getByRole('status')).toHaveTextContent(/Не то/)
    expect(useProgress.getState().gates.sg).toMatchObject({ passed: false, attempts: 1 })
    await userEvent.click(screen.getByRole('button', { name: '2×4' }))
    expect(screen.getByText(/Раунд 2 из 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Перемножить нельзя' }))
    expect(useProgress.getState().gates.sg.passed).toBe(true)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.getByText('2×3 · 2×3 → Перемножить нельзя')).toBeInTheDocument()
  })

  it('offers the rule after two wrong answers and files it for review', async () => {
    render(<ShapeGame id="sg2" rounds={rounds} />)
    expect(screen.queryByRole('button', { name: 'Показать правило' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать правило' }))
    expect(useProgress.getState().gates.sg2).toMatchObject({ passed: true, revealed: true })
    expect(useProgress.getState().customCards['shape-game:sg2']).toMatchObject({ kind: 'flip' })
    expect(screen.getByText(/Правило:/)).toBeInTheDocument()
  })

  it('shows the finished view after a reload', () => {
    useProgress.getState().recordAttempt('sg3', true)
    render(<ShapeGame id="sg3" rounds={rounds} />)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2×4' })).toBeNull()
  })
})
