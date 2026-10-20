'use client'

import dynamic from 'next/dynamic'
import { createContext, useContext, useRef, useState } from 'react'
import { useGate } from '@/components/lesson/engine/useGate'
import { EXERCISES } from '@/content/attention/exercises'
import type { ExecutionResult, ExerciseDef } from '@/lib/code/types'
import { plural } from '@/lib/plural'
import { useProgress } from '@/lib/progress/store'
import { useRunner } from './useRunner'

/** Код упражнения для заглушки, пока загружается редактор. */
const SourceContext = createContext('')

/** Тот же код строка в строку и с той же высотой строки, что у CodeMirror, — страница не прыгает. */
function EditorPlaceholder() {
  const source = useContext(SourceContext)
  return (
    <div className="code-editor code-editor-placeholder" aria-busy="true">
      {source.split('\n').map((line, i) => (
        <div key={i}>{line || ' '}</div>
      ))}
    </div>
  )
}

// CodeMirror тяжёлый: грузим его отдельным чанком и только там, где есть упражнение с кодом.
const CodeEditor = dynamic(() => import('./CodeEditor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: EditorPlaceholder,
})

function RunReport({ result }: { result: ExecutionResult }) {
  if (result.status === 'timeout') {
    return (
      <p role="status" className="feedback-wrong">
        Похоже на бесконечный цикл: код работал дольше 2 секунд и был остановлен.
      </p>
    )
  }
  if (result.status === 'compile-error') {
    return (
      <p role="status" className="feedback-wrong">
        Ошибка в синтаксисе: {result.message}
      </p>
    )
  }
  if (result.status === 'runtime-error') {
    return (
      <p role="status" className="feedback-wrong">
        Ошибка при запуске: {result.message}
      </p>
    )
  }
  const passed = result.results.filter((t) => t.pass).length
  const total = result.results.length
  return (
    <div role="status" className="mt-4">
      <p className={`m-0 text-sm font-semibold ${passed === total ? 'text-success' : 'text-error'}`}>
        {passed} из {total} {plural(total, ['теста', 'тестов', 'тестов'])} пройдено
      </p>
      <ul className="mt-2 list-none space-y-1 p-0 font-mono text-[13px]">
        {result.results.map((t) => (
          <li key={t.name} className={t.pass ? 'text-success' : 'text-error'}>
            {t.pass ? '✓' : '✗'} {t.name}
            {!t.pass && (
              <span className="block pl-5 text-ink-soft">
                {t.error ? `ошибка: ${t.error}` : `ожидалось ${t.expectedText}, получено ${t.actualText}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CodeExerciseView({ exercise }: { exercise: ExerciseDef }) {
  const gate = useGate(`code:${exercise.id}`)
  const saved = useProgress((s) => s.code[exercise.id])
  const saveCode = useProgress((s) => s.saveCode)
  const run = useRunner()
  const source = saved ?? exercise.starter
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [running, setRunning] = useState(false)
  const [failedRuns, setFailedRuns] = useState(0)
  const [hints, setHints] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  // ref, а не state: два быстрых вызова (кнопка + Ctrl+Enter) приходят до перерисовки
  const busy = useRef(false)

  async function runTests() {
    if (busy.current) return
    busy.current = true
    setRunning(true)
    let next: ExecutionResult
    try {
      next = await run(source, exercise.id)
    } catch {
      next = { status: 'runtime-error', message: 'Не удалось запустить проверку кода.' }
    } finally {
      busy.current = false
      setRunning(false)
    }
    setResult(next)
    if (next.status === 'ok' && next.results.every((t) => t.pass)) gate.pass()
    else setFailedRuns((n) => n + 1)
  }

  return (
    <div className="gate-card" data-gate="code" data-exercise={exercise.id} data-passed={gate.passed}>
      <p className="gate-label m-0">Напиши код</p>
      <p className="gate-question">{exercise.title}</p>
      <p className="mt-1 mb-0 text-sm text-ink-soft">{exercise.prompt}</p>
      {exercise.helpers && exercise.helpers.length > 0 && (
        <p className="mt-1 mb-0 text-xs text-muted">Можно пользоваться: {exercise.helpers.join(', ')}</p>
      )}

      <div className="observatory mt-4 p-3">
        <SourceContext.Provider value={source}>
          <CodeEditor
            value={source}
            onChange={(code) => saveCode(exercise.id, code)}
            onRun={runTests}
            ariaLabel={`Код: ${exercise.title}`}
          />
        </SourceContext.Provider>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={runTests} disabled={running}>
          {running ? 'Проверяю…' : '▶ Запустить тесты'}
        </button>
        <span className="text-xs text-muted">Ctrl/⌘ + Enter</span>
        {hints < exercise.hints.length && (
          <button type="button" className="btn-ghost" onClick={() => setHints(hints + 1)}>
            Подсказка ({hints + 1}/{exercise.hints.length})
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={() => saveCode(exercise.id, exercise.starter)}>
          Сбросить код
        </button>
        {failedRuns >= 3 && !showSolution && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setShowSolution(true)
              if (!gate.passed) gate.reveal()
            }}
          >
            Показать решение
          </button>
        )}
      </div>

      {hints > 0 && (
        <ol className="mt-3 text-sm">
          {exercise.hints.slice(0, hints).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      )}

      {result && <RunReport result={result} />}

      {gate.passed && !gate.revealed && (
        <p role="status" className="feedback-right">
          ✓ Все тесты зелёные. Эта функция теперь твоя — она ещё пригодится.
        </p>
      )}

      {showSolution && (
        <div className="mt-4">
          <p className="gate-label">Решение</p>
          <pre className="observatory overflow-x-auto p-4 font-mono text-[13px]">{exercise.solution}</pre>
          <button type="button" className="btn-ghost mt-2" onClick={() => saveCode(exercise.id, exercise.solution)}>
            Вставить в редактор
          </button>
        </div>
      )}
    </div>
  )
}

export function CodeExercise({ id }: { id: string }) {
  const exercise = EXERCISES[id]
  if (!exercise) return <p className="feedback-wrong">Упражнение «{id}» не найдено.</p>
  return <CodeExerciseView exercise={exercise} />
}
