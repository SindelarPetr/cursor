import { Summary } from './components/Summary.tsx'
import { WorkoutCard } from './components/WorkoutCard.tsx'
import { loadWorkouts } from './data/loadWorkouts.ts'

const workouts = loadWorkouts()

const App = () => (
  <div className="page">
    <header className="hero">
      <p className="eyebrow">Training log</p>
      <h1>Workouts</h1>
      <p className="lede">
        A simple record of strength, running, and cycling sessions. Add a new
        JSON file under <code>workouts/</code> and it shows up here after the
        next build.
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

export default App
