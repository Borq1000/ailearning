import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress } from '@/lib/progress/migrate'
import { useProgress } from '@/lib/progress/store'
import { DotProduct3D } from './DotProduct3D'
import { VectorTask } from './VectorTask'

beforeEach(() => {
  useProgress.setState(emptyProgress())
})

async function setField(name: string, value: string) {
  const field = screen.getByRole('textbox', { name })
  await userEvent.clear(field)
  await userEvent.type(field, `${value}{Enter}`)
}

describe('VectorTask without WebGL', () => {
  it('can be solved with the coordinate fields alone', async () => {
    render(<VectorTask id="vt" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('v, координата x', '2')
    await setField('v, координата z', '3')
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(useProgress.getState().gates.vt.passed).toBe(true)
  })

  it('shows the target once solved, e.g. after a reload', async () => {
    useProgress.getState().recordAttempt('vt3', true)
    render(<VectorTask id="vt3" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    const x = screen.getByRole('textbox', { name: 'v, координата x' })
    const z = screen.getByRole('textbox', { name: 'v, координата z' })
    expect(x).toHaveValue('2')
    expect(z).toHaveValue('3')
    expect(x).toBeDisabled()
    expect(z).toBeDisabled()
  })

  it('explains what is off after a wrong try', async () => {
    render(<VectorTask id="vt2" target={[2, 1, 3]} start={[1, 1, 1]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Проверить' }))
    expect(screen.getByText(/Пока \[1, 1, 1\]/)).toBeInTheDocument()
  })
})

describe('DotProduct3D without WebGL', () => {
  it('updates the readout when a coordinate changes', async () => {
    render(<DotProduct3D a={[1, 0, 0]} b={[0, 1, 0]} />)
    expect(screen.getByText('a·b = 1·0 + 0·1 + 0·0 = 0')).toBeInTheDocument()
    expect(screen.getByText(/перпендикулярны/)).toBeInTheDocument()
    await setField('b, координата x', '2')
    expect(screen.getByText('a·b = 1·2 + 0·1 + 0·0 = 2')).toBeInTheDocument()
    expect(screen.getByText(/смотрят в одну сторону/)).toBeInTheDocument()
  })
})
