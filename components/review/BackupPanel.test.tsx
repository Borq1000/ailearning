import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { BACKUP_KEY } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'
import { BackupPanel } from './BackupPanel'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

describe('BackupPanel', () => {
  it('renders nothing when there is no backup', () => {
    const { container } = render(<BackupPanel />)
    expect(container).toBeEmptyDOMElement()
  })

  it('restores a v1 backup under the attention course', async () => {
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ version: 1, state: { lessons: { '0.1': { status: 'completed', unlockedStep: 3 } } } }),
    )
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(useProgress.getState().lessons['attention/0.1'].status).toBe('completed')
    expect(screen.getByRole('status')).toHaveTextContent(/восстановлена/)
  })

  it('asks before replacing existing progress', async () => {
    useProgress.getState().passGate('attention/keep')
    localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({ version: 1, state: { lessons: { '0.1': { status: 'completed', unlockedStep: 3 } } } }),
    )
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(screen.getByText(/Копия заменит весь текущий прогресс/)).toBeInTheDocument()
    expect(useProgress.getState().lessons['attention/0.1']).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Да, заменить' }))
    expect(useProgress.getState().lessons['attention/0.1'].status).toBe('completed')
    expect(screen.getByRole('status')).toHaveTextContent('Резервная копия восстановлена.')
    expect(screen.queryByText(/Копия заменит/)).toBeNull()
  })

  it('explains that a backup made by a newer version of the site needs a reload', async () => {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ version: 3, state: {} }))
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Копия сделана более новой версией сайта — обнови страницу и попробуй снова.',
    )
  })

  it('recognises a newer raw export as well as a zustand envelope', async () => {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ version: 3, lessons: {} }))
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(screen.getByRole('status')).toHaveTextContent(/более новой версией/)
  })

  it('reports a broken backup instead of crashing', async () => {
    localStorage.setItem(BACKUP_KEY, '{oops')
    render(<BackupPanel />)
    await userEvent.click(await screen.findByRole('button', { name: 'Восстановить' }))
    expect(screen.getByRole('status')).toHaveTextContent(/повреждена/)
  })
})
