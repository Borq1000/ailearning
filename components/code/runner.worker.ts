import { EXERCISES } from '@/content/attention/exercises'
import { executeExercise } from '@/lib/code/execute'
import type { ExecutionResult } from '@/lib/code/types'

interface RunRequest {
  requestId: number
  exerciseId: string
  source: string
}

// Типы lib "webworker" конфликтуют с "dom" в общем tsconfig, поэтому описываем нужное вручную.
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null
  postMessage: (message: { requestId: number; result: ExecutionResult }) => void
}

ctx.onmessage = (event) => {
  const { requestId, exerciseId, source } = event.data
  const exercise = EXERCISES[exerciseId]
  const result: ExecutionResult = exercise
    ? executeExercise(source, exercise)
    : { status: 'runtime-error', message: `Неизвестное упражнение: ${exerciseId}` }
  ctx.postMessage({ requestId, result })
}
