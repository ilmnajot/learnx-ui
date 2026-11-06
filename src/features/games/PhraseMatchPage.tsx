import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../../api/client'
import type { ReviewCard } from '../../api/types'
import { QueryView, Screen, shuffled } from '../../components/ui'
import { t } from '../../i18n'
import { GameEnd } from './GameEnd'

export function PhraseMatchBoard({ cards, onReplay }: { cards: ReviewCard[]; onReplay: () => void }) {
  const left = useMemo(() => shuffled(cards), [cards])
  const right = useMemo(() => shuffled(cards), [cards])
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [missed, setMissed] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)

  if (matched.length === cards.length) {
    return (
      <GameEnd
        game="PHRASE_MATCH"
        correct={cards.length - missed.length}
        total={cards.length}
        onReplay={onReplay}
      />
    )
  }

  function pick(card: ReviewCard) {
    if (!selected) return
    if (selected === card.phraseId) {
      setMatched([...matched, card.phraseId])
    } else {
      setMissed((current) => (current.includes(selected) ? current : [...current, selected]))
      setWrong(card.phraseId)
      window.setTimeout(() => setWrong(null), 500)
    }
    setSelected(null)
  }

  return (
    <div className="match">
      <div className="stack-sm">
        <span className="eyebrow">{t.english}</span>
        {left.map((card) => (
          <button
            key={card.phraseId}
            type="button"
            className={`tile ${selected === card.phraseId ? 'selected' : ''}`}
            disabled={matched.includes(card.phraseId)}
            aria-pressed={selected === card.phraseId}
            onClick={() => setSelected(card.phraseId)}
          >
            {card.english}
          </button>
        ))}
      </div>
      <div className="stack-sm">
        <span className="eyebrow">{t.uzbek}</span>
        {right.map((card) => (
          <button
            key={card.phraseId}
            type="button"
            className={`tile ${wrong === card.phraseId ? 'wrong' : ''}`}
            disabled={matched.includes(card.phraseId)}
            onClick={() => pick(card)}
          >
            {card.translation}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PhraseMatchPage() {
  const [params] = useSearchParams()
  const size = Math.min(Number(params.get('size')) || 6, 8)
  const [round, setRound] = useState(0)
  const query = useQuery({
    queryKey: ['games', 'pool', 'match', size, round],
    queryFn: () => api<ReviewCard[]>(`/games/pool?size=${size}`),
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <Screen backTo="/games" title={t.phraseMatch}>
      <QueryView query={query}>
        {(cards) => <PhraseMatchBoard key={round} cards={cards} onReplay={() => setRound(round + 1)} />}
      </QueryView>
    </Screen>
  )
}
