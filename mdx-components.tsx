import type { MDXComponents } from 'mdx/types'
import { Check } from '@/components/lesson/gates/Check'
import { ExplainBack } from '@/components/lesson/gates/ExplainBack'
import { LessonStep } from '@/components/lesson/engine/LessonStep'
import { Predict } from '@/components/lesson/gates/Predict'

const components: MDXComponents = {
  LessonStep,
  Check,
  Predict,
  ExplainBack,
}

export function useMDXComponents(): MDXComponents {
  return components
}
