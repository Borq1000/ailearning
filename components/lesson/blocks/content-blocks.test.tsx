import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { GLOSSARY } from '@/content/glossary'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { Faded } from '@/components/lesson/gates/Faded'
import { Level, Levels } from './Levels'
import { Term } from './Term'
import { WorkedExample } from './WorkedExample'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('Faded', () => {
  const steps = [{ text: '2·3 =', answer: 6 }, { text: '(−1)·4 =', answer: -4 }, { text: 'Сумма готова' }]

  it('checks every blank and accepts a comma and a typographic minus', async () => {
    render(<Faded id="f1" steps={steps} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 1' }), '6')
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 2' }), '−3')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText('не то')).toBeInTheDocument()
    expect(useProgress.getState().gates.f1.passed).toBe(false)

    const second = screen.getByRole('textbox', { name: 'Пропуск в шаге 2' })
    await userEvent.clear(second)
    await userEvent.type(second, '−4,0')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(useProgress.getState().gates.f1.passed).toBe(true)
  })
})

describe('WorkedExample', () => {
  it('reveals the solution one step at a time', async () => {
    render(
      <WorkedExample title="Пример">
        <p>Шаг А</p>
        <p>Шаг Б</p>
        <p>Шаг В</p>
      </WorkedExample>,
    )
    expect(screen.getByText('Шаг А')).toBeInTheDocument()
    expect(screen.queryByText('Шаг Б')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Следующий шаг (2/3)' }))
    expect(screen.getByText('Шаг Б')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Показать всё' }))
    expect(screen.getByText('Шаг В')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Следующий шаг/ })).toBeNull()
  })
})

describe('Levels', () => {
  it('switches between explanation levels', async () => {
    render(
      <Levels>
        <Level title="История">
          <p>сказка</p>
        </Level>
        <Level title="Алгебра">
          <p>формула</p>
        </Level>
      </Levels>,
    )
    expect(screen.getByRole('tab', { name: 'История' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('сказка')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Алгебра' }))
    expect(screen.getByText('формула')).toBeInTheDocument()
    expect(screen.queryByText('сказка')).toBeNull()
  })
})

describe('Term', () => {
  it('opens a definition and closes it with Escape', async () => {
    render(
      <p>
        Это <Term id="vector">вектор</Term>.
      </p>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'вектор' }))
    expect(screen.getByRole('dialog', { name: 'Вектор' })).toHaveTextContent(GLOSSARY.vector.short)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('points to the lesson where a not-yet-studied term is explained', async () => {
    render(<Term id="dot-product">скалярное произведение</Term>)
    await userEvent.click(screen.getByRole('button', { name: 'скалярное произведение' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Подробно — в уроке 1.3')
  })

  it('renders plain text for an unknown term', () => {
    render(<Term id="nope">слово</Term>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('слово')).toBeInTheDocument()
  })
})
