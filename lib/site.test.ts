import { describe, expect, it } from 'vitest'
import { SITE } from './site'

describe('SITE', () => {
  it('has a Russian name and an absolute base URL', () => {
    expect(SITE.name).toBe('Учебник ИИ')
    expect(SITE.url).toMatch(/^https?:\/\//)
    expect(SITE.description.length).toBeGreaterThan(20)
  })
})
