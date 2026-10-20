import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useProgress } from './store'
import { useHydrated } from './useHydrated'

function Probe() {
  return <span>{useHydrated() ? 'ready' : 'waiting'}</span>
}

describe('useHydrated', () => {
  it('turns true once saved progress has been loaded', async () => {
    render(<Probe />)
    expect(screen.getByText('waiting')).toBeInTheDocument()
    await act(async () => {
      await useProgress.persist.rehydrate()
    })
    expect(screen.getByText('ready')).toBeInTheDocument()
  })
})
