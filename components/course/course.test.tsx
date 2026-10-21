import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { attentionCourse } from '@/content/attention/course'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { CourseMap } from '@/components/course/CourseMap'
import { ContinueButton } from './ContinueButton'
import { CourseNavList } from './CourseNav'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('CourseNavList', () => {
  it('shows statuses and ignores progress for lessons that no longer exist', async () => {
    useProgress.setState({
      lessons: {
        'attention/0.1': { status: 'completed', unlockedStep: 3 },
        'attention/9.9': { status: 'completed', unlockedStep: 1 },
      },
    })
    await useProgress.persist.rehydrate()
    render(<CourseNavList course={attentionCourse} currentSlug="0-1-riddle" />)
    expect(screen.getByRole('link', { name: /0\.1 Загадка/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('пройден')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'пройден' })).toBeInTheDocument()
    expect(screen.getAllByText('скоро').length).toBeGreaterThan(0)
  })
})

describe('ContinueButton', () => {
  it('invites a newcomer to start with the first lesson', async () => {
    await useProgress.persist.rehydrate()
    render(<ContinueButton course={attentionCourse} />)
    expect(screen.getByRole('link', { name: /Начать с первого урока/ })).toHaveAttribute(
      'href',
      '/courses/attention/0-1-riddle',
    )
  })
})

describe('ContinueButton with stale progress', () => {
  it('still invites to start when progress holds only unknown lesson ids', async () => {
    useProgress.setState({ lessons: { 'attention/9.9': { status: 'completed', unlockedStep: 0 } } })
    await useProgress.persist.rehydrate()
    render(<ContinueButton course={attentionCourse} />)
    expect(screen.getByRole('link', { name: /Начать с первого урока/ })).toBeInTheDocument()
  })
})

describe('ContinueButton after the first lesson', () => {
  it('continues with the next lesson when progress is stored under the course', async () => {
    useProgress.setState({ lessons: { 'attention/0.1': { status: 'completed', unlockedStep: 6 } } })
    await useProgress.persist.rehydrate()
    render(<ContinueButton course={attentionCourse} />)
    expect(screen.getByRole('link', { name: /Продолжить: 0\.2/ })).toHaveAttribute('href', '/courses/attention/0-2-journey-map')
  })
})

describe('CourseMap', () => {
  it('expands a module to show its lessons', async () => {
    render(<CourseMap />)
    await userEvent.click(screen.getByRole('button', { name: /Математика как язык/ }))
    expect(screen.getByText(/1\.1 Вектор: стрелка и список чисел/)).toBeInTheDocument()
  })
})
