import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markNewerVersion } from '@/lib/progress/version-guard'
import { VersionBanner } from './VersionBanner'

describe('VersionBanner', () => {
  it('renders nothing while no newer version of the site has been seen', () => {
    const { container } = render(<VersionBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('asks to reload the page once another tab has saved a newer version', () => {
    render(<VersionBanner />)
    act(() => markNewerVersion())
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Сайт обновился в другой вкладке. Обнови эту страницу, чтобы прогресс сохранялся.',
    )
  })
})
