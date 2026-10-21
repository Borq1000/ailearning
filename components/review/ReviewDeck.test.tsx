import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Card } from '@/lib/course/types'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { ReviewDeck } from './ReviewDeck'

const cards: Card[] = [
  { id: 'c-a', kind: 'flip', prompt: 'Вопрос А', answer: 'Ответ А' },
  { id: 'c-z', kind: 'flip', prompt: 'Не сегодня', answer: '…' },
]

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('ReviewDeck', () => {
  it('shows only due cards and finishes the session', async () => {
    useProgress.setState({
      cards: { 'c-a': { box: 1, due: '2000-01-01' }, 'c-z': { box: 2, due: '2999-01-01' } },
    })
    render(<ReviewDeck cards={cards} />)
    expect(await screen.findByText('Вопрос А')).toBeInTheDocument()
    expect(screen.queryByText('Не сегодня')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    await userEvent.click(screen.getByRole('button', { name: 'Помню ✓' }))
    await userEvent.click(screen.getByRole('button', { name: 'Следующая карточка →' }))
    expect(screen.getByText('На сегодня всё! 🎉 Повторено: 1 карточка.')).toBeInTheDocument()
    expect(useProgress.getState().cards['c-a'].box).toBe(2)
  })

  it('includes cards created from revealed answers', async () => {
    useProgress
      .getState()
      .revealGate('q', { id: 'check:q', kind: 'flip', prompt: 'Забытый вопрос', answer: '42' }, '1999-12-31')
    render(<ReviewDeck cards={[]} />)
    expect(await screen.findByText('Забытый вопрос')).toBeInTheDocument()
  })

  it('keeps working after importing a file with corrupted entries', async () => {
    const file = {
      version: 2,
      lessons: { a: null },
      cards: { c: 'x', d: { box: 9, due: 'x' }, n: null, 'c-a': { box: 1, due: '2000-01-01' } },
      code: { e: 5 },
      customCards: { f: null },
    }
    expect(useProgress.getState().importProgress(JSON.stringify(file))).toBe(true)
    render(<ReviewDeck cards={cards} />)
    expect(await screen.findByText('Вопрос А')).toBeInTheDocument()
  })

  it('downloads progress as a JSON file and frees the link a moment later', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:progress')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    // jsdom не умеет навигацию по ссылке-загрузке и пишет «Not implemented» в консоль.
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      render(<ReviewDeck cards={[]} />)
      fireEvent.click(screen.getByRole('button', { name: 'Скачать прогресс' }))
      expect(createObjectURL).toHaveBeenCalledOnce()
      expect(anchorClick).toHaveBeenCalledOnce()
      // Safari прерывает загрузку, если ссылку отозвать сразу после click()
      expect(revokeObjectURL).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:progress')
    } finally {
      anchorClick.mockRestore()
      vi.useRealTimers()
    }
  })
})
