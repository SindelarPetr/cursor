export type SessionFocus = 'upper' | 'lower'
export type SessionVariant = 'A' | 'B'
export type BlockKind = 'main' | 'core' | 'wrist'

export type PlanExercise = {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  load: string
  notes: string
}

export type PlanBlock = {
  id: string
  kind: BlockKind
  title: string
  durationMinutes?: number
  notes?: string
  exercises: PlanExercise[]
}

export type PlanSession = {
  id: string
  week: number
  weekTitle: string
  block: SessionFocus
  blockWeek: number
  focus: SessionFocus
  variant: SessionVariant
  title: string
  suggestedDay: string
  durationMinutes: number
  notes: string
  blocks: PlanBlock[]
}

export type PlanWeek = {
  week: number
  block: SessionFocus
  blockWeek: number
  title: string
  goal: string
  sessions: PlanSession[]
}

export type TrainingBlock = {
  focus: SessionFocus
  title: string
  weeks: PlanWeek[]
  sessions: PlanSession[]
}

export type TrainingPlan = {
  blocks: TrainingBlock[]
  weeks: PlanWeek[]
  sessions: PlanSession[]
}

export const BLOCK_KINDS: readonly BlockKind[] = ['main', 'core', 'wrist']
export const SESSION_FOCUSES: readonly SessionFocus[] = ['upper', 'lower']
export const SESSION_VARIANTS: readonly SessionVariant[] = ['A', 'B']

export const PLAN_WEEKS = 6
export const SESSIONS_PER_WEEK = 2
export const WEEKS_PER_BLOCK = 3
export const BLOCK_ORDER: readonly SessionFocus[] = ['upper', 'lower']
