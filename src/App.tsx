import { useEffect, useState } from 'react'
import { AppNav } from './components/AppNav.tsx'
import { GymMode } from './components/GymMode.tsx'
import { LogView } from './components/LogView.tsx'
import { PlanOverview } from './components/PlanOverview.tsx'
import { findSession, loadPlan } from './data/loadPlan.ts'
import { routes, useHashRoute } from './lib/hashRoute.ts'
import { loadLastSessionId, saveLastSessionId, suggestSessionId } from './lib/lastSession.ts'

const plan = loadPlan()

const replaceHash = (hash: string) => {
  window.location.replace(`${window.location.pathname}${window.location.search}${hash}`)
}

const App = () => {
  const route = useHashRoute()
  const [lastSessionId, setLastSessionId] = useState<string | null>(() =>
    loadLastSessionId(plan.sessions),
  )
  const suggestedSessionId = suggestSessionId(plan.sessions, lastSessionId)

  const sessionId =
    route.name === 'session'
      ? route.sessionId === 'current'
        ? suggestedSessionId
        : route.sessionId
      : null
  const session = sessionId ? findSession(plan, sessionId) : undefined

  if (session && lastSessionId !== session.id) {
    setLastSessionId(session.id)
  }

  useEffect(() => {
    saveLastSessionId(lastSessionId)
  }, [lastSessionId])

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

  if (route.name === 'session' && session) {
    return <GymMode plan={plan} session={session} />
  }

  return (
    <>
      <AppNav route={route} />
      {route.name === 'log' ? (
        <LogView />
      ) : (
        <PlanOverview
          plan={plan}
          suggestedSessionId={suggestedSessionId}
          hasLastSession={lastSessionId !== null}
        />
      )}
    </>
  )
}

export default App
