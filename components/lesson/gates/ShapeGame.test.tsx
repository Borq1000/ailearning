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
    expect(screen.getByText(/Раунд 2 из 2: A —/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Перемножить нельзя' }))
    expect(useProgress.getState().gates.sg.passed).toBe(true)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.getByText('2×3 · 2×3 → Перемножить нельзя')).toBeInTheDocument()
  })

  it('confirms a correct answer in a non-final round and moves focus to the next round', async () => {
    render(<ShapeGame id="sg4" rounds={rounds} />)
    await userEvent.click(screen.getByRole('button', { name: '2×4' }))
    expect(screen.getByRole('status')).toHaveTextContent('✓ Верно: A·B — 2×4. Раунд 2 из 2.')
    const first = screen.getAllByRole('button')[0]
    expect(first).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: '3×2' }))
    expect(screen.getByRole('status')).not.toHaveTextContent('✓ Верно')
  })

  it('does not move focus on the first render', () => {
    render(<ShapeGame id="sg5" rounds={rounds} />)
    expect(document.body).toHaveFocus()
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

  it('shows the finished view after a reload without announcing it or moving focus', () => {
    useProgress.getState().recordAttempt('sg3', true)
    render(<ShapeGame id="sg3" rounds={rounds} />)
    expect(screen.getByText(/Все раунды пройдены/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2×4' })).toBeNull()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(document.body).toHaveFocus()
  })

  it('announces the finish in its single live region and moves focus to the finished block', async () => {
    render(<ShapeGame id="sg6" rounds={rounds} />)
    const status = screen.getByRole('status')
    await userEvent.click(screen.getByRole('button', { name: '2×4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Перемножить нельзя' }))
    // та же самая живая область, а не новая: читалка объявит результат
    expect(screen.getAllByRole('status')).toEqual([status])
    expect(status).toHaveTextContent('Все раунды пройдены')
    const finished = screen.getByText('2×3 · 2×3 → Перемножить нельзя').closest('[data-finished]')
    expect(finished).toHaveFocus()
    expect(finished).toContainElement(status)
  })

  it('moves focus to the finished block after «Показать правило» too', async () => {
    render(<ShapeGame id="sg7" rounds={rounds} />)
    const status = screen.getByRole('status')
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: '3×3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать правило' }))
    expect(status).toHaveTextContent(/Правило:/)
    expect(screen.getByText('2×3 · 3×4 → 2×4').closest('[data-finished]')).toHaveFocus()
  })
})
