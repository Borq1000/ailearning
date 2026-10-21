'use client'

import { useEffect, useState } from 'react'
import { downloadText } from '@/lib/download'
import { todayISO } from '@/lib/progress/scheduler'
import { readBackup } from '@/lib/progress/storage'
import { useProgress } from '@/lib/progress/store'

/** Резервная копия появляется, когда прогресс не удалось прочитать. Отсюда её можно вернуть или скачать. */
export function BackupPanel() {
  const restoreBackup = useProgress((s) => s.restoreBackup)
  const [backup, setBackup] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage читается только на клиенте после монтирования
    setBackup(readBackup())
  }, [])

  if (backup === null) return null

  return (
    <section aria-labelledby="backup-title" className="mt-10 rounded-xl border border-dashed border-line p-5">
      <p id="backup-title" className="gate-label">
        Резервная копия
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Когда-то прогресс не удалось прочитать, и он был сохранён отдельно. Можно попробовать вернуть его или скачать файл.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() =>
            setMessage(
              restoreBackup()
                ? 'Резервная копия восстановлена. Обнови страницу, чтобы увидеть изменения.'
                : 'Не получилось: копия повреждена. Скачай её — возможно, часть данных удастся достать вручную.',
            )
          }
        >
          Восстановить
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => downloadText(`ailearning-backup-${todayISO()}.json`, backup, 'application/octet-stream')}
        >
          Скачать копию
        </button>
      </div>
      <p role="status" className="mt-3 text-sm text-ink-soft">
        {message}
      </p>
    </section>
  )
}
