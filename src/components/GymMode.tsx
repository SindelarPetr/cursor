import { useEffect, useMemo, useState } from 'react'
import type { PlanBlock, PlanExercise, PlanSession, TrainingPlan } from '../data/planTypes.ts'
import { sessionNeighbors } from '../data/loadPlan.ts'
import { formatClock, formatRest } from '../lib/format.ts'
import { routes } from '../lib/hashRoute.ts'
import {
  completedSetCount,
  isSessionComplete,
  padChecks,
  type PlanProgress,
} from '../lib/planProgress.ts'

type GymModeProps = {
  plan: TrainingPlan
  session: PlanSession
  progress: PlanProgress
  onOpenSession: (sessionId: string) => void
  onToggleSet: (sessionId: string, exercise: PlanExercise, setIndex: number) => void
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

const SetRow = ({
  exercise,
  checks,
  onToggle,
}: {
  exercise: PlanExercise
  checks: boolean[]
  onToggle: (setIndex: number) => void
}) => (
  <div className="set-row" role="group" aria-label={`${exercise.name} sets`}>
    {checks.map((done, index) => (
      <button
        key={`${exercise.id}-${index}`}
        type="button"
        className={done ? 'set-btn is-done' : 'set-btn'}
        aria-pressed={done}
        onClick={() => onToggle(index)}
      >
        {index + 1}
      </button>
    ))}
  </div>
)

const ExerciseCard = ({
  block,
  exercise,
  checks,
  onToggle,
}: {
  block: PlanBlock
  exercise: PlanExercise
  checks: boolean[]
  onToggle: (setIndex: number) => void
}) => (
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
    <SetRow exercise={exercise} checks={checks} onToggle={onToggle} />
  </article>
)

export const GymMode = ({
  plan,
  session,
  progress,
  onOpenSession,
  onToggleSet,
}: GymModeProps) => {
  const { previous, next, index } = sessionNeighbors(plan, session.id)
  const counts = completedSetCount(session, progress)
  const complete = isSessionComplete(session, progress)
  const [rest, setRest] = useState<{ endsAt: number; seconds: number } | null>(null)
  const restEndsAt = rest?.endsAt

  const checksFor = useMemo(
    () => (exercise: PlanExercise) =>
      padChecks(progress.checks[session.id]?.[exercise.id], exercise.sets),
    [progress.checks, session.id],
  )

  useEffect(() => {
    if (!restEndsAt) {
      return
    }

    const id = window.setInterval(() => {
      const remaining = Math.ceil((restEndsAt - Date.now()) / 1000)
      if (remaining <= 0) {
        setRest(null)
        return
      }

      setRest((current) =>
        current && current.endsAt === restEndsAt
          ? { ...current, seconds: remaining }
          : current,
      )
    }, 250)

    return () => window.clearInterval(id)
  }, [restEndsAt])

  const handleToggle = (block: PlanBlock, exercise: PlanExercise, setIndex: number) => {
    const checks = checksFor(exercise)
    const turningOn = !checks[setIndex]
    onToggleSet(session.id, exercise, setIndex)

    if (turningOn && setIndex < exercise.sets - 1) {
      setRest({
        endsAt: Date.now() + exercise.restSeconds * 1000,
        seconds: exercise.restSeconds,
      })
      return
    }

    if (turningOn && block.kind !== 'wrist' && setIndex === exercise.sets - 1) {
      setRest(null)
    }
  }

  return (
    <div className={rest ? 'gym is-resting' : 'gym'}>
      <header className="gym-top">
        <a className="gym-back" href={routes.plan}>
          Plan
        </a>
        <p>
          Week {session.week} · {session.block === 'upper' ? 'Upper' : 'Lower'} block{' '}
          {session.blockWeek}/3
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
          {session.weekTitle} · ~{session.durationMinutes} min · {counts.done}/
          {counts.total} sets
        </p>
        <p className="gym-session-note">{session.notes}</p>
        {complete ? <p className="gym-done">Session complete</p> : null}
      </div>

      {session.blocks.map((block) => (
        <section
          key={`${session.id}-${block.id}`}
          className={`gym-block kind-${block.kind}`}
        >
          <header className="gym-block-head">
            <h2>{blockLabel(block.kind)}</h2>
            {block.kind === 'wrist' ? <span>~{block.durationMinutes ?? 20} min</span> : null}
            {block.kind === 'core' ? <span>One exercise</span> : null}
          </header>
          {block.notes ? <p className="gym-block-note">{block.notes}</p> : null}
          {block.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              block={block}
              exercise={exercise}
              checks={checksFor(exercise)}
              onToggle={(setIndex) => handleToggle(block, exercise, setIndex)}
            />
          ))}
        </section>
      ))}

      <footer className="gym-nav">
        {previous ? (
          <a href={routes.session(previous.id)} onClick={() => onOpenSession(previous.id)}>
            ← W{previous.week} {previous.title}
          </a>
        ) : (
          <span />
        )}
        <span>
          {index + 1} / {plan.sessions.length}
        </span>
        {next ? (
          <a href={routes.session(next.id)} onClick={() => onOpenSession(next.id)}>
            W{next.week} {next.title} →
          </a>
        ) : (
          <span />
        )}
      </footer>

      {rest ? (
        <div className="rest-toast" role="status">
          <div>
            <p className="eyebrow">Rest</p>
            <strong>{formatClock(rest.seconds)}</strong>
          </div>
          <button type="button" className="rest-skip" onClick={() => setRest(null)}>
            Skip
          </button>
        </div>
      ) : null}
    </div>
  )
}
