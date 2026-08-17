import { NavLink, Outlet } from 'react-router-dom'
import { Toaster } from './Toaster'

const NAV_ITEMS = [
  { to: '/', label: 'List', end: true },
  { to: '/board', label: 'Board', end: false },
  { to: '/stats', label: 'Stats', end: false },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header__brand">
          Trailhead <span>job search</span>
        </div>

        <div className="app-header__spacer" />

        <nav className="app-nav" aria-label="Views">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="app-nav__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>

      <Toaster />
    </div>
  )
}
