import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { ReviewBadge } from './ReviewBadge'

const past = '2000-01-01'
const future = '2999-01-01'

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('ReviewBadge', () => {
  it('counts due cards of known lessons and created cards, but not cards of unknown ids', async () => {
    useProgress.setState({
      cards: {
        known: { box: 1, due: past },
        later: { box: 1, due: future },
        'check:q': { box: 1, due: past },
        removed: { box: 1, due: past },
      },
      customCards: { 'check:q': { id: 'check:q', kind: 'flip', prompt: 'Вопрос', answer: '42' } },
    })
    render(<ReviewBadge knownCardIds={['known', 'later']} />)
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getByText(/к повторению/).parentElement).toHaveTextContent('2 карточки к повторению')
  })

  it('agrees the screen-reader text with the number', async () => {
    useProgress.setState({ cards: { a: { box: 1, due: past } } })
    render(<ReviewBadge knownCardIds={['a']} />)
    expect((await screen.findByText(/к повторению/)).parentElement).toHaveTextContent('1 карточка к повторению')
  })

  it('shows nothing when no known card is due', () => {
    useProgress.setState({ cards: { removed: { box: 1, due: past } } })
    const { container } = render(<ReviewBadge knownCardIds={['a']} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not crash after importing a file with corrupted entries', async () => {
    const file = {
      version: 1,
      lessons: { a: null },
      cards: { c: 'x', d: { box: 9, due: 'x' }, n: null, ok: { box: 1, due: past } },
      code: { e: 5 },
      customCards: { f: null },
    }
    expect(useProgress.getState().importProgress(JSON.stringify(file))).toBe(true)
    render(<ReviewBadge knownCardIds={['ok', 'c', 'd', 'n']} />)
    expect(await screen.findByText('1')).toBeInTheDocument()
  })
})
