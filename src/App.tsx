import { useEffect, useState } from 'react'
import { AppNav } from './components/AppNav.tsx'
import { GymMode } from './components/GymMode.tsx'
import { LogView } from './components/LogView.tsx'
import { PlanOverview } from './components/PlanOverview.tsx'
import { findSession, loadPlan } from './data/loadPlan.ts'
import type { PlanExercise } from './data/planTypes.ts'
import { parseHash, routes, useHashRoute } from './lib/hashRoute.ts'
import {
  loadProgress,
  padChecks,
  saveProgress,
  suggestSessionId,
  type PlanProgress,
} from './lib/planProgress.ts'

const plan = loadPlan()

const initialProgress = (): PlanProgress => {
  const stored = loadProgress(plan.sessions)
  const initialRoute = parseHash(window.location.hash)
  if (initialRoute.name === 'session' && findSession(plan, initialRoute.sessionId)) {
    return { ...stored, currentSessionId: initialRoute.sessionId }
  }

  return stored
}

const replaceHash = (hash: string) => {
  window.location.replace(`${window.location.pathname}${window.location.search}${hash}`)
}

const App = () => {
  const route = useHashRoute()
  const [progress, setProgress] = useState<PlanProgress>(initialProgress)
  const suggestedSessionId = suggestSessionId(plan.sessions, progress)

  const sessionId =
    route.name === 'session'
      ? route.sessionId === 'current'
        ? suggestedSessionId
        : route.sessionId
      : null
  const session = sessionId ? findSession(plan, sessionId) : undefined

  if (session && progress.currentSessionId !== session.id) {
    setProgress({ ...progress, currentSessionId: session.id })
  }

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  useEffect(() => {
    if (route.name !== 'session') {
      return
    }

    if (route.sessionId === 'current' && suggestedSessionId) {
      replaceHash(routes.session(suggestedSessionId))
      return
    }

    if (!findSession(plan, route.sessionId)) {
      replaceHash(routes.plan)
    }
  }, [route, suggestedSessionId])

  useEffect(() => {
    if (route.name === 'log') {
      document.title = 'Workouts'
      return
    }

    if (session) {
      document.title = `${session.title} · Week ${session.week}`
      return
    }

    document.title = 'Plan'
  }, [route.name, session])

  const onToggleSet = (
    targetSessionId: string,
    exercise: PlanExercise,
    setIndex: number,
  ) => {
    setProgress((current) => {
      const nextSets = padChecks(
        current.checks[targetSessionId]?.[exercise.id],
        exercise.sets,
      ).map((done, index) => (index === setIndex ? !done : done))

      return {
        ...current,
        currentSessionId: targetSessionId,
        checks: {
          ...current.checks,
          [targetSessionId]: {
            ...current.checks[targetSessionId],
            [exercise.id]: nextSets,
          },
        },
      }
    })
  }

  if (route.name === 'session' && session) {
    return (
      <GymMode
        plan={plan}
        session={session}
        progress={progress}
        onOpenSession={(id) => {
          setProgress((current) => ({ ...current, currentSessionId: id }))
        }}
        onToggleSet={onToggleSet}
      />
    )
  }

  return (
    <>
      <AppNav route={route} />
      {route.name === 'log' ? (
        <LogView />
      ) : (
        <PlanOverview
          plan={plan}
          progress={progress}
          suggestedSessionId={suggestedSessionId}
        />
      )}
    </>
  )
}

export default App
