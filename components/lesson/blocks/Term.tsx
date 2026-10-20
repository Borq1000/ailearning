'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { attentionCourse } from '@/content/attention/course'
import { GLOSSARY } from '@/content/glossary'
import { findLessonById } from '@/lib/course/registry'
import type { FlatLesson } from '@/lib/course/types'
import { useProgress } from '@/lib/progress/store'
import { useLessonOptional } from '@/components/lesson/engine/LessonContext'

/** Строка под определением: где термин объясняется подробно. */
function LessonNote({ lesson, known, here }: { lesson: FlatLesson; known: boolean; here: boolean }) {
  const href = `/courses/attention/${lesson.slug}`
  const ready = lesson.availability === 'ready'
  if (known) {
    // Термин уже знаком — ссылка ведёт назад, чтобы освежить урок. На открытый сейчас урок ссылаться незачем.
    return ready && !here ? (
      <Link href={href} className="mt-2 block text-xs text-ink-cyan underline">
        Урок {lesson.id}: {lesson.title}
      </Link>
    ) : (
      <span className="mt-2 block text-xs text-muted">{`Урок ${lesson.id}: ${lesson.title}`}</span>
    )
  }
  if (!ready) return <span className="mt-2 block text-xs text-muted">{`Подробно — в уроке ${lesson.id} (скоро)`}</span>
  return (
    <Link href={href} className="mt-2 block text-xs text-ink-cyan underline">
      Подробно — в уроке {lesson.id}: {lesson.title}
    </Link>
  )
}

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

  const here = current?.lessonId === lesson?.id

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
          {lesson && <LessonNote lesson={lesson} known={studied || here} here={here} />}
        </span>
      )}
    </span>
  )
}
