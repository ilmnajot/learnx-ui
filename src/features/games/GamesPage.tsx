import { ArrowDownUp, AudioLines, ChevronRight, Link2, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { useUser } from '../../auth/AuthContext'
import { Screen } from '../../components/ui'
import { t } from '../../i18n'

/** Shadowing and word order practise English sentences, so the alphabet course leaves them out. */
const ENGLISH_ONLY = new Set(['/games/shadow', '/games/order'])

const GAMES = [
  { to: '/games/shadow', icon: AudioLines, color: 'green', title: t.shadowing, hint: t.shadowingHint },
  { to: '/games/match', icon: Link2, color: 'violet', title: t.phraseMatch, hint: t.phraseMatchHint },
  { to: '/games/order', icon: ArrowDownUp, color: 'blue', title: t.wordOrder, hint: t.wordOrderHint },
  { to: '/review', icon: RefreshCw, color: 'amber', title: t.review, hint: t.tryAloud },
]

export default function GamesPage() {
  const arabic = useUser().course === 'ARABIC_LETTERS'
  const games = arabic ? GAMES.filter((game) => !ENGLISH_ONLY.has(game.to)) : GAMES
  return (
    <Screen title={t.gamesTitle}>
      <div className="stack">
        <p className="muted">{t.gamesHint}</p>
        {games.map(({ to, icon: Icon, color, title, hint }) => (
          <Link key={to} to={to} className="card row gap link-card">
            <span className={`chip big ${color}`}><Icon size={24} aria-hidden /></span>
            <span className="grow">
              <strong>{title}</strong>
              <br />
              <span className="muted small">{hint}</span>
            </span>
            <ChevronRight size={18} className="muted arrow" aria-hidden />
          </Link>
        ))}
      </div>
    </Screen>
  )
}
