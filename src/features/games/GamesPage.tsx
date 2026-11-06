import { ArrowDownUp, Link2, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { Screen } from '../../components/ui'
import { t } from '../../i18n'

const GAMES = [
  { to: '/games/match', icon: Link2, title: t.phraseMatch, hint: t.phraseMatchHint },
  { to: '/games/order', icon: ArrowDownUp, title: t.wordOrder, hint: t.wordOrderHint },
  { to: '/review', icon: RefreshCw, title: t.review, hint: t.tryAloud },
]

export default function GamesPage() {
  return (
    <Screen title={t.gamesTitle}>
      <div className="stack">
        <p className="muted">{t.gamesHint}</p>
        {GAMES.map(({ to, icon: Icon, title, hint }) => (
          <Link key={to} to={to} className="card row gap link-card">
            <span className="game-icon"><Icon size={22} aria-hidden /></span>
            <span>
              <strong>{title}</strong>
              <br />
              <span className="muted small">{hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </Screen>
  )
}
