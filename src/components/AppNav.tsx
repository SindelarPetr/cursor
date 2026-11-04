import { routes, type AppRoute } from '../lib/hashRoute.ts'

type AppNavProps = {
  route: AppRoute
}

export const AppNav = ({ route }: AppNavProps) => (
  <nav className="app-nav" aria-label="Primary">
    <a className="app-nav-brand" href={routes.plan}>
      Training
    </a>
    <div className="app-nav-tabs">
      <a
        className={route.name !== 'log' ? 'tab is-active' : 'tab'}
        href={routes.plan}
      >
        Plan
      </a>
      <a className={route.name === 'log' ? 'tab is-active' : 'tab'} href={routes.log}>
        Log
      </a>
    </div>
  </nav>
)
