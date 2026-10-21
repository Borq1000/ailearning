import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { seededShuffle } from '@/lib/progress/scheduler'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
import { Check } from './Check'
import { ExplainBack } from './ExplainBack'
import { Predict } from './Predict'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

const gates = () => useProgress.getState().gates

describe('Check with options', () => {
  const props = {
    id: 'q1',
    question: 'Сколько будет 2 + 2?',
    options: ['3', '4', '5'],
    answer: 1,
    explain: 'Потому что 4.',
    feedback: ['Чуть больше.', '', 'Чуть меньше.'],
  }

  it('passes on the right answer and shows the explanation', async () => {
    render(<Check {...props} />)
    await userEvent.click(screen.getByRole('radio', { name: '4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('✓ Верно!')).toBeInTheDocument()
    expect(screen.getByText('Потому что 4.')).toBeInTheDocument()
    expect(gates().q1.passed).toBe(true)
  })

  it('gives option-specific feedback and offers the answer only after two tries', async () => {
    render(<Check {...props} />)
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('Чуть больше.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Показать ответ' })).toBeNull()

    await userEvent.click(screen.getByRole('radio', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))

    expect(gates().q1).toMatchObject({ passed: true, revealed: true })
    expect(useProgress.getState().customCards['check:q1']).toMatchObject({ kind: 'choice', correct: 1 })
    expect(screen.getByText(/Ответ: 4/)).toBeInTheDocument()
  })
})

describe('Check with a number', () => {
  it('uses a text keyboard so a minus can be typed on iPhone', () => {
    render(<Check id="q0" question="Сколько?" answer={-4} />)
    const field = screen.getByRole('textbox', { name: 'Твой ответ' })
    expect(field).toHaveAttribute('inputmode', 'text')
    expect(field).toHaveAttribute('autocomplete', 'off')
    expect(field).toHaveAttribute('spellcheck', 'false')
  })

  it('accepts a decimal comma', async () => {
    render(<Check id="q2" question="Половина от единицы?" answer={0.5} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Твой ответ' }), '0,5')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(gates().q2.passed).toBe(true)
  })

  it('asks for a number instead of counting a non-numeric attempt', async () => {
    render(<Check id="q3" question="Сколько?" answer={2} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Твой ответ' }), 'два')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('Введи число, например 0.5 или −2')).toBeInTheDocument()
    expect(gates().q3).toBeUndefined()
  })
})

describe('Predict', () => {
  const question = 'Кто здесь «он»?'

  it('accepts any prediction, then reveals the explanation', async () => {
    render(
      <Predict id="p1" question={question} options={['кот', 'забор']} answer={1}>
        <p>Объяснение</p>
      </Predict>,
    )
    expect(screen.queryByText('Объяснение')).toBeNull()
    expect(screen.getByRole('button', { name: 'Зафиксировать прогноз' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: 'кот' }))
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать прогноз' }))
    expect(screen.getByText('Объяснение')).toBeInTheDocument()
    expect(screen.getByText(/На самом деле — «забор»/)).toBeInTheDocument()
    expect(gates().p1).toMatchObject({ passed: true, choice: 0 })
  })

  it('celebrates a correct prediction', async () => {
    render(<Predict id="p2" question={question} options={['кот', 'забор']} answer={1} />)
    await userEvent.click(screen.getByRole('radio', { name: 'забор' }))
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать прогноз' }))
    expect(screen.getByText('Так и есть!')).toBeInTheDocument()
  })
})

describe('ExplainBack', () => {
  it('needs a real attempt before the reference, then passes on «Готово»', async () => {
    render(<ExplainBack id="e1" prompt="Объясни" reference={<span>Эталон</span>} points={['пункт А']} />)
    const compare = screen.getByRole('button', { name: 'Сравнить с эталоном' })
    expect(compare).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Твоё объяснение' }), 'Короткий, но настоящий ответ')
    expect(compare).toBeEnabled()
    await userEvent.click(compare)
    expect(screen.getByText('Эталон')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Готово, я сравнил' }))
    expect(gates().e1.passed).toBe(true)
    expect(useProgress.getState().explanations.e1).toBe('Короткий, но настоящий ответ')
  })
})

describe('gates inside a lesson', () => {
  it('store their state under the course and scope the review card of a revealed answer', async () => {
    render(
      <LessonProvider courseId="t" lessonId="1.1" lessonCardIds={[]} recallCards={[]}>
        <Check id="q9" question="2 + 2?" options={['3', '4']} answer={1} />
      </LessonProvider>,
    )
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    expect(gates()['t/q9']).toMatchObject({ passed: true, revealed: true, attempts: 2 })
    expect(gates().q9).toBeUndefined()
    expect(useProgress.getState().customCards['t/check:q9']).toMatchObject({ id: 't/check:q9', correct: 1 })
    expect(useProgress.getState().cards['t/check:q9']?.box).toBe(1)
  })
})

describe('Check polish', () => {
  it('marks the right option as checked after a reload', () => {
    useProgress.getState().recordAttempt('q7', true)
    render(<Check id="q7" question="2 + 2?" options={['3', '4']} answer={1} />)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '3' })).toHaveAttribute('aria-checked', 'false')
  })

  it('ignores Enter in an empty field instead of complaining', async () => {
    render(<Check id="q8" question="Сколько?" answer={2} />)
    const field = screen.getByRole('textbox', { name: 'Твой ответ' })
    field.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByText(/Введи число/)).toBeNull()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})

describe('Check live region', () => {
  it('does not announce a result that arrived from storage, only a fresh answer', async () => {
    render(<Check id="q9" question="2 + 2?" options={['3', '4']} answer={1} />)
    act(() => useProgress.getState().recordAttempt('q9', true))
    expect(screen.getByText('✓ Верно!')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('announces the result of an answer given on this page', async () => {
    render(<Check id="q10" question="2 + 2?" options={['3', '4']} answer={1} />)
    await userEvent.click(screen.getByRole('radio', { name: '4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByRole('status')).toHaveTextContent('✓ Верно!')
  })
})

const optionNames = () => screen.getAllByRole('radio').map((b) => b.textContent)

describe('option order', () => {
  it('Check shows its options in a fixed shuffled order and still checks by the original index', async () => {
    const options = ['3', '4', '5']
    render(<Check id="q11" question="2 + 2?" options={options} answer={1} feedback={['мало', '', 'много']} />)
    const shown = optionNames()
    expect(shown).toEqual(seededShuffle([0, 1, 2], 'q11').map((i) => options[i]))
    expect([...shown].sort()).toEqual([...options].sort())
    // для этого id правильный ответ не стоит на своём исходном месте — порядок действительно перемешан
    expect(shown).not.toEqual(options)

    await userEvent.click(screen.getByRole('radio', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('много')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: '4' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(gates().q11.passed).toBe(true)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('data-right', 'true')
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Check builds the review card from the original options', async () => {
    render(<Check id="q11" question="2 + 2?" options={['3', '4', '5']} answer={1} />)
    await userEvent.click(screen.getByRole('radio', { name: '3' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответ' }))
    expect(useProgress.getState().customCards['check:q11']).toMatchObject({
      options: ['3', '4', '5'],
      correct: 1,
      answer: '4',
    })
  })

  it('Predict shows its options shuffled and stores the original index of the choice', async () => {
    const options = ['кот', 'забор', 'он']
    render(<Predict id="p3" question="Кто?" options={options} answer={1} />)
    const shown = optionNames()
    expect(shown).toEqual(seededShuffle([0, 1, 2], 'p3').map((i) => options[i]))
    expect(shown).not.toEqual(options)
    // «он» стоит на втором месте, а в прогресс попадает его исходный индекс 2
    expect(shown.indexOf('он')).not.toBe(2)
    await userEvent.click(screen.getByRole('radio', { name: 'он' }))
    await userEvent.click(screen.getByRole('button', { name: 'Зафиксировать прогноз' }))
    expect(gates().p3).toMatchObject({ passed: true, choice: 2 })
    expect(screen.getByText(/Твой прогноз: «он»/)).toBeInTheDocument()
    expect(screen.getByText(/На самом деле — «забор»/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'забор' })).toHaveAttribute('data-right', 'true')
  })

  it('Predict marks the stored choice after a reload', () => {
    useProgress.getState().recordAttempt('p3', true, 2)
    render(<Predict id="p3" question="Кто?" options={['кот', 'забор', 'он']} answer={1} />)
    expect(screen.getByRole('radio', { name: 'он' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'кот' })).toHaveAttribute('aria-checked', 'false')
  })
})

describe('ExplainBack polish', () => {
  it('disables «Готово» again if the explanation is erased below the minimum', async () => {
    render(<ExplainBack id="e2" prompt="Объясни" reference={<span>Эталон</span>} points={['пункт']} />)
    const area = screen.getByRole('textbox', { name: 'Твоё объяснение' })
    await userEvent.type(area, 'Достаточно длинное объяснение для сравнения')
    await userEvent.click(screen.getByRole('button', { name: 'Сравнить с эталоном' }))
    const done = screen.getByRole('button', { name: 'Готово, я сравнил' })
    expect(done).toBeEnabled()
    await userEvent.clear(area)
    expect(done).toBeDisabled()
  })
})
