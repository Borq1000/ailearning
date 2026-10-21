import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { GLOSSARY } from '@/content/glossary'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { LessonProvider } from '@/components/lesson/engine/LessonContext'
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

  it('uses text keyboards so a minus can be typed on iPhone', () => {
    render(<Faded id="f0" steps={steps} />)
    for (const field of screen.getAllByRole('textbox')) {
      expect(field).toHaveAttribute('inputmode', 'text')
      expect(field).toHaveAttribute('autocomplete', 'off')
      expect(field).toHaveAttribute('spellcheck', 'false')
    }
  })

  it('fills the blanks with the correct answers after "Показать ответы"', async () => {
    render(<Faded id="f2" steps={steps} />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 1' }), '1')
    await userEvent.type(screen.getByRole('textbox', { name: 'Пропуск в шаге 2' }), '9')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    await userEvent.click(screen.getByRole('button', { name: 'Показать ответы' }))

    const first = screen.getByRole('textbox', { name: 'Пропуск в шаге 1' })
    const second = screen.getByRole('textbox', { name: 'Пропуск в шаге 2' })
    expect(first).toHaveValue('6')
    expect(second).toHaveValue('-4')
    expect(first).toBeDisabled()
    expect(second).toBeDisabled()
    expect(useProgress.getState().gates.f2).toMatchObject({ passed: true, revealed: true })
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
    expect(screen.getByText('сказка')).toBeVisible()
    await userEvent.click(screen.getByRole('tab', { name: 'Алгебра' }))
    expect(screen.getByText('формула')).toBeVisible()
    expect(screen.getByText('сказка')).not.toBeVisible()
  })

  it('keeps every level in the HTML and links tabs with their panels', () => {
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
    // неактивный уровень скрыт, но есть в разметке (его видят поисковики и читалки без JS)
    expect(screen.getByText('формула')).toBeInTheDocument()
    expect(screen.getByText('формула')).not.toBeVisible()
    for (const name of ['История', 'Алгебра']) {
      const tab = screen.getByRole('tab', { name })
      const panel = document.getElementById(tab.getAttribute('aria-controls')!)
      expect(panel).toHaveAttribute('role', 'tabpanel')
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    }
    expect(screen.getByRole('tabpanel', { name: 'История' })).toHaveTextContent('сказка')
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

  it('links back to the lesson once the term has been studied', async () => {
    useProgress.getState().completeLesson('1.3', [], '2026-10-20')
    render(<Term id="dot-product">скалярное произведение</Term>)
    await userEvent.click(screen.getByRole('button', { name: 'скалярное произведение' }))
    const link = screen.getByRole('link', { name: /^Урок 1\.3: / })
    expect(link).toHaveAttribute('href', '/courses/attention/1-3-dot-product')
  })

  it('does not link a term to the lesson the learner is reading', async () => {
    render(
      <LessonProvider courseId="attention" lessonId="1.3" lessonCardIds={[]} recallCards={[]}>
        <Term id="dot-product">скалярное произведение</Term>
      </LessonProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'скалярное произведение' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(/Урок 1\.3: /)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders plain text for an unknown term', () => {
    render(<Term id="nope">слово</Term>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('слово')).toBeInTheDocument()
  })
})
