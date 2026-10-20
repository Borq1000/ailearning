import type { ComponentType } from 'react'
import type { Card, LessonMetadata } from './types'

export interface LessonModule {
  default: ComponentType
  metadata: LessonMetadata
  cards: Card[]
}

export async function loadLessonModule(courseId: string, slug: string): Promise<LessonModule> {
  const mod = (await import(`@/content/${courseId}/lessons/${slug}.mdx`)) as Partial<LessonModule>
  if (!mod.default || !mod.metadata) {
    throw new Error(`Lesson ${courseId}/${slug} must export default content and \`metadata\``)
  }
  return { default: mod.default, metadata: mod.metadata, cards: mod.cards ?? [] }
}
