import type { MDXComponents } from 'mdx/types'
import { AttentionArcs } from '@/components/viz/attention/AttentionArcs'
import { C } from '@/components/lesson/blocks/C'
import { Faded } from '@/components/lesson/gates/Faded'
import { Hook } from '@/components/lesson/blocks/Hook'
import { Level, Levels } from '@/components/lesson/blocks/Levels'
import { Sidenote } from '@/components/lesson/blocks/Sidenote'
import { Summary } from '@/components/lesson/blocks/Summary'
import { Term } from '@/components/lesson/blocks/Term'
import { WorkedExample } from '@/components/lesson/blocks/WorkedExample'
import { Check } from '@/components/lesson/gates/Check'
import { ExplainBack } from '@/components/lesson/gates/ExplainBack'
import { LessonStep } from '@/components/lesson/engine/LessonStep'
import { Predict } from '@/components/lesson/gates/Predict'
import { Recall } from '@/components/lesson/gates/Recall'

const components: MDXComponents = {
  AttentionArcs,
  LessonStep,
  Check,
  Predict,
  ExplainBack,
  Recall,
  Summary,
  Hook,
  WorkedExample,
  Faded,
  Levels,
  Level,
  Term,
  Sidenote,
  C,
}

export function useMDXComponents(): MDXComponents {
  return components
}
