import type { PlanSession, PlanWeek, TrainingPlan } from '../data/planTypes.ts'
import { routes } from '../lib/hashRoute.ts'
import {
  completedSetCount,
  isSessionComplete,
  type PlanProgress,
} from '../lib/planProgress.ts'

type PlanOverviewProps = {
  plan: TrainingPlan
  progress: PlanProgress
  suggestedSessionId: string
}

const mainNames = (session: PlanSession): string =>
  session.blocks
    .filter((block) => block.kind === 'main')
    .flatMap((block) => block.exercises.map((exercise) => exercise.name))
    .join(' · ')

const SessionCard = ({
  session,
  progress,
  suggested,
}: {
  session: PlanSession
  progress: PlanProgress
  suggested: boolean
}) => {
  const complete = isSessionComplete(session, progress)
  const counts = completedSetCount(session, progress)
  const started = counts.done > 0

  return (
    <a
      className={`session-card focus-${session.focus}${complete ? ' is-complete' : ''}${suggested ? ' is-suggested' : ''}`}
      href={routes.session(session.id)}
    >
      <p className="session-card-meta">
        <span className={`focus-pill focus-${session.focus}`}>
          {session.title}
        </span>
        <span className="session-day">{session.suggestedDay}</span>
      </p>
      <p className="session-card-lifts">{mainNames(session)}</p>
      <p className="session-card-foot">
        <span>Core + 20 min wrist</span>
        <span>
          {complete
            ? 'Done'
            : started
              ? `${counts.done}/${counts.total} sets`
              : 'Open gym mode'}
        </span>
      </p>
    </a>
  )
}

const WeekRow = ({
  week,
  progress,
  suggestedSessionId,
}: {
  week: PlanWeek
  progress: PlanProgress
  suggestedSessionId: string
}) => {
  const done = week.sessions.filter((session) =>
    isSessionComplete(session, progress),
  ).length

  return (
    <section className="week-row" aria-labelledby={`week-${week.week}`}>
      <header className="week-row-head">
        <div>
          <h2 id={`week-${week.week}`}>
            Week {week.week}
            <span className="week-title"> {week.title}</span>
          </h2>
          <p>{week.goal}</p>
        </div>
        <p className="week-count">
          {done}/4 sessions
        </p>
      </header>
      <div className="session-grid">
        {week.sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            progress={progress}
            suggested={session.id === suggestedSessionId}
          />
        ))}
      </div>
    </section>
  )
}

export const PlanOverview = ({
  plan,
  progress,
  suggestedSessionId,
}: PlanOverviewProps) => {
  const suggested = plan.sessions.find((session) => session.id === suggestedSessionId)
  const finished = plan.sessions.filter((session) =>
    isSessionComplete(session, progress),
  ).length

  return (
    <div className="page plan-page">
      <header className="hero">
        <p className="eyebrow">6-week block</p>
        <h1>Plan</h1>
        <p className="lede">
          Four sessions a week, upper or lower only. Each day is three main
          lifts, one small core, and about 20 minutes of wrist rehab. Edit the
          JSON under <code>plan/</code>.
        </p>
      </header>

      <section className="summary plan-summary" aria-label="Plan summary">
        <div className="stat">
          <strong>{finished}/24</strong>
          <span>Sessions done</span>
        </div>
        <div className="stat">
          <strong>4 / week</strong>
          <span>Upper A · Lower A · Upper B · Lower B</span>
        </div>
        <div className="stat">
          <strong>~60 min</strong>
          <span>Including the wrist block</span>
        </div>
      </section>

      {suggested ? (
        <a className="continue-card" href={routes.session(suggested.id)}>
          <span className="eyebrow">Continue</span>
          <strong>
            Week {suggested.week} · {suggested.title}
          </strong>
          <span>
            {suggested.suggestedDay} · {suggested.weekTitle}
          </span>
        </a>
      ) : null}

      {plan.weeks.map((week) => (
        <WeekRow
          key={week.week}
          week={week}
          progress={progress}
          suggestedSessionId={suggestedSessionId}
        />
      ))}
    </div>
  )
}
