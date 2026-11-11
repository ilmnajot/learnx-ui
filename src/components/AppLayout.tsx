import { BarChart3, BookOpen, Clapperboard, Gamepad2, Home, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { useUser } from '../auth/AuthContext'
import { EmailBanner } from '../features/account/EmailBanner'
import { t } from '../i18n'

const ENGLISH_ONLY = new Set(['/videos'])

const TABS = [
  { to: '/', label: t.navToday, icon: Home, end: true },
  { to: '/course', label: t.navCourse, icon: BookOpen },
  { to: '/videos', label: t.navVideos, icon: Clapperboard },
  { to: '/games', label: t.navGames, icon: Gamepad2 },
  { to: '/squad', label: t.navSquad, icon: Users },
  { to: '/progress', label: t.navProgress, icon: BarChart3 },
]

export function AppLayout() {
  const arabic = useUser().course === 'ARABIC_LETTERS'
  const tabs = arabic ? TABS.filter((tab) => !ENGLISH_ONLY.has(tab.to)) : TABS
  return (
    <div className="app">
      <EmailBanner />
      <Outlet />
      <nav className="tabs" aria-label={t.appName}>
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            <span className="tab-icon"><Icon size={20} aria-hidden /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
