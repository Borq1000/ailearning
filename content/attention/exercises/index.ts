import type { ExerciseDef } from '@/lib/code/types'
import { dotExercise } from './dot'

export const EXERCISES: Record<string, ExerciseDef> = {
  [dotExercise.id]: dotExercise,
}
