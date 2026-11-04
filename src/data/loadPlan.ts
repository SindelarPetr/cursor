import { parsePlan } from './parsePlan.ts'
import type { TrainingPlan } from './planTypes.ts'

export { findSession, sessionNeighbors } from './parsePlan.ts'

const weekModules = import.meta.glob('../../plan/week-*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const wristModules = import.meta.glob('../../plan/wrist.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export const loadPlan = (): TrainingPlan =>
  parsePlan(weekModules, Object.values(wristModules)[0])
