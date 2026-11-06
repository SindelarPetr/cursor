import type { PlanBlock, PlanExercise, PlanSession, TrainingPlan } from '../data/planTypes.ts'
import { sessionNeighbors } from '../data/loadPlan.ts'
import { formatRest } from '../lib/format.ts'
import { routes } from '../lib/hashRoute.ts'

type GymModeProps = {
  plan: TrainingPlan
  session: PlanSession
}

const blockLabel = (kind: PlanBlock['kind']): string => {
  if (kind === 'wrist') {
    return 'Wrist rehab'
  }

  if (kind === 'core') {
    return 'Core'
  }

  return 'Main lifts'
}

const ExerciseCard = ({ block, exercise }: { block: PlanBlock; exercise: PlanExercise }) => (
  <article className={`gym-exercise kind-${block.kind}`}>
    <header>
      <h2>{exercise.name}</h2>
      <p className="gym-rx">
        {exercise.sets} × {exercise.reps}
        <span>Rest {formatRest(exercise.restSeconds)}</span>
      </p>
    </header>
    <p className="gym-load">{exercise.load}</p>
    <p className="gym-note">{exercise.notes}</p>
  </article>
)

export const GymMode = ({ plan, session }: GymModeProps) => {
  const { previous, next } = sessionNeighbors(plan, session.id)

  return (
    <div className="gym">
      <header className="gym-top">
        <a className="gym-back" href={routes.plan}>
          Plan
        </a>
        <p>
          Week {session.week} · {session.block === 'upper' ? 'Upper' : 'Lower'} block
        </p>
        <a className="gym-back" href={routes.log}>
          Log
        </a>
      </header>

      <div className="gym-heading">
        <p className={`focus-pill focus-${session.focus}`}>
          {session.focus} {session.variant}
        </p>
        <h1>{session.title}</h1>
        <p className="gym-sub">
          {session.weekTitle} · ~{session.durationMinutes} min
        </p>
        <p className="gym-session-note">{session.notes}</p>
      </div>

      {session.blocks.map((block) => (
        <section key={`${session.id}-${block.id}`} className={`gym-block kind-${block.kind}`}>
          <header className="gym-block-head">
            <h2>{blockLabel(block.kind)}</h2>
            {block.kind === 'wrist' ? <span>~{block.durationMinutes ?? 20} min</span> : null}
            {block.kind === 'core' ? <span>One exercise</span> : null}
          </header>
          {block.notes ? <p className="gym-block-note">{block.notes}</p> : null}
          {block.exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} block={block} exercise={exercise} />
          ))}
        </section>
      ))}

      <footer className="gym-nav">
        {previous ? (
          <a href={routes.session(previous.id)}>
            ← W{previous.week} {previous.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={routes.session(next.id)}>
            W{next.week} {next.title} →
          </a>
        ) : (
          <span />
        )}
      </footer>
    </div>
  )
}
