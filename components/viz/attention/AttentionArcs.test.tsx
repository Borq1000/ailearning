import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AttentionArcs, arcPath } from './AttentionArcs'

describe('arcPath', () => {
  it('builds a quadratic arc above the baseline', () => {
    expect(arcPath(100, 300, 150)).toBe('M 100 150 Q 200 54 300 150')
  })

  it('caps the arc height for distant words', () => {
    expect(arcPath(0, 1000, 150)).toBe('M 0 150 Q 500 30 1000 150')
  })
})

describe('AttentionArcs', () => {
  it('says where «он» looks and updates when the adjective changes', async () => {
    render(<AttentionArcs />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/«забор»/)
    await userEvent.click(screen.getByRole('radio', { name: 'уставшим' }))
    expect(screen.getByRole('img')).toHaveAccessibleName(/«кот»/)
  })

  it('draws one arc from «он» to every other word', () => {
    const { container } = render(<AttentionArcs />)
    expect(container.querySelectorAll('path')).toHaveLength(10)
  })
})
