import type { PlanSession } from '../data/planTypes.ts'

const STORAGE_KEY = 'cursor-plan-progress-v2'
const LEGACY_STORAGE_KEYS = ['cursor-plan-progress-v1']

export type PlanProgress = {
  currentSessionId: string | null
  checks: Record<string, Record<string, boolean[]>>
}

export const emptyProgress = (): PlanProgress => ({
  currentSessionId: null,
  checks: {},
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Keeps only progress that still matches the plan: unknown sessions or
 * exercises are dropped and set arrays are trimmed to the current set count,
 * so editing `plan/` (or stale data from an older plan) cannot break the UI.
 */
export const sanitizeProgress = (value: unknown, sessions: PlanSession[]): PlanProgress => {
  if (!isRecord(value)) {
    return emptyProgress()
  }

  const checks: PlanProgress['checks'] = {}
  const rawChecks = isRecord(value.checks) ? value.checks : {}

  for (const session of sessions) {
    const rawSession = rawChecks[session.id]
    if (!isRecord(rawSession)) {
      continue
    }

    for (const block of session.blocks) {
      for (const exercise of block.exercises) {
        const sets = rawSession[exercise.id]
        if (!Array.isArray(sets) || !sets.every((flag) => typeof flag === 'boolean')) {
          continue
        }

        const trimmed = sets.slice(0, exercise.sets)
        if (trimmed.some(Boolean)) {
          checks[session.id] ??= {}
          checks[session.id][exercise.id] = trimmed
        }
      }
    }
  }

  const currentSessionId =
    typeof value.currentSessionId === 'string' &&
    sessions.some((session) => session.id === value.currentSessionId)
      ? value.currentSessionId
      : null

  return { currentSessionId, checks }
}

export const loadProgress = (sessions: PlanSession[]): PlanProgress => {
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key)
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? sanitizeProgress(JSON.parse(raw), sessions) : emptyProgress()
  } catch {
    return emptyProgress()
  }
}

export const saveProgress = (progress: PlanProgress): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Private mode or full storage: ticks still work for this page view.
  }
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

/**
 * The last opened session while it is unfinished; otherwise the first
 * unfinished session after it (in plan order), then any unfinished session,
 * and finally the last session once everything is done.
 */
export const suggestSessionId = (
  sessions: PlanSession[],
  progress: PlanProgress,
): string => {
  const lastIndex = sessions.findIndex((session) => session.id === progress.currentSessionId)
  const isOpen = (session: PlanSession) => !isSessionComplete(session, progress)

  if (lastIndex >= 0 && isOpen(sessions[lastIndex])) {
    return sessions[lastIndex].id
  }

  const afterLast = sessions.slice(lastIndex + 1).find(isOpen)
  const anyOpen = afterLast ?? sessions.find(isOpen)
  return anyOpen?.id ?? sessions[sessions.length - 1]?.id ?? ''
}
