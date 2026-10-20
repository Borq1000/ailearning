export type LessonKind = 'lesson' | 'practice'
export type Availability = 'ready' | 'soon'
export type Level = 'kid' | 'student' | 'advanced' | 'paper' | 'frontier'

export interface LessonMeta {
  id: string
  slug: string
  title: string
  minutes: number
  kind: LessonKind
  availability: Availability
}

export interface ModuleMeta {
  id: string
  number: number
  title: string
  description: string
  level: Level
  lessons: LessonMeta[]
}

export interface CourseMeta {
  id: string
  title: string
  subtitle: string
  modules: ModuleMeta[]
}

export interface FlatLesson extends LessonMeta {
  moduleId: string
  moduleNumber: number
  moduleTitle: string
}

/** То, что экспортирует каждый MDX-урок как `metadata`. */
export interface LessonMetadata {
  description: string
  objectives: string[]
}

/** Карточка интервального повторения. */
export interface Card {
  id: string
  prompt: string
  answer: string
  kind: 'flip' | 'choice'
  options?: string[]
  correct?: number
}

export const LEVEL_LABEL: Record<Level, string> = {
  kid: '🧒 с нуля',
  student: '🎓 основы',
  advanced: '🔬 глубже',
  paper: '📄 статья',
  frontier: '🚀 дальше',
}
