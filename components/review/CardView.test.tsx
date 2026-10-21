import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Card } from '@/lib/course/types'
import { seededShuffle } from '@/lib/progress/scheduler'
import { CardView } from './CardView'

const choice: Card = {
  id: 'card-x',
  kind: 'choice',
  prompt: 'Какая буква первая?',
  options: ['a', 'b', 'c'],
  correct: 0,
  answer: 'Буква a.',
}

const optionNames = () => screen.getAllByRole('button').map((b) => b.textContent)

describe('CardView', () => {
  it('shows choice options in a fixed shuffled order and checks the original index', async () => {
    const onAnswer = vi.fn()
    render(<CardView card={choice} onAnswer={onAnswer} />)
    const shown = optionNames()
    expect(shown).toEqual(seededShuffle([0, 1, 2], 'card-x').map((i) => choice.options![i]))
    expect([...shown].sort()).toEqual(['a', 'b', 'c'])
    expect(shown).not.toEqual(choice.options)

    await userEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'a' })).toHaveAttribute('data-right', 'true')
    expect(screen.getByRole('button', { name: 'b' })).toHaveAttribute('data-right', 'false')
    expect(screen.getByText('Буква a.')).toBeInTheDocument()
  })

  it('counts a wrong pick as not remembered', async () => {
    const onAnswer = vi.fn()
    render(<CardView card={choice} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'c' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: 'c' })).toHaveAttribute('data-selected', 'true')
  })

  it('keeps line breaks of a multi-line prompt', () => {
    render(<CardView card={{ id: 'f', kind: 'flip', prompt: 'Шаг 1\nШаг 2', answer: '…' }} onAnswer={() => {}} />)
    expect(screen.getByText(/Шаг 1/)).toHaveClass('whitespace-pre-wrap')
  })
})
