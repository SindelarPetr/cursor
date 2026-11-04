import type { PlanSession } from '../data/planTypes.ts'

const STORAGE_KEY = 'cursor-plan-progress-v1'

export type PlanProgress = {
  currentSessionId: string | null
  checks: Record<string, Record<string, boolean[]>>
}

const emptyProgress = (): PlanProgress => ({
  currentSessionId: null,
  checks: {},
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseProgress = (value: unknown): PlanProgress => {
  if (!isRecord(value)) {
    return emptyProgress()
  }

  const checks: PlanProgress['checks'] = {}
  if (isRecord(value.checks)) {
    for (const [sessionId, exercises] of Object.entries(value.checks)) {
      if (!isRecord(exercises)) {
        continue
      }

      checks[sessionId] = {}
      for (const [exerciseId, sets] of Object.entries(exercises)) {
        if (Array.isArray(sets) && sets.every((flag) => typeof flag === 'boolean')) {
          checks[sessionId][exerciseId] = sets
        }
      }
    }
  }

  return {
    currentSessionId:
      typeof value.currentSessionId === 'string' ? value.currentSessionId : null,
    checks,
  }
}

export const loadProgress = (): PlanProgress => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parseProgress(JSON.parse(raw)) : emptyProgress()
  } catch {
    return emptyProgress()
  }
}

export const saveProgress = (progress: PlanProgress): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export const padChecks = (stored: boolean[] | undefined, sets: number): boolean[] => {
  const next = stored ? stored.slice(0, sets) : []
  while (next.length < sets) {
    next.push(false)
  }
  return next
}

export const sessionExercises = (session: PlanSession) =>
  session.blocks.flatMap((block) =>
    block.exercises.map((exercise) => ({ block, exercise })),
  )

export const isSessionComplete = (
  session: PlanSession,
  progress: PlanProgress,
): boolean => {
  const sessionChecks = progress.checks[session.id] ?? {}
  return sessionExercises(session).every(({ exercise }) =>
    padChecks(sessionChecks[exercise.id], exercise.sets).every(Boolean),
  )
}

export const completedSetCount = (
  session: PlanSession,
  progress: PlanProgress,
): { done: number; total: number } => {
  const sessionChecks = progress.checks[session.id] ?? {}
  return sessionExercises(session).reduce(
    (acc, { exercise }) => {
      const checks = padChecks(sessionChecks[exercise.id], exercise.sets)
      acc.done += checks.filter(Boolean).length
      acc.total += exercise.sets
      return acc
    },
    { done: 0, total: 0 },
  )
}

export const suggestSessionId = (
  sessions: PlanSession[],
  progress: PlanProgress,
): string => {
  const last = progress.currentSessionId
  const lastSession = sessions.find((session) => session.id === last)
  if (lastSession && !isSessionComplete(lastSession, progress)) {
    return lastSession.id
  }

  const firstOpen = sessions.find((session) => !isSessionComplete(session, progress))
  return firstOpen?.id ?? last ?? sessions[0]?.id ?? ''
}
