import type {
  PlanSession,
  PlanWeek,
  TrainingBlock,
  TrainingPlan,
} from '../data/planTypes.ts'
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

const coreName = (session: PlanSession): string =>
  session.blocks.find((block) => block.kind === 'core')?.exercises[0]?.name ?? 'Core'

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
      className={`session-card card-${session.focus}${complete ? ' is-complete' : ''}${suggested ? ' is-suggested' : ''}`}
      href={routes.session(session.id)}
    >
      <p className="session-card-meta">
        <span className={`focus-pill focus-${session.focus}`}>{session.title}</span>
        <span className="session-day">{session.suggestedDay}</span>
      </p>
      <p className="session-card-lifts">{mainNames(session)}</p>
      <p className="session-card-foot">
        <span>
          {coreName(session)} · 20 min wrist
        </span>
        <span>
          {complete
            ? 'Done'
            : started
              ? `${counts.done}/${counts.total} sets`
              : suggested
                ? 'Up next'
                : 'Open'}
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
  const done = week.sessions.filter((session) => isSessionComplete(session, progress)).length

  return (
    <section className="week-row" aria-labelledby={`week-${week.week}`}>
      <header className="week-row-head">
        <div>
          <h3 id={`week-${week.week}`}>
            Week {week.week}
            <span className="week-title"> {week.title}</span>
          </h3>
          <p>{week.goal}</p>
        </div>
        <p className="week-count">
          {done}/{week.sessions.length} sessions
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

const BlockSection = ({
  block,
  progress,
  suggestedSessionId,
}: {
  block: TrainingBlock
  progress: PlanProgress
  suggestedSessionId: string
}) => {
  const done = block.sessions.filter((session) => isSessionComplete(session, progress)).length
  const firstWeek = block.weeks[0]?.week
  const lastWeek = block.weeks[block.weeks.length - 1]?.week

  return (
    <section className={`plan-block block-${block.focus}`} aria-labelledby={`block-${block.focus}`}>
      <header className="plan-block-head">
        <div>
          <p className="eyebrow">
            Weeks {firstWeek}–{lastWeek}
          </p>
          <h2 id={`block-${block.focus}`}>{block.title}</h2>
          <p>
            {block.focus === 'upper' ? 'Upper A' : 'Lower A'} and{' '}
            {block.focus === 'upper' ? 'Upper B' : 'Lower B'} each week. Builds over three
            weeks, hardest in week {lastWeek}.
          </p>
        </div>
        <p className="plan-block-count">
          <strong>
            {done}/{block.sessions.length}
          </strong>
          <span>sessions</span>
        </p>
      </header>
      {block.weeks.map((week) => (
        <WeekRow
          key={week.week}
          week={week}
          progress={progress}
          suggestedSessionId={suggestedSessionId}
        />
      ))}
    </section>
  )
}

export const PlanOverview = ({ plan, progress, suggestedSessionId }: PlanOverviewProps) => {
  const suggested = plan.sessions.find((session) => session.id === suggestedSessionId)
  const finished = plan.sessions.filter((session) => isSessionComplete(session, progress)).length
  const allDone = finished === plan.sessions.length

  return (
    <div className="page plan-page">
      <header className="hero">
        <p className="eyebrow">6-week plan</p>
        <h1>Plan</h1>
        <p className="lede">
          Two strength sessions a week: three weeks of upper body, then three weeks of
          lower body. Each day is three main lifts, one small core exercise, and about 20
          minutes of wrist rehab. Edit the JSON under <code>plan/</code>.
        </p>
      </header>

      <section className="summary plan-summary" aria-label="Plan summary">
        <div className="stat">
          <strong>
            {finished}/{plan.sessions.length}
          </strong>
          <span>Sessions done</span>
        </div>
        <div className="stat">
          <strong>2 / week</strong>
          <span>Weeks 1–3 upper · weeks 4–6 lower</span>
        </div>
        <div className="stat">
          <strong>~60 min</strong>
          <span>Including ~20 min wrist rehab</span>
        </div>
      </section>

      {suggested ? (
        <a className="continue-card" href={routes.session(suggested.id)}>
          <span className="eyebrow">{allDone ? 'Plan complete · review' : 'Continue'}</span>
          <strong>
            Week {suggested.week} · {suggested.title}
          </strong>
          <span>
            {suggested.block === 'upper' ? 'Upper' : 'Lower'} block, week {suggested.blockWeek}{' '}
            of 3 · {suggested.weekTitle}
          </span>
        </a>
      ) : null}

      {plan.blocks.map((block) => (
        <BlockSection
          key={block.focus}
          block={block}
          progress={progress}
          suggestedSessionId={suggestedSessionId}
        />
      ))}
    </div>
  )
}
