import {
  BLOCK_KINDS,
  BLOCK_ORDER,
  PLAN_WEEKS,
  SESSION_FOCUSES,
  SESSION_VARIANTS,
  SESSIONS_PER_WEEK,
  WEEKS_PER_BLOCK,
  type PlanBlock,
  type PlanExercise,
  type PlanSession,
  type PlanWeek,
  type SessionFocus,
  type TrainingBlock,
  type TrainingPlan,
} from './planTypes.ts'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFocus = (value: unknown): value is SessionFocus =>
  typeof value === 'string' && SESSION_FOCUSES.includes(value as SessionFocus)

const isPlanExercise = (value: unknown): value is PlanExercise => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.sets === 'number' &&
    value.sets > 0 &&
    typeof value.reps === 'string' &&
    typeof value.restSeconds === 'number' &&
    typeof value.load === 'string' &&
    typeof value.notes === 'string'
  )
}

const isPlanBlock = (value: unknown): value is PlanBlock => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.kind === 'string' &&
    BLOCK_KINDS.includes(value.kind as PlanBlock['kind']) &&
    typeof value.title === 'string' &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isPlanExercise) &&
    (value.durationMinutes === undefined || typeof value.durationMinutes === 'number') &&
    (value.notes === undefined || typeof value.notes === 'string')
  )
}

type WristOverlay = {
  sets: number
  load: string
  notes: string
  reps: Record<string, string>
}

const isWristOverlay = (value: unknown): value is WristOverlay => {
  if (!isRecord(value) || !isRecord(value.reps)) {
    return false
  }

  return (
    typeof value.sets === 'number' &&
    typeof value.load === 'string' &&
    typeof value.notes === 'string' &&
    Object.values(value.reps).every((reps) => typeof reps === 'string')
  )
}

const applyWristOverlay = (template: PlanBlock, overlay: unknown, path: string): PlanBlock => {
  if (!isWristOverlay(overlay)) {
    throw new Error(`Invalid "wrist" overlay in ${path}`)
  }

  const unknownIds = Object.keys(overlay.reps).filter(
    (id) => !template.exercises.some((exercise) => exercise.id === id),
  )
  if (unknownIds.length > 0) {
    throw new Error(`Unknown wrist drill ids in ${path}: ${unknownIds.join(', ')}`)
  }

  return {
    ...template,
    notes: overlay.notes,
    exercises: template.exercises.map((exercise) => ({
      ...exercise,
      sets: overlay.sets,
      load: overlay.load,
      reps: overlay.reps[exercise.id] ?? exercise.reps,
    })),
  }
}

const assertSessionRules = (session: PlanSession, weekBlock: SessionFocus, path: string) => {
  const where = `${path} ${session.id}`
  if (session.focus !== weekBlock) {
    throw new Error(`${where}: ${session.focus} session inside the ${weekBlock} block`)
  }

  const kinds = session.blocks.map((block) => block.kind)
  const count = (kind: PlanBlock['kind']) => kinds.filter((k) => k === kind).length
  if (count('main') !== 1 || count('core') !== 1 || count('wrist') !== 1) {
    throw new Error(`${where}: needs exactly one main, one core, and one wrist block`)
  }

  const core = session.blocks.find((block) => block.kind === 'core')
  if (core?.exercises.length !== 1) {
    throw new Error(`${where}: core block must have exactly one exercise`)
  }

  const main = session.blocks.find((block) => block.kind === 'main')
  if (!main || main.exercises.length < 2 || main.exercises.length > 4) {
    throw new Error(`${where}: main block should have 2–4 exercises`)
  }
}

