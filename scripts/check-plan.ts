import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { findSession, parsePlan, sessionNeighbors } from '../src/data/parsePlan.ts'
import {
  completedSetCount,
  emptyProgress,
  isSessionComplete,
  sanitizeProgress,
  suggestSessionId,
  type PlanProgress,
} from '../src/lib/planProgress.ts'

const planDir = join(import.meta.dirname, '..', 'plan')
const readJson = (file: string): unknown => JSON.parse(readFileSync(join(planDir, file), 'utf8'))

const weekFiles = Object.fromEntries(
  readdirSync(planDir)
    .filter((file) => /^week-\d+\.json$/.test(file))
    .map((file) => [`plan/${file}`, readJson(file)]),
)

const results: string[] = []
const check = (name: string, fn: () => void) => {
  try {
    fn()
    results.push(`ok   ${name}`)
  } catch (error) {
    results.push(`FAIL ${name}\n     ${(error as Error).message.split('\n').join('\n     ')}`)
  }
}

const plan = parsePlan(weekFiles, readJson('wrist.json'))
const ids = plan.sessions.map((session) => session.id)

check('12 sessions, 2 per week over 6 weeks', () => {
  assert.equal(plan.weeks.length, 6)
  assert.equal(plan.sessions.length, 12)
  for (const week of plan.weeks) {
    assert.deepEqual(
      week.sessions.map((session) => session.variant),
      ['A', 'B'],
      `week ${week.week}`,
    )
  }
})

check('weeks 1–3 are the upper block, weeks 4–6 the lower block', () => {
  assert.deepEqual(
    plan.blocks.map((block) => [block.focus, block.weeks.map((week) => week.week)]),
    [
      ['upper', [1, 2, 3]],
      ['lower', [4, 5, 6]],
    ],
  )
  assert.deepEqual(ids, [
    'w1-upper-a', 'w1-upper-b', 'w2-upper-a', 'w2-upper-b', 'w3-upper-a', 'w3-upper-b',
    'w4-lower-a', 'w4-lower-b', 'w5-lower-a', 'w5-lower-b', 'w6-lower-a', 'w6-lower-b',
  ])
})

check('every session: one focus, 3 main lifts, exactly 1 core, full wrist circuit', () => {
  for (const session of plan.sessions) {
    const byKind = (kind: string) => session.blocks.filter((block) => block.kind === kind)
    assert.equal(byKind('main')[0]?.exercises.length, 3, `${session.id} main lifts`)
    assert.equal(byKind('core').length, 1, `${session.id} core blocks`)
    assert.equal(byKind('core')[0]?.exercises.length, 1, `${session.id} core exercises`)
    assert.equal(byKind('wrist')[0]?.exercises.length, 5, `${session.id} wrist drills`)
    assert.equal(byKind('wrist')[0]?.durationMinutes, 20, `${session.id} wrist minutes`)
    assert.equal(session.focus, session.block, `${session.id} focus matches block`)
  }
})

check('A/B variants reuse the same lifts across their block', () => {
  for (const block of plan.blocks) {
    for (const variant of ['A', 'B']) {
      const lifts = block.sessions
        .filter((session) => session.variant === variant)
        .map((session) =>
          session.blocks
            .filter((b) => b.kind !== 'wrist')
            .flatMap((b) => b.exercises.map((exercise) => exercise.id))
            .join(','),
        )
      assert.equal(new Set(lifts).size, 1, `${block.focus} ${variant}: ${lifts.join(' | ')}`)
    }
  }
})

check('wrist-friendly main lifts: no barbell bench or overhead press, straps on pulls', () => {
  for (const session of plan.sessions) {
    for (const exercise of session.blocks.flatMap((block) => block.exercises)) {
      assert.doesNotMatch(exercise.name, /barbell (bench|overhead|press)/i, exercise.name)
      if (/row|deadlift/i.test(exercise.name)) {
        assert.match(`${exercise.load} ${exercise.notes}`, /strap/i, `${session.id} ${exercise.name}`)
      }
    }
  }
})

check('sets, reps, rest, and a coaching note on every exercise', () => {
  for (const session of plan.sessions) {
    for (const exercise of session.blocks.flatMap((block) => block.exercises)) {
      const label = `${session.id} ${exercise.id}`
      assert.ok(exercise.sets > 0 && exercise.reps && exercise.restSeconds > 0, label)
      assert.ok(exercise.notes.length > 10 && exercise.load.length > 0, label)
    }
  }
})

