import { loadWorkouts } from '../data/loadWorkouts.ts'
import { Summary } from './Summary.tsx'
import { WorkoutCard } from './WorkoutCard.tsx'

const workouts = loadWorkouts()

export const LogView = () => (
  <div className="page">
    <header className="hero">
      <p className="eyebrow">Training log</p>
      <h1>Workouts</h1>
      <p className="lede">
        Finished sessions stored as JSON under <code>workouts/</code>. The
        six-week plan lives under <code>plan/</code> and is on the Plan tab.
      </p>
    </header>

    <Summary workouts={workouts} />

    <section className="list" aria-label="Workout list">
      {workouts.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </section>
  </div>
)
