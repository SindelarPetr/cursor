import { useEffect, useState } from 'react'

export type AppRoute =
  | { name: 'plan' }
  | { name: 'log' }
  | { name: 'session'; sessionId: string }

export const routes = {
  plan: '#/plan',
  log: '#/log',
  session: (sessionId: string) => `#/session/${sessionId}`,
  currentSession: '#/session/current',
}

export const parseHash = (hash: string): AppRoute => {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '')
  if (path === '' || path === 'plan') {
    return { name: 'plan' }
  }

  if (path === 'log') {
    return { name: 'log' }
  }

  const sessionMatch = /^session\/([^/]+)$/.exec(path)
  if (sessionMatch) {
    return { name: 'session', sessionId: decodeURIComponent(sessionMatch[1]) }
  }

  return { name: 'plan' }
}

export const useHashRoute = (): AppRoute => {
  const [route, setRoute] = useState<AppRoute>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash))
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}
