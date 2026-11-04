import type { Exercise, WorkoutType } from '../data/types.ts'

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining === 0 ? `${hours}h` : `${hours}h ${remaining}m`
}

export const formatExerciseLine = (exercise: Exercise): string => {
  const parts: string[] = []

  if (exercise.sets !== undefined && exercise.reps !== undefined) {
    parts.push(`${exercise.sets}×${exercise.reps}`)
  } else if (exercise.sets !== undefined) {
    parts.push(`${exercise.sets} sets`)
  } else if (exercise.reps !== undefined) {
    parts.push(`${exercise.reps} reps`)
  }

  if (exercise.weightKg !== undefined) {
    parts.push(`${exercise.weightKg} kg`)
  }

  if (exercise.distanceKm !== undefined) {
    parts.push(`${exercise.distanceKm} km`)
  }

  return parts.join(' · ')
}

export const typeLabel = (type: WorkoutType): string => {
  if (type === 'run') {
    return 'Run'
  }

  return type.charAt(0).toUpperCase() + type.slice(1)
}
