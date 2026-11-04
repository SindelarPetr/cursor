import {
  BLOCK_KINDS,
  SESSION_FOCUSES,
  SESSION_VARIANTS,
  type PlanBlock,
  type PlanExercise,
  type PlanSession,
  type PlanWeek,
  type TrainingPlan,
} from './planTypes.ts'

const weekModules = import.meta.glob('../../plan/week-*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const wristModules = import.meta.glob('../../plan/wrist.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPlanExercise = (value: unknown): value is PlanExercise => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.sets === 'number' &&
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

const isWristOverlay = (
  value: unknown,
): value is {
  sets: number
  load: string
  notes: string
  reps: Record<string, string>
} => {
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

const applyWristOverlay = (template: PlanBlock, overlay: unknown): PlanBlock => {
  if (!isWristOverlay(overlay)) {
    throw new Error('Invalid wrist overlay on a week file')
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

const parseWeek = (path: string, data: unknown, wristTemplate: PlanBlock): PlanWeek => {
  if (!isRecord(data)) {
    throw new Error(`Invalid plan week file: ${path}`)
  }

  const weekNumber = data.week
  const title = data.title
  const goal = data.goal
  const rawSessions = data.sessions

  if (
    typeof weekNumber !== 'number' ||
    typeof title !== 'string' ||
    typeof goal !== 'string' ||
    !Array.isArray(rawSessions)
  ) {
    throw new Error(`Invalid plan week file: ${path}`)
  }

  const wristBlock = applyWristOverlay(wristTemplate, data.wrist)

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
      typeof focus !== 'string' ||
      !SESSION_FOCUSES.includes(focus as PlanSession['focus']) ||
      typeof variant !== 'string' ||
      !SESSION_VARIANTS.includes(variant as PlanSession['variant']) ||
      !Array.isArray(blocks) ||
      !blocks.every(isPlanBlock)
    ) {
      throw new Error(`Invalid session in ${path}: ${String(id)}`)
    }

    return {
      id,
      week: weekNumber,
      weekTitle: title,
      focus: focus as PlanSession['focus'],
      variant: variant as PlanSession['variant'],
      title: sessionTitle,
      suggestedDay,
      durationMinutes,
      notes,
      blocks: [...blocks, wristBlock],
    }
  })

  return {
    week: weekNumber,
    title,
    goal,
    sessions,
  }
}

export const loadPlan = (): TrainingPlan => {
  const wristEntry = Object.entries(wristModules)[0]
  const wristTemplate = wristEntry?.[1]
  if (!wristTemplate || !isPlanBlock(wristTemplate)) {
    throw new Error('Invalid plan/wrist.json')
  }

  const weeks = Object.entries(weekModules)
    .map(([path, data]) => parseWeek(path, data, wristTemplate))
    .sort((a, b) => a.week - b.week)

  if (weeks.length !== 6) {
    throw new Error(`Expected 6 plan weeks, found ${weeks.length}`)
  }

  const sessions = weeks.flatMap((week) => week.sessions)
  if (sessions.length !== 24) {
    throw new Error(`Expected 24 plan sessions, found ${sessions.length}`)
  }

  return { weeks, sessions }
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
  return {
    index,
    previous: index > 0 ? plan.sessions[index - 1] : undefined,
    next: index >= 0 ? plan.sessions[index + 1] : undefined,
  }
}
