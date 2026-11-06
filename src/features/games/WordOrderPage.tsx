import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import type { ReviewCard } from '../../api/types'
import { Button, ListenButton, ProgressBar, QueryView, Screen } from '../../components/ui'
import { t } from '../../i18n'
import { GameEnd } from './GameEnd'
import { sameSentence, scramble } from './gameLogic'

const ROUNDS = 5

function Round({ card, onDone }: { card: ReviewCard; onDone: (correct: boolean) => void }) {
  const words = useMemo(() => scramble(card.example), [card.example])
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const sentence = picked.map((i) => words[i]).join(' ')
  const correct = sameSentence(sentence, card.example)

  return (
    <div className="stack">
      <p className="muted">{card.translation}</p>
      <div className="sentence" aria-live="polite">
        {picked.map((wordIndex, position) => (
          <button
            key={wordIndex}
            type="button"
            className="word placed"
            disabled={checked}
            onClick={() => setPicked(picked.filter((_, i) => i !== position))}
          >
            {words[wordIndex]}
          </button>
        ))}
      </div>
      <div className="word-bank">
        {words.map((word, i) => (
          <button
            key={i}
            type="button"
            className="word"
            disabled={picked.includes(i) || checked}
            onClick={() => setPicked([...picked, i])}
          >
            {word}
          </button>
        ))}
      </div>
      {checked ? (
        <>
          <div className={`card ${correct ? 'tip-ok' : 'tip-bad'}`}>
            <p><strong>{correct ? t.correct : t.incorrect}</strong></p>
            {!correct && <p>{card.example}</p>}
            <ListenButton text={card.example} />
          </div>
          <Button variant="primary" onClick={() => onDone(correct)}>{t.next}</Button>
        </>
      ) : (
        <div className="row gap">
          <Button className="grow" onClick={() => setPicked([])} disabled={picked.length === 0}>{t.clear}</Button>
          <Button className="grow" variant="primary" disabled={picked.length !== words.length} onClick={() => setChecked(true)}>
            {t.check}
          </Button>
        </div>
      )}
    </div>
  )
}

function Game({ cards, onReplay }: { cards: ReviewCard[]; onReplay: () => void }) {
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const card = cards[index]

  if (!card) return <GameEnd game="WORD_ORDER" correct={correct} total={cards.length} onReplay={onReplay} />

  return (
    <div className="stack">
      <ProgressBar percent={(index / cards.length) * 100} label={t.wordOrder} />
      <span className="muted small mono">{t.round(index + 1, cards.length)}</span>
      <Round
        key={card.phraseId}
        card={card}
        onDone={(wasCorrect) => {
          if (wasCorrect) setCorrect(correct + 1)
          setIndex(index + 1)
        }}
      />
    </div>
  )
}

export default function WordOrderPage() {
  const [round, setRound] = useState(0)
  const query = useQuery({
    queryKey: ['games', 'pool', 'order', round],
    queryFn: () => api<ReviewCard[]>(`/games/pool?size=${ROUNDS}`),
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <Screen backTo="/games" title={t.wordOrder}>
      <QueryView query={query}>
        {(cards) => <Game key={round} cards={cards} onReplay={() => setRound(round + 1)} />}
      </QueryView>
    </Screen>
  )
}
