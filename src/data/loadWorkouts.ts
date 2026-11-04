import { WORKOUT_TYPES, type Workout, type WorkoutWithId } from './types.ts'

const modules = import.meta.glob('../../workouts/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isExercise = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.name !== 'string') {
    return false
  }

  const optionalNumbers = ['sets', 'reps', 'weightKg', 'distanceKm'] as const
  return optionalNumbers.every(
    (key) => value[key] === undefined || typeof value[key] === 'number',
  )
}

const isWorkout = (value: unknown): value is Workout => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.type === 'string' &&
    WORKOUT_TYPES.includes(value.type as Workout['type']) &&
    typeof value.durationMinutes === 'number' &&
    typeof value.title === 'string' &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isExercise) &&
    (value.notes === undefined || typeof value.notes === 'string')
  )
}

const fileId = (path: string): string =>
  path.split('/').pop()?.replace(/\.json$/, '') ?? path

export const loadWorkouts = (): WorkoutWithId[] => {
  const workouts = Object.entries(modules).map(([path, data]) => {
    if (!isWorkout(data)) {
      throw new Error(`Invalid workout file: ${path}`)
    }

    return { ...data, id: fileId(path) }
  })

  return workouts.sort((a, b) => {
    if (a.date === b.date) {
      return a.id.localeCompare(b.id)
    }

    return b.date.localeCompare(a.date)
  })
}
