import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Card } from '@/lib/course/types'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { Recall } from './Recall'
import { Summary } from '@/components/lesson/blocks/Summary'

const cards: Card[] = [
  { id: 'c-a', kind: 'flip', prompt: 'Вопрос А', answer: 'Ответ А' },
  { id: 'c-b', kind: 'choice', prompt: 'Вопрос Б', options: ['да', 'нет'], correct: 0, answer: 'Да.' },
]

function renderRecall(recallCards: Card[]) {
  return render(
    <LessonProvider lessonId="9.2" lessonCardIds={[]} recallCards={recallCards}>
      <Recall id="r1" />
    </LessonProvider>,
  )
}

beforeEach(async () => {
  useProgress.setState(emptyProgress())
  await useProgress.persist.rehydrate()
})

describe('Recall', () => {
  it('passes by itself when there is nothing to recall yet (deep link to an early lesson)', async () => {
    renderRecall([])
    expect(await screen.findByText(/Разминки пока нет/)).toBeInTheDocument()
    expect(useProgress.getState().gates.r1?.passed).toBe(true)
  })

  it('shows due cards and passes once all of them are answered', async () => {
    useProgress.setState({
      cards: { 'c-a': { box: 1, due: '2000-01-01' }, 'c-b': { box: 1, due: '2000-01-01' } },
    })
    renderRecall(cards)
    expect(await screen.findByText('Вопрос А')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    await userEvent.click(screen.getByRole('button', { name: 'Помню ✓' }))
    expect(useProgress.getState().gates.r1?.passed).toBeFalsy()
    await userEvent.click(screen.getByRole('button', { name: 'да' }))
    expect(useProgress.getState().gates.r1?.passed).toBe(true)
    expect(useProgress.getState().cards['c-a'].box).toBe(2)
    expect(useProgress.getState().cards['c-b'].box).toBe(2)
  })

  it('falls back to earlier cards even if none were scheduled yet', async () => {
    renderRecall(cards)
    expect(await screen.findAllByText(/Вопрос [АБ]/)).toHaveLength(2)
  })
})

describe('Summary', () => {
  it('lists the points and says how many cards will go to the deck', () => {
    render(
      <LessonProvider lessonId="9.3" lessonCardIds={['c-a', 'c-b']} recallCards={[]}>
        <Summary points={['Первый вывод', 'Второй вывод']} cards={cards} />
      </LessonProvider>,
    )
    expect(screen.getByText('Первый вывод')).toBeInTheDocument()
    expect(screen.getByText(/2 карточки попадут в колоду/)).toBeInTheDocument()
  })
})
