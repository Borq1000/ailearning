import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { CodeExercise } from './CodeExercise'

const { run } = vi.hoisted(() => ({ run: vi.fn() }))

vi.mock('./useRunner', () => ({ useRunner: () => run, RUN_TIMEOUT_MS: 2000 }))
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({
    value,
    onChange,
    onRun,
    ariaLabel,
  }: {
    value: string
    onChange: (v: string) => void
    onRun?: () => void
    ariaLabel: string
  }) => (
    <>
      <textarea aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={onRun}>
        run-shortcut
      </button>
    </>
  ),
}))

const green = { status: 'ok', results: [{ name: 't1', pass: true, expectedText: '32', actualText: '32' }] }
const red = { status: 'ok', results: [{ name: 't1', pass: false, expectedText: '32', actualText: '0' }] }

beforeEach(() => {
  useProgress.setState(emptyProgress())
  run.mockReset()
})

describe('CodeExercise', () => {
  it('shows the code as plain text until the lazily loaded editor arrives', async () => {
    // свежая копия модуля: редактор в ней ещё ни разу не загружался
    vi.resetModules()
    const { CodeExercise: FreshExercise } = await import('./CodeExercise')
    const { container } = render(<FreshExercise id="dot" />)
    const placeholder = container.querySelector('.code-editor-placeholder')
    expect(placeholder).toHaveTextContent('function dot(a: number[], b: number[]): number {')
    expect(await screen.findByRole('textbox', { name: 'Код: Напиши dot(a, b)' })).toBeInTheDocument()
    expect(container.querySelector('.code-editor-placeholder')).toBeNull()
  })

  it('passes the gate when every test is green', async () => {
    run.mockResolvedValue(green)
    render(<CodeExercise id="dot" />)
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    expect(await screen.findByText('1 из 1 теста пройдено')).toBeInTheDocument()
    expect(useProgress.getState().gates['code:dot'].passed).toBe(true)
  })

  it('shows expected vs actual and offers the solution after three failed runs', async () => {
    run.mockResolvedValue(red)
    render(<CodeExercise id="dot" />)
    const runButton = screen.getByRole('button', { name: '▶ Запустить тесты' })
    await userEvent.click(runButton)
    expect(await screen.findByText('ожидалось 32, получено 0')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Показать решение' })).toBeNull()
    await userEvent.click(runButton)
    await userEvent.click(runButton)
    await userEvent.click(await screen.findByRole('button', { name: 'Показать решение' }))
    expect(useProgress.getState().gates['code:dot']).toMatchObject({ passed: true, revealed: true })
  })

  it('explains a timeout as a probable infinite loop', async () => {
    run.mockResolvedValue({ status: 'timeout' })
    render(<CodeExercise id="dot" />)
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    expect(await screen.findByText(/Похоже на бесконечный цикл/)).toBeInTheDocument()
  })

  it('saves edits to progress', async () => {
    render(<CodeExercise id="dot" />)
    // редактор подгружается лениво (next/dynamic), поэтому ждём его появления
    const editor = await screen.findByRole('textbox', { name: 'Код: Напиши dot(a, b)' })
    await userEvent.clear(editor)
    await userEvent.type(editor, 'x')
    expect(useProgress.getState().code.dot).toBe('x')
  })

  it('recovers when the runner rejects: shows an error and re-enables the button', async () => {
    run.mockRejectedValue(new Error('boom'))
    render(<CodeExercise id="dot" />)
    await userEvent.click(screen.getByRole('button', { name: '▶ Запустить тесты' }))
    expect(await screen.findByText('Ошибка при запуске: Не удалось запустить проверку кода.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Запустить тесты' })).toBeEnabled()
  })

  it('ignores a second run (e.g. the Ctrl+Enter shortcut) while the first is pending', async () => {
    let finish: (value: unknown) => void = () => {}
    run.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    render(<CodeExercise id="dot" />)
    const shortcut = await screen.findByRole('button', { name: 'run-shortcut' })
    fireEvent.click(shortcut)
    fireEvent.click(shortcut)
    expect(run).toHaveBeenCalledTimes(1)
    finish(red)
    expect(await screen.findByText('ожидалось 32, получено 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Запустить тесты' })).toBeEnabled()
  })
})
