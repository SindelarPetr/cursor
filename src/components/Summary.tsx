import type { WorkoutWithId } from '../data/types.ts'
import { formatDuration } from '../lib/format.ts'
import { isThisWeek } from '../lib/dates.ts'

type SummaryProps = {
  workouts: WorkoutWithId[]
}

const sumDuration = (workouts: WorkoutWithId[]): number =>
  workouts.reduce((total, workout) => total + workout.durationMinutes, 0)

export const Summary = ({ workouts }: SummaryProps) => {
  const thisWeek = workouts.filter((workout) => isThisWeek(workout.date))

  return (
    <section className="summary" aria-label="Workout summary">
      <div className="stat">
        <strong>{workouts.length}</strong>
        <span>Total workouts</span>
      </div>
      <div className="stat">
        <strong>{thisWeek.length}</strong>
        <span>This week</span>
      </div>
      <div className="stat">
        <strong>{formatDuration(sumDuration(workouts))}</strong>
        <span>Logged time</span>
      </div>
    </section>
  )
}
