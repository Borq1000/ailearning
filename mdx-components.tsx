import type { MDXComponents } from 'mdx/types'
import { LessonStep } from '@/components/lesson/engine/LessonStep'

const components: MDXComponents = {
  LessonStep,
}

export function useMDXComponents(): MDXComponents {
  return components
}
