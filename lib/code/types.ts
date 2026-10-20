export interface ExerciseTest {
  name: string
  args: unknown[]
  expected: unknown
  tolerance?: number
}

export type HelperName = 'dot' | 'matVec' | 'matMul' | 'transpose' | 'softmax'

export interface ExerciseDef {
  id: string
  title: string
  /** Имя функции, которую пишет ученик. */
  entry: string
  prompt: string
  starter: string
  tests: ExerciseTest[]
  hints: string[]
  solution: string
  /** Эталонные функции из lib/math, доступные в коде ученика. */
  helpers?: HelperName[]
}

export interface TestResult {
  name: string
  pass: boolean
  expectedText: string
  actualText?: string
  error?: string
}

export type ExecutionResult =
  | { status: 'ok'; results: TestResult[] }
  | { status: 'compile-error'; message: string }
  | { status: 'runtime-error'; message: string }
  | { status: 'timeout' }
