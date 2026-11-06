import type { PlanSession } from '../data/planTypes.ts'

const LAST_SESSION_KEY = 'cursor-plan-last-session'

// Set-completion progress used to live under these keys; delete it from
// browsers that still have it.
const RETIRED_KEYS = ['cursor-plan-progress-v1', 'cursor-plan-progress-v2']

export const isKnownSessionId = (
  value: unknown,
  sessions: PlanSession[],
): value is string =>
  typeof value === 'string' && sessions.some((session) => session.id === value)

export const loadLastSessionId = (sessions: PlanSession[]): string | null => {
  try {
    for (const key of RETIRED_KEYS) {
      window.localStorage.removeItem(key)
    }

    const stored = window.localStorage.getItem(LAST_SESSION_KEY)
    return isKnownSessionId(stored, sessions) ? stored : null
  } catch {
    return null
  }
}

export const saveLastSessionId = (sessionId: string | null): void => {
  try {
    if (sessionId) {
      window.localStorage.setItem(LAST_SESSION_KEY, sessionId)
    }
  } catch {
    // Private mode or full storage: Continue just falls back to the first session.
  }
}

/** The last opened session, or the first session of the plan. */
export const suggestSessionId = (
  sessions: PlanSession[],
  lastSessionId: string | null,
): string =>
  isKnownSessionId(lastSessionId, sessions) ? lastSessionId : (sessions[0]?.id ?? '')