const parseWeek = (path: string, data: unknown, wristTemplate: PlanBlock): PlanWeek => {
  if (!isRecord(data)) {
    throw new Error(`Invalid plan week file: ${path}`)
  }

  const weekNumber = data.week
  const block = data.block
  const blockWeek = data.blockWeek
  const title = data.title
  const goal = data.goal
  const rawSessions = data.sessions

  if (
    typeof weekNumber !== 'number' ||
    !isFocus(block) ||
    typeof blockWeek !== 'number' ||
    typeof title !== 'string' ||
    typeof goal !== 'string' ||
    !Array.isArray(rawSessions)
  ) {
    throw new Error(
      `Invalid plan week file: ${path} (needs week, block "upper" | "lower", blockWeek, title, goal, sessions)`,
    )
  }

  const wristBlock = applyWristOverlay(wristTemplate, data.wrist, path)

  const sessions = rawSessions.map((session, index): PlanSession => {
    if (!isRecord(session)) {
      throw new Error(`Invalid session in ${path} #${index}`)
    }

    const id = session.id
    const sessionTitle = session.title
    const suggestedDay = session.suggestedDay
    const durationMinutes = session.durationMinutes
    const notes = session.notes
    const focus = session.focus
    const variant = session.variant
    const blocks = session.blocks

    if (
      typeof id !== 'string' ||
      typeof sessionTitle !== 'string' ||
      typeof suggestedDay !== 'string' ||
      typeof durationMinutes !== 'number' ||
      typeof notes !== 'string' ||
      !isFocus(focus) ||
      typeof variant !== 'string' ||
      !SESSION_VARIANTS.includes(variant as PlanSession['variant']) ||
      !Array.isArray(blocks) ||
      !blocks.every(isPlanBlock)
    ) {
      throw new Error(`Invalid session in ${path}: ${String(id)}`)
    }

    const parsed: PlanSession = {
      id,
      week: weekNumber,
      weekTitle: title,
      block,
      blockWeek,
      focus,
      variant: variant as PlanSession['variant'],
      title: sessionTitle,
      suggestedDay,
      durationMinutes,
      notes,
      blocks: [...blocks, wristBlock],
    }
    assertSessionRules(parsed, block, path)
    return parsed
  })

  if (sessions.length !== SESSIONS_PER_WEEK) {
    throw new Error(`${path}: expected ${SESSIONS_PER_WEEK} sessions, found ${sessions.length}`)
  }

  const variants = sessions.map((session) => session.variant).sort().join('')
  if (variants !== 'AB') {
    throw new Error(`${path}: expected one A and one B session, found ${variants}`)
  }

  return { week: weekNumber, block, blockWeek, title, goal, sessions }
}

const blockTitle = (focus: SessionFocus): string =>
  focus === 'upper' ? 'Upper-body block' : 'Lower-body block'

/**
 * `weekFiles` maps a file path (only used in error messages) to the parsed
 * JSON of `plan/week-*.json`; `wrist` is the parsed `plan/wrist.json`.
 */
export const parsePlan = (
  weekFiles: Record<string, unknown>,
  wrist: unknown,
): TrainingPlan => {
  if (!isPlanBlock(wrist) || wrist.kind !== 'wrist') {
    throw new Error('Invalid plan/wrist.json')
  }

  const weeks = Object.entries(weekFiles)
    .map(([path, data]) => parseWeek(path, data, wrist))
    .sort((a, b) => a.week - b.week)

  if (weeks.length !== PLAN_WEEKS) {
    throw new Error(`Expected ${PLAN_WEEKS} plan weeks, found ${weeks.length}`)
  }

  weeks.forEach((week, index) => {
    const expectedBlock = BLOCK_ORDER[Math.floor(index / WEEKS_PER_BLOCK)]
    const expectedBlockWeek = (index % WEEKS_PER_BLOCK) + 1
    if (
      week.week !== index + 1 ||
      week.block !== expectedBlock ||
      week.blockWeek !== expectedBlockWeek
    ) {
      throw new Error(
        `Week ${week.week}: expected week ${index + 1} = ${expectedBlock} block week ${expectedBlockWeek}`,
      )
    }
  })

  const sessions = weeks.flatMap((week) => week.sessions)
  const ids = new Set(sessions.map((session) => session.id))
  if (ids.size !== sessions.length) {
    throw new Error('Duplicate session ids in plan/')
  }

  const blocks: TrainingBlock[] = BLOCK_ORDER.map((focus) => {
    const blockWeeks = weeks.filter((week) => week.block === focus)
    return {
      focus,
      title: blockTitle(focus),
      weeks: blockWeeks,
      sessions: blockWeeks.flatMap((week) => week.sessions),
    }
  })

  return { blocks, weeks, sessions }
}

export const findSession = (
  plan: TrainingPlan,
  sessionId: string,
): PlanSession | undefined => plan.sessions.find((session) => session.id === sessionId)

export const sessionNeighbors = (
  plan: TrainingPlan,
  sessionId: string,
): { previous?: PlanSession; next?: PlanSession; index: number } => {
  const index = plan.sessions.findIndex((session) => session.id === sessionId)
  if (index < 0) {
    return { index }
  }

  return {
    index,
    previous: plan.sessions[index - 1],
    next: plan.sessions[index + 1],
  }
}
