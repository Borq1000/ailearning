import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InfoCard } from './InfoCard'
import { Stage } from '@/components/viz/stage/Stage'

describe('Stage', () => {
  it('shows the fallback and keeps DOM controls when WebGL is unavailable', async () => {
    render(
      <Stage caption="Подпись" fallback={<p>Без 3D</p>} controls={<button type="button">Поле</button>}>
        <group />
      </Stage>,
    )
    expect(await screen.findByText('Без 3D')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Поле' })).toBeInTheDocument()
    expect(screen.getByText('Подпись')).toBeInTheDocument()
    expect(screen.queryByText(/чтобы вращать/)).toBeNull()
  })
})

describe('InfoCard', () => {
  it('shows the title and body and can be closed', async () => {
    const onClose = vi.fn()
    render(<InfoCard info={{ title: 'Вектор', body: 'v = [1, 2, 3]' }} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Вектор' })).toHaveTextContent('v = [1, 2, 3]')
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
