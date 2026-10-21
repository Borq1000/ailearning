import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRunner } from './useRunner'

type Listener = (e: { data?: unknown; message?: string }) => void

/** Поддельный Worker: запоминает сообщения и позволяет тесту ответить или «упасть». */
class FakeWorker {
  static instances: FakeWorker[] = []
  listeners: Record<string, Listener[]> = { message: [], error: [] }
  posted: { requestId: number; exerciseId: string; source: string }[] = []
  terminated = false
  constructor() {
    FakeWorker.instances.push(this)
  }
  addEventListener(type: string, fn: Listener) {
    this.listeners[type].push(fn)
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn)
  }
  postMessage(msg: { requestId: number; exerciseId: string; source: string }) {
    this.posted.push(msg)
  }
  terminate() {
    this.terminated = true
  }
  reply(requestId: number, result: unknown) {
    for (const l of [...this.listeners.message]) l({ data: { requestId, result } })
  }
  fail(message: string) {
    for (const l of [...this.listeners.error]) l({ message })
  }
}

beforeEach(() => {
  FakeWorker.instances = []
  vi.stubGlobal('Worker', FakeWorker)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useRunner', () => {
  it('resolves with the result that carries its own requestId and ignores others', async () => {
    const { result } = renderHook(() => useRunner())
    const promise = result.current('code', 'dot')
    const worker = FakeWorker.instances[0]
    const { requestId } = worker.posted[0]
    worker.reply(requestId + 1000, { status: 'timeout' })
    worker.reply(requestId, { status: 'ok', results: [] })
    await expect(promise).resolves.toEqual({ status: 'ok', results: [] })
    expect(worker.terminated).toBe(false)
  })

  it('stops a hung worker on timeout and prepares a fresh one', async () => {
    const { result } = renderHook(() => useRunner(2000))
    const promise = result.current('while (true) {}', 'dot')
    vi.advanceTimersByTime(2000)
    await expect(promise).resolves.toEqual({ status: 'timeout' })
    expect(FakeWorker.instances[0].terminated).toBe(true)
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('turns a worker error into a runtime error and replaces the worker', async () => {
    const { result } = renderHook(() => useRunner())
    const promise = result.current('x', 'dot')
    FakeWorker.instances[0].fail('boom')
    await expect(promise).resolves.toEqual({ status: 'runtime-error', message: 'boom' })
    expect(FakeWorker.instances).toHaveLength(2)
  })

  it('terminates the worker and clears pending timers on unmount', () => {
    const { result, unmount } = renderHook(() => useRunner())
    void result.current('x', 'dot')
    unmount()
    expect(FakeWorker.instances[0].terminated).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
