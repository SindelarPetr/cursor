import type { WorkoutWithId } from '../data/types.ts'
import { formatWorkoutDate } from '../lib/dates.ts'
import { formatDuration, formatExerciseLine, typeLabel } from '../lib/format.ts'

type WorkoutCardProps = {
  workout: WorkoutWithId
}

export const WorkoutCard = ({ workout }: WorkoutCardProps) => (
  <article className="workout">
    <header className="workout-header">
      <p className="workout-meta">
        <time dateTime={workout.date}>{formatWorkoutDate(workout.date)}</time>
        <span className={`type type-${workout.type}`}>{typeLabel(workout.type)}</span>
      </p>
      <h2>{workout.title}</h2>
      <p className="workout-duration">{formatDuration(workout.durationMinutes)}</p>
    </header>

    <ul className="exercises">
      {workout.exercises.map((exercise) => {
        const detail = formatExerciseLine(exercise)

        return (
          <li key={`${workout.id}-${exercise.name}`}>
            <span className="exercise-name">{exercise.name}</span>
            {detail ? <span className="exercise-detail">{detail}</span> : null}
            {exercise.notes ? (
              <span className="exercise-notes">{exercise.notes}</span>
            ) : null}
          </li>
        )
      })}
    </ul>

    {workout.notes ? <p className="workout-notes">{workout.notes}</p> : null}
  </article>
)
