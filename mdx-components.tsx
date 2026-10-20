import type { MDXComponents } from 'mdx/types'
import { Summary } from '@/components/lesson/blocks/Summary'
import { Check } from '@/components/lesson/gates/Check'
import { ExplainBack } from '@/components/lesson/gates/ExplainBack'
import { LessonStep } from '@/components/lesson/engine/LessonStep'
import { Predict } from '@/components/lesson/gates/Predict'
import { Recall } from '@/components/lesson/gates/Recall'

const components: MDXComponents = {
  LessonStep,
  Check,
  Predict,
  ExplainBack,
  Recall,
  Summary,
}

export function useMDXComponents(): MDXComponents {
  return components
}
