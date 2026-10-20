import type { MDXComponents } from 'mdx/types'
import { CodeExercise } from '@/components/code/CodeExercise'
import { CourseMap } from '@/components/course/CourseMap'
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
import { DotProduct3D } from '@/components/viz/vectors/DotProduct3D'
import { VectorOps3D } from '@/components/viz/vectors/VectorOps3D'
import { VectorSpace3D } from '@/components/viz/vectors/VectorSpace3D'
import { VectorTask } from '@/components/viz/vectors/VectorTask'

const components: MDXComponents = {
  AttentionArcs,
  CodeExercise,
  CourseMap,
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
  VectorSpace3D,
  VectorTask,
  VectorOps3D,
  DotProduct3D,
}

export function useMDXComponents(): MDXComponents {
  return components
}
