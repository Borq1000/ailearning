import type { ExerciseDef } from '@/lib/code/types'
import { dotExercise } from './dot'
import { matVecExercise } from './mat-vec'

export const EXERCISES: Record<string, ExerciseDef> = {
  [dotExercise.id]: dotExercise,
  [matVecExercise.id]: matVecExercise,
}
