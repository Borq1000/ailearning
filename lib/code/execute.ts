import { transform } from 'sucrase'
import { dot, matMul, matVec, softmax, transpose } from '@/lib/math'
import { approxEqual } from './approx-equal'
import type { ExecutionResult, ExerciseDef, HelperName, TestResult } from './types'

const HELPERS: Record<HelperName, unknown> = { dot, matVec, matMul, transpose, softmax }

/** TypeScript → JavaScript. `export` убираем: код выполняется как тело функции, а не как модуль. */
export function compileSource(source: string): string {
  const withoutExports = source.replace(/^(\s*)export\s+(default\s+)?/gm, '$1')
  return transform(withoutExports, { transforms: ['typescript'] }).code
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** Короткое текстовое представление значения для отчёта «ожидалось / получено». */
export function formatValue(value: unknown, digits = 4): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value)
    if (Number.isInteger(value)) return String(value)
    const factor = 10 ** digits
    const rounded = Math.round(value * factor) / factor
    // маленькое ненулевое число не должно превращаться в «0»
    return rounded === 0 ? value.toExponential(2) : String(rounded)
  }
  if (Array.isArray(value)) return `[${value.map((v) => formatValue(v, digits)).join(', ')}]`
  if (typeof value === 'function') return '[функция]'
  if (value === undefined) return 'undefined'
  if (typeof value === 'symbol' || typeof value === 'bigint') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function executeExercise(source: string, exercise: ExerciseDef): ExecutionResult {
  let code: string
  try {
    code = compileSource(source)
  } catch (e) {
    return { status: 'compile-error', message: errorMessage(e) }
  }

  const names = exercise.helpers ?? []
  let fn: unknown
  try {
    const factory = new Function(
      'helpers',
      `"use strict";\nconst { ${names.join(', ')} } = helpers;\n${code}\nreturn typeof ${exercise.entry} === 'function' ? ${exercise.entry} : undefined;`,
    )
    fn = factory(Object.fromEntries(names.map((n) => [n, HELPERS[n]])))
  } catch (e) {
    return { status: 'runtime-error', message: errorMessage(e) }
  }
  if (typeof fn !== 'function') {
    return { status: 'runtime-error', message: `Не нашёл функцию ${exercise.entry}. Проверь, что она так и называется.` }
  }

  const results: TestResult[] = exercise.tests.map((test) => {
    let expectedText = formatValue(test.expected)
    try {
      // structuredClone: если код ученика испортит аргументы, следующие тесты этого не увидят
      const actual: unknown = (fn as (...args: unknown[]) => unknown)(...structuredClone(test.args))
      const pass = approxEqual(actual, test.expected, test.tolerance ?? 1e-6)
      let actualText = formatValue(actual)
      // «ожидалось 0.2689, получено 0.2689» ничего не объясняет: при провале с одинаковыми текстами показываем больше знаков
      if (!pass && actualText === expectedText) {
        expectedText = formatValue(test.expected, 8)
        actualText = formatValue(actual, 8)
      }
      return { name: test.name, pass, expectedText, actualText }
    } catch (e) {
      return { name: test.name, pass: false, expectedText, error: errorMessage(e) }
    }
  })
  return { status: 'ok', results }
}
