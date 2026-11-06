import type {
  PlanSession,
  PlanWeek,
  TrainingBlock,
  TrainingPlan,
} from '../data/planTypes.ts'
import { routes } from '../lib/hashRoute.ts'

type PlanOverviewProps = {
  plan: TrainingPlan
  suggestedSessionId: string
  hasLastSession: boolean
}

const mainNames = (session: PlanSession): string =>
  session.blocks
    .filter((block) => block.kind === 'main')
    .flatMap((block) => block.exercises.map((exercise) => exercise.name))
    .join(' · ')

const coreName = (session: PlanSession): string =>
  session.blocks.find((block) => block.kind === 'core')?.exercises[0]?.name ?? 'Core'

const blockName = (session: PlanSession): string =>
  session.block === 'upper' ? 'Upper block' : 'Lower block'

const SessionCard = ({
  session,
  suggested,
}: {
  session: PlanSession
  suggested: boolean
}) => (
  <a
    className={`session-card card-${session.focus}${suggested ? ' is-suggested' : ''}`}
    href={routes.session(session.id)}
  >
    <p className="session-card-meta">
      <span className={`focus-pill focus-${session.focus}`}>{session.title}</span>
      <span className="session-day">{session.suggestedDay}</span>
    </p>
    <p className="session-card-lifts">{mainNames(session)}</p>
    <p className="session-card-foot">
      <span>{coreName(session)} · 20 min wrist</span>
    </p>
  </a>
)

const WeekRow = ({
  week,
  suggestedSessionId,
}: {
  week: PlanWeek
  suggestedSessionId: string
}) => (
  <section className="week-row" aria-labelledby={`week-${week.week}`}>
    <header className="week-row-head">
      <h3 id={`week-${week.week}`}>
        Week {week.week}
        <span className="week-title"> {week.title}</span>
      </h3>
      <p>{week.goal}</p>
    </header>
    <div className="session-grid">
      {week.sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          suggested={session.id === suggestedSessionId}
        />
      ))}
    </div>
  </section>
)

const BlockSection = ({
  block,
  suggestedSessionId,
}: {
  block: TrainingBlock
  suggestedSessionId: string
}) => {
  const firstWeek = block.weeks[0]?.week
  const lastWeek = block.weeks[block.weeks.length - 1]?.week
  const [variantA, variantB] = block.focus === 'upper' ? ['Upper A', 'Upper B'] : ['Lower A', 'Lower B']

  return (
    <section className={`plan-block block-${block.focus}`} aria-labelledby={`block-${block.focus}`}>
      <header className="plan-block-head">
        <p className="eyebrow">
          Weeks {firstWeek}–{lastWeek}
        </p>
        <h2 id={`block-${block.focus}`}>{block.title}</h2>
        <p>
          {variantA} and {variantB} each week. Builds over three weeks, hardest in week{' '}
          {lastWeek}.
        </p>
      </header>
      {block.weeks.map((week) => (
        <WeekRow key={week.week} week={week} suggestedSessionId={suggestedSessionId} />
      ))}
    </section>
  )
}

export const PlanOverview = ({ plan, suggestedSessionId, hasLastSession }: PlanOverviewProps) => {
  const suggested = plan.sessions.find((session) => session.id === suggestedSessionId)

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

      <section className="summary plan-summary" aria-label="Plan at a glance">
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
          <span className="eyebrow">{hasLastSession ? 'Continue' : 'Start here'}</span>
          <strong>
            Week {suggested.week} · {suggested.title}
          </strong>
          <span>
            {blockName(suggested)} · {suggested.weekTitle}
          </span>
        </a>
      ) : null}

      {plan.blocks.map((block) => (
        <BlockSection key={block.focus} block={block} suggestedSessionId={suggestedSessionId} />
      ))}
    </div>
  )
}
