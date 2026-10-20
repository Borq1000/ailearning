'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ExecutionResult } from '@/lib/code/types'

export const RUN_TIMEOUT_MS = 2000

let nextRequestId = 1

/** Создаёт worker; возвращает null, если браузер не умеет module-worker'ы или создание запрещено (CSP и т. п.). */
function createWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  try {
    return new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
  } catch {
    return null
  }
}

/** Запускает код ученика в отдельном Web Worker. Зависший код останавливается по таймауту. */
export function useRunner(timeoutMs = RUN_TIMEOUT_MS): (source: string, exerciseId: string) => Promise<ExecutionResult> {
  const workerRef = useRef<Worker | null>(null)

  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>())

  // Прогреваем worker заранее: загрузка пакета не должна съедать время таймаута первого запуска.
  useEffect(() => {
    const timers = timersRef.current
    workerRef.current ??= createWorker()
    return () => {
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  return useCallback(
    (source: string, exerciseId: string) =>
      new Promise<ExecutionResult>((resolve) => {
        workerRef.current ??= createWorker()
        const worker = workerRef.current
        if (!worker) {
          resolve({ status: 'runtime-error', message: 'Не удалось запустить проверку кода в этом браузере.' })
          return
        }
        const requestId = nextRequestId++

        const finish = (result: ExecutionResult, killWorker: boolean) => {
          clearTimeout(timer)
          timersRef.current.delete(timer)
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          if (killWorker) {
            worker.terminate()
            workerRef.current = createWorker() // сразу готовим новый worker к следующему запуску
          }
          resolve(result)
        }
        const onMessage = (e: MessageEvent<{ requestId: number; result: ExecutionResult }>) => {
          if (e.data.requestId === requestId) finish(e.data.result, false)
        }
        const onError = (e: ErrorEvent) =>
          finish({ status: 'runtime-error', message: e.message || 'Не удалось запустить проверку кода' }, true)
        const timer = setTimeout(() => finish({ status: 'timeout' }, true), timeoutMs)

        timersRef.current.add(timer)
        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', onError)
        worker.postMessage({ requestId, exerciseId, source })
      }),
    [timeoutMs],
  )
}
