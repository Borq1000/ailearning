'use client'

import type { CSSProperties } from 'react'
import { downloadText } from '@/lib/download'
import { todayISO } from '@/lib/progress/scheduler'
import { readRawProgress, resetStoredProgress } from '@/lib/progress/storage'

// global-error заменяет корневой layout целиком. Стили — свои и встроенные: импорт globals.css отсюда
// выделил бы его в отдельный CSS-файл, который загружала бы каждая страница сайта.
const styles = {
  body: {
    margin: 0,
    minHeight: '100dvh',
    background: '#f6f3ec',
    color: '#22201c',
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.6,
  },
  main: { maxWidth: 680, margin: '0 auto', padding: '6rem 1rem' },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6f6758' },
  title: { margin: '0.5rem 0 0', fontFamily: 'Georgia, serif', fontSize: '2.25rem', fontWeight: 400 },
  text: { marginTop: '0.75rem', color: '#4a453c' },
  actions: { marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  primary: {
    border: 0,
    borderRadius: 8,
    padding: '0.5rem 1rem',
    background: '#22201c',
    color: '#f6f3ec',
    font: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },
  ghost: {
    border: '1px solid #e2dccf',
    borderRadius: 8,
    padding: '0.5rem 1rem',
    background: 'transparent',
    color: '#22201c',
    font: 'inherit',
    cursor: 'pointer',
  },
} satisfies Record<string, CSSProperties>

export default function GlobalError({ reset }: { error: unknown; reset: () => void }) {
  function downloadSaved() {
    downloadText(`ailearning-saved-data-${todayISO()}.json`, readRawProgress() ?? '{}')
  }

  function resetAndReload() {
    resetStoredProgress()
    window.location.reload()
  }

  return (
    <html lang="ru">
      <body style={styles.body}>
        <title>Что-то пошло не так · Учебник ИИ</title>
        <main style={styles.main}>
          <p style={styles.label}>Ошибка</p>
          <h1 style={styles.title}>Что-то пошло не так</h1>
          <p style={styles.text}>
            Страница не смогла открыться. Попробуй ещё раз. Если ошибка повторяется, возможно, повреждён сохранённый
            прогресс: сначала скачай его на всякий случай, потом сбрось — копия останется и в браузере.
          </p>
          <div style={styles.actions}>
            <button type="button" style={styles.primary} onClick={() => reset()}>
              Попробовать снова
            </button>
            <button type="button" style={styles.ghost} onClick={downloadSaved}>
              Скачать сохранённые данные
            </button>
            <button type="button" style={styles.ghost} onClick={resetAndReload}>
              Сбросить прогресс и перезагрузить
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
