import type { ExerciseDef } from '@/lib/code/types'
import { dotExercise } from './dot'
import { matMulExercise } from './mat-mul'
import { matVecExercise } from './mat-vec'
import { softmaxExercise } from './softmax'

export const EXERCISES: Record<string, ExerciseDef> = {
  [dotExercise.id]: dotExercise,
  [matMulExercise.id]: matMulExercise,
  [matVecExercise.id]: matVecExercise,
  [softmaxExercise.id]: softmaxExercise,
}
