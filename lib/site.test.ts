import { afterEach, describe, expect, it, vi } from 'vitest'
import { SITE } from './site'

async function freshSite() {
  vi.resetModules()
  return (await import('./site')).SITE
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SITE', () => {
  it('has a Russian name and an absolute base URL', () => {
    expect(SITE.name).toBe('Учебник ИИ')
    expect(SITE.url).toMatch(/^https?:\/\//)
    expect(SITE.description.length).toBeGreaterThan(20)
  })

  it('takes the address from NEXT_PUBLIC_SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://ai.example.ru')
    expect((await freshSite()).url).toBe('https://ai.example.ru')
  })

  it('falls back to localhost when the variable is empty, not only when it is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect((await freshSite()).url).toBe('http://localhost:3000')
  })
})
