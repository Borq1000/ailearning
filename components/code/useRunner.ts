'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { ExecutionResult } from '@/lib/code/types'

export const RUN_TIMEOUT_MS = 2000

let nextRequestId = 1

/** Запускает код ученика в отдельном Web Worker. Зависший код останавливается по таймауту. */
export function useRunner(timeoutMs = RUN_TIMEOUT_MS): (source: string, exerciseId: string) => Promise<ExecutionResult> {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  return useCallback(
    (source: string, exerciseId: string) =>
      new Promise<ExecutionResult>((resolve) => {
        workerRef.current ??= new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' })
        const worker = workerRef.current
        const requestId = nextRequestId++

        const finish = (result: ExecutionResult, killWorker: boolean) => {
          clearTimeout(timer)
          worker.removeEventListener('message', onMessage)
          worker.removeEventListener('error', onError)
          if (killWorker) {
            worker.terminate()
            workerRef.current = null
          }
          resolve(result)
        }
        const onMessage = (e: MessageEvent<{ requestId: number; result: ExecutionResult }>) => {
          if (e.data.requestId === requestId) finish(e.data.result, false)
        }
        const onError = (e: ErrorEvent) =>
          finish({ status: 'runtime-error', message: e.message || 'Не удалось запустить проверку кода' }, true)
        const timer = setTimeout(() => finish({ status: 'timeout' }, true), timeoutMs)

        worker.addEventListener('message', onMessage)
        worker.addEventListener('error', onError)
        worker.postMessage({ requestId, exerciseId, source })
      }),
    [timeoutMs],
  )
}
