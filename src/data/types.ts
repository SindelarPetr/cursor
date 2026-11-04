export type WorkoutType = 'strength' | 'run' | 'cycling' | 'other'

export type Exercise = {
  name: string
  sets?: number
  reps?: number
  weightKg?: number
  distanceKm?: number
  notes?: string
}

export type Workout = {
  date: string
  type: WorkoutType
  durationMinutes: number
  title: string
  notes?: string
  exercises: Exercise[]
}

export type WorkoutWithId = Workout & { id: string }

export const WORKOUT_TYPES: readonly WorkoutType[] = [
  'strength',
  'run',
  'cycling',
  'other',
]
