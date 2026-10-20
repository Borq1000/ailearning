import { afterEach, describe, expect, it, vi } from 'vitest'

// Результат проверки кэшируется в модуле, поэтому каждый тест берёт свежую копию модуля.
async function freshDetect() {
  vi.resetModules()
  return (await import('./webgl')).detectWebGL
}

const originalGetContext = HTMLCanvasElement.prototype.getContext

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
})

describe('detectWebGL', () => {
  it('probes once, caches the answer and releases the probe context', async () => {
    const loseContext = vi.fn()
    const getExtension = vi.fn((name: string) => (name === 'WEBGL_lose_context' ? { loseContext } : null))
    const getContext = vi.fn(() => ({ getExtension }))
    HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof HTMLCanvasElement.prototype.getContext

    const detectWebGL = await freshDetect()
    expect(detectWebGL()).toBe(true)
    expect(detectWebGL()).toBe(true)
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(loseContext).toHaveBeenCalledOnce()
  })

  it('reports no WebGL when the browser gives no context, and remembers that too', async () => {
    const getContext = vi.fn(() => null)
    HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof HTMLCanvasElement.prototype.getContext

    const detectWebGL = await freshDetect()
    expect(detectWebGL()).toBe(false)
    expect(detectWebGL()).toBe(false)
    // webgl2, затем webgl — и больше ни разу
    expect(getContext).toHaveBeenCalledTimes(2)
  })
})
