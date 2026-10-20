'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { attentionCourse } from '@/content/attention/course'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById } from '@/lib/course/registry'
import { useProgress } from '@/lib/progress/store'
import { useLessonOptional } from '@/components/lesson/engine/LessonContext'

export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const popoverId = useId()
  const current = useLessonOptional()
  const lesson = entry ? findLessonById(attentionCourse, entry.lessonId) : undefined
  const studied = useProgress((s) => (lesson ? s.lessons[lesson.id]?.status === 'completed' : false))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  if (!entry) return <>{children}</>

  const known = studied || current?.lessonId === lesson?.id

  return (
    <span ref={rootRef} className="relative">
      <button
        type="button"
        className="term"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <span id={popoverId} role="dialog" aria-label={entry.term} className="term-popover">
          <span className="block font-serif text-base font-semibold">{entry.term}</span>
          <span className="mt-1 block text-sm">{entry.short}</span>
          {lesson &&
            (known || lesson.availability !== 'ready' ? (
              <span className="mt-2 block text-xs text-muted">
                {known ? `Урок ${lesson.id}: ${lesson.title}` : `Подробно — в уроке ${lesson.id} (скоро)`}
              </span>
            ) : (
              <Link href={`/courses/attention/${lesson.slug}`} className="mt-2 block text-xs text-ink-cyan underline">
                Подробно — в уроке {lesson.id}: {lesson.title}
              </Link>
            ))}
        </span>
      )}
    </span>
  )
}
