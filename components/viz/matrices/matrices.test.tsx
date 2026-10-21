import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CONCEPTS } from '@/lib/theme/concepts'
import { MatMulExplorer } from './MatMulExplorer'
import { COLUMN_COLORS, tipLabels } from './MatrixScene'
import { MatrixTransform3D } from './MatrixTransform3D'

async function setField(name: string, value: string) {
  const field = screen.getByRole('textbox', { name })
  await userEvent.clear(field)
  await userEvent.type(field, `${value}{Enter}`)
}

const readout = () => screen.getByText(/^M·v =/)

describe('MatrixTransform3D without WebGL', () => {
  it('shows M·v for the identity and recomputes after a preset', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    expect(readout()).toHaveTextContent('M·v = [1, 0.5, 1]')
    await userEvent.click(screen.getByRole('button', { name: 'растянуть X ×2' }))
    expect(readout()).toHaveTextContent('M·v = [2, 0.5, 1]')
    expect(screen.getByRole('button', { name: 'растянуть X ×2' })).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('Первая координата удваивается, остальные не меняются.')).toBeInTheDocument()
  })

  it('recomputes when a matrix entry is edited, accepting a comma and clamping to the bound', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('M, строка 1, столбец 1', '1,5')
    expect(readout()).toHaveTextContent('M·v = [1.5, 0.5, 1]')
    await setField('M, строка 2, столбец 2', '9')
    expect(screen.getByRole('textbox', { name: 'M, строка 2, столбец 2' })).toHaveValue('3')
    expect(readout()).toHaveTextContent('M·v = [1.5, 1.5, 1]')
    // матрица больше не совпадает ни с одним пресетом — ни одна кнопка не активна
    expect(screen.getByRole('button', { name: 'как было' })).toHaveAttribute('data-active', 'false')
  })

  it('ignores text that is not a number', async () => {
    render(<MatrixTransform3D vector={[1, 0.5, 1]} />)
    await screen.findByText(/3D-сцена недоступна/)
    await setField('M, строка 3, столбец 3', 'abc')
    expect(readout()).toHaveTextContent('M·v = [1, 0.5, 1]')
  })

  it('lists one dot product per row and lets the input vector be edited too', async () => {
    render(<MatrixTransform3D vector={[1, 2, 3]} />)
    await screen.findByText(/3D-сцена недоступна/)
    expect(screen.getByText(/строка 1:/)).toHaveTextContent('[1, 0, 0]·[1, 2, 3] = 1')
    await setField('v, координата z', '0')
    expect(readout()).toHaveTextContent('M·v = [1, 2, 0]')
  })
})

describe('MatrixTransform3D: M·v outside the grid', () => {
  it('suggests zooming out once a coordinate of M·v leaves the ±3 grid', async () => {
    render(<MatrixTransform3D vector={[2, 0, 0]} />)
    await screen.findByText(/3D-сцена недоступна/)
    const notice = /M·v вышла за край сетки/
    expect(screen.queryByText(notice)).toBeNull()
    await setField('M, строка 1, столбец 1', '3')
    expect(readout()).toHaveTextContent('M·v = [6, 0, 0]')
    expect(screen.getByText(notice)).toHaveTextContent(
      'M·v вышла за край сетки — покрути колёсико мыши, чтобы отдалить сцену.',
    )
    await setField('M, строка 1, столбец 1', '1,5')
    expect(screen.queryByText(notice)).toBeNull()
  })
})

describe('MatrixScene', () => {
  it('draws the column arrows X′, Y′, Z′ in colors that no concept uses', () => {
    const conceptColors = Object.values(CONCEPTS).flatMap((c) => [c.glow, c.ink])
    expect(COLUMN_COLORS).toEqual(['#f87171', '#fde047', '#f472b6'])
    for (const color of COLUMN_COLORS) expect(conceptColors).not.toContain(color)
  })

  it('labels v and M·v with one shared label when they coincide, so the labels do not overlap', () => {
    expect(tipLabels([1, 0.5, 1], [1, 0.5, 1])).toEqual([
      expect.objectContaining({ text: 'v = M·v', at: [1, 0.5, 1], color: CONCEPTS.result.glow }),
    ])
    expect(tipLabels([1, 0.5, 1], [2, 0.5, 1]).map((l) => l.text)).toEqual(['v', 'M·v'])
  })
})

describe('MatMulExplorer', () => {
  it('multiplies and explains a clicked cell as row · column', async () => {
    render(<MatMulExplorer a={[[1, 2], [3, 4]]} b={[[5, 6], [7, 8]]} />)
    expect(screen.getByRole('button', { name: 'строка 2, столбец 1: 43' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'строка 1, столбец 2: 22' }))
    expect(screen.getByRole('status')).toHaveTextContent('A[строка 1] · B[столбец 2] = 1·6 + 2·8 = 22')
    expect(screen.getByRole('button', { name: 'строка 1, столбец 2: 22' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('transposes the right matrix on request and labels rows and columns', () => {
    render(
      <MatMulExplorer
        a={[[1, 0, 1]]}
        b={[[1, 0, 1], [0, 1, 1]]}
        aLabel="Q"
        bLabel="K"
        transposeB
        rowLabels={['кот']}
        colLabels={['кот', 'забор']}
      />,
    )
    expect(screen.getByText('Q·Kᵀ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'строка 1, столбец 1: 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'строка 1, столбец 2: 1' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader', { name: 'забор' }).length).toBeGreaterThan(0)
  })
})