check('stale progress (old 24-session ids, removed lifts, extra sets) is pruned', () => {
  const stale = {
    currentSessionId: 'w2-lower-b',
    checks: {
      'w1-upper-a': { 'ng-db-bench': [true, true, true, true, true, true], 'old-lift': [true] },
      'w2-lower-a': { squat: [true, true] },
      'w5-upper-b': { 'ng-db-incline': [true] },
      'w4-lower-a': { squat: 'yes', rdl: [false, false] },
      junk: 42,
    },
  }
  const progress = sanitizeProgress(stale, plan.sessions)
  assert.equal(progress.currentSessionId, null)
  assert.deepEqual(progress.checks, { 'w1-upper-a': { 'ng-db-bench': [true, true, true, true] } })
  assert.deepEqual(sanitizeProgress('not json', plan.sessions), emptyProgress())
  assert.deepEqual(sanitizeProgress(null, plan.sessions), emptyProgress())
})

const completeSession = (progress: PlanProgress, sessionId: string): PlanProgress => {
  const session = findSession(plan, sessionId)
  assert.ok(session, sessionId)
  const checks = Object.fromEntries(
    session.blocks.flatMap((block) =>
      block.exercises.map((exercise) => [exercise.id, Array(exercise.sets).fill(true)]),
    ),
  )
  return { ...progress, currentSessionId: sessionId, checks: { ...progress.checks, [sessionId]: checks } }
}

check('suggested session follows plan order and crosses into the lower block', () => {
  let progress = emptyProgress()
  assert.equal(suggestSessionId(plan.sessions, progress), 'w1-upper-a')

  progress = { ...progress, currentSessionId: 'w2-upper-b' }
  assert.equal(suggestSessionId(plan.sessions, progress), 'w2-upper-b', 'last opened, unfinished')

  for (const id of ids.slice(0, 6)) {
    progress = completeSession(progress, id)
  }
  assert.ok(isSessionComplete(findSession(plan, 'w3-upper-b')!, progress))
  assert.equal(suggestSessionId(plan.sessions, progress), 'w4-lower-a', 'after the upper block')

  progress = completeSession(progress, 'w5-lower-a')
  assert.equal(suggestSessionId(plan.sessions, progress), 'w5-lower-b', 'next open after last done')

  for (const id of ids) {
    progress = completeSession(progress, id)
  }
  assert.equal(suggestSessionId(plan.sessions, progress), 'w6-lower-b', 'all done')
  assert.equal(completedSetCount(findSession(plan, 'w1-upper-a')!, progress).done > 0, true)
})

check('previous / next walk all 12 sessions in order', () => {
  const first = sessionNeighbors(plan, 'w1-upper-a')
  assert.equal(first.previous, undefined)
  assert.equal(first.next?.id, 'w1-upper-b')

  const boundary = sessionNeighbors(plan, 'w3-upper-b')
  assert.equal(boundary.next?.id, 'w4-lower-a')
  assert.equal(sessionNeighbors(plan, 'w4-lower-a').previous?.id, 'w3-upper-b')

  const last = sessionNeighbors(plan, 'w6-lower-b')
  assert.equal(last.index, 11)
  assert.equal(last.next, undefined)

  assert.deepEqual(sessionNeighbors(plan, 'w5-upper-a'), { index: -1 })
})

check('invalid plan files fail loudly', () => {
  const bad = structuredClone(weekFiles) as Record<string, { sessions: { blocks: { kind: string; exercises: unknown[] }[] }[] }>
  const firstWeek = bad['plan/week-01.json']
  firstWeek.sessions[0].blocks.find((block) => block.kind === 'core')!.exercises.push(
    firstWeek.sessions[0].blocks[1].exercises[0],
  )
  assert.throws(() => parsePlan(bad, readJson('wrist.json')), /exactly one exercise/)

  const mixed = structuredClone(weekFiles) as Record<string, { block: string }>
  mixed['plan/week-02.json'].block = 'lower'
  assert.throws(() => parsePlan(mixed, readJson('wrist.json')))
})

console.log(results.join('\n'))
if (results.some((line) => line.startsWith('FAIL'))) {
  process.exit(1)
}
console.log(`\nplan check passed: ${plan.sessions.length} sessions in ${plan.blocks.length} blocks`)
