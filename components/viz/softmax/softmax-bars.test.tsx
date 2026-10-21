import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SoftmaxBars } from './SoftmaxBars'

const readout = () => screen.getByText(/^softmax =/)

describe('SoftmaxBars', () => {
  it('turns scores into shares that sum to 1 and shows every stage', () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} labels={['забор', 'кот', 'через']} />)
    expect(readout()).toHaveTextContent('softmax = [0.66, 0.24, 0.1] · сумма = 1')
    expect(screen.getByText('66%')).toBeInTheDocument()
    expect(screen.getByText('7.39')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'оценка забор' })).toHaveValue('2')
  })

  it('does not change the shares when 10 is added to every score', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    await userEvent.click(screen.getByRole('button', { name: '+10 ко всем' }))
    expect(screen.getByRole('textbox', { name: 'оценка x1' })).toHaveValue('12')
    expect(readout()).toHaveTextContent('softmax = [0.66, 0.24, 0.1]')
  })

  it('stops adding 10 before the bound so the shares never change', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    const button = screen.getByRole('button', { name: '+10 ко всем' })
    for (let i = 0; i < 4; i++) await userEvent.click(button)
    expect(button).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'оценка x1' })).toHaveValue('42')
    expect(readout()).toHaveTextContent('softmax = [0.66, 0.24, 0.1]')
  })

  it('never shows a tiny positive number as a plain zero', () => {
    render(<SoftmaxBars initial={[5, 0, -10]} />)
    expect(screen.getByText('4.54e-5')).toBeInTheDocument()
    expect(screen.getByText('<1%')).toBeInTheDocument()
    // строка итога подписывает доли так же, как столбики: крошечная доля — «<0.01», а не «0»
    expect(readout()).toHaveTextContent('softmax = [0.99, 0.01, <0.01] · сумма = 1')
  })

  it('sharpens with a lower temperature and survives huge scores without NaN', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    fireEvent.change(screen.getByRole('slider', { name: 'Температура' }), { target: { value: '0.5' } })
    expect(readout()).toHaveTextContent('softmax = [0.86, 0.12, 0.02]')
    const field = screen.getByRole('textbox', { name: 'оценка x1' })
    await userEvent.clear(field)
    await userEvent.type(field, '1000{Enter}')
    expect(field).toHaveValue('50')
    expect(readout()).toHaveTextContent('softmax = [1, <0.01, <0.01]')
    expect(readout()).not.toHaveTextContent('NaN')
  })

  it('keeps the case of column titles: eˣ must not turn into Eˣ', () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    const title = screen.getByText('2 · eˣ')
    expect(title).not.toHaveClass('uppercase')
    expect(title).toHaveClass('tracking-wider', 'text-space-muted')
  })

  it('resets scores and temperature', async () => {
    render(<SoftmaxBars initial={[2, 1, 0.1]} />)
    await userEvent.click(screen.getByRole('button', { name: '+10 ко всем' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Температура' }), { target: { value: '3' } })
    await userEvent.click(screen.getByRole('button', { name: 'сбросить' }))
    expect(screen.getByRole('textbox', { name: 'оценка x1' })).toHaveValue('2')
    expect(screen.getByRole('slider', { name: 'Температура' })).toHaveValue('1')
  })
})
