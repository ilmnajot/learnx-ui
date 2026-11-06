import { BarChart3, BookOpen, Gamepad2, Home, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { t } from '../i18n'

const TABS = [
  { to: '/', label: t.navToday, icon: Home, end: true },
  { to: '/course', label: t.navCourse, icon: BookOpen },
  { to: '/games', label: t.navGames, icon: Gamepad2 },
  { to: '/squad', label: t.navSquad, icon: Users },
  { to: '/progress', label: t.navProgress, icon: BarChart3 },
]

export function AppLayout() {
  return (
    <div className="app">
      <Outlet />
      <nav className="tabs" aria-label={t.appName}>
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
