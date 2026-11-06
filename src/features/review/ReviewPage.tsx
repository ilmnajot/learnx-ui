import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../../api/client'
import type { ReviewAnswer, ReviewCard } from '../../api/types'
import { Button, ErrorNote, ListenButton, ProgressBar, QueryView, Screen } from '../../components/ui'
import { t } from '../../i18n'

function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const queryClient = useQueryClient()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [lastInterval, setLastInterval] = useState<number | null>(null)

  const answer = useMutation({
    mutationFn: ({ phraseId, remembered }: { phraseId: string; remembered: boolean }) =>
      api<ReviewAnswer>(`/reviews/${phraseId}`, { method: 'POST', body: { remembered } }),
    onSuccess: (result) => {
      setLastInterval(result.nextReviewInDays)
      setRevealed(false)
      setIndex((i) => i + 1)
      void queryClient.invalidateQueries({ queryKey: ['today'] })
      void queryClient.invalidateQueries({ queryKey: ['squad'] })
    },
  })

  const card = cards[index]
  if (!card) {
    return (
      <div className="center stack">
        <p className="prompt">{t.reviewDone}</p>
        {lastInterval !== null && <p className="muted">{t.nextReview(lastInterval)}</p>}
        <Link className="btn btn-primary" to="/">{t.home}</Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <ProgressBar percent={(index / cards.length) * 100} label={t.reviewTitle} />
      <span className="muted small mono">{t.round(index + 1, cards.length)}</span>
      <div className="card center stack-sm">
        <span className="eyebrow">{t.sayInEnglish}</span>
        <p className="prompt">{card.translation}</p>
        {revealed ? (
          <>
            <div className="row center-row gap">
              <p className="answer">{card.english}</p>
              <ListenButton text={card.example} />
            </div>
            <p className="example">{card.example}</p>
          </>
        ) : (
          <p className="muted small">{t.tryAloud}</p>
        )}
      </div>
      <ErrorNote error={answer.error} />
      {revealed ? (
        <div className="row gap">
          <Button className="grow" disabled={answer.isPending}
            onClick={() => answer.mutate({ phraseId: card.phraseId, remembered: false })}>
            {t.missedIt}
          </Button>
          <Button className="grow" variant="primary" disabled={answer.isPending}
            onClick={() => answer.mutate({ phraseId: card.phraseId, remembered: true })}>
            {t.gotIt}
          </Button>
        </div>
      ) : (
        <Button variant="primary" onClick={() => setRevealed(true)}>{t.showAnswer}</Button>
      )}
    </div>
  )
}

export default function ReviewPage() {
  const [params] = useSearchParams()
  const limit = Number(params.get('limit')) || 20
  const query = useQuery({
    queryKey: ['reviews', 'session', limit],
    queryFn: () => api<ReviewCard[]>(`/reviews/due?limit=${limit}`),
    // A session keeps its cards while answers change what is due.
    staleTime: Infinity,
    gcTime: 0,
  })

  return (
    <Screen backTo="/" title={t.reviewTitle}>
      <QueryView query={query}>
        {(cards) =>
          cards.length === 0 ? (
            <div className="center stack">
              <p className="prompt">{t.reviewEmpty}</p>
              <p className="muted">{t.reviewEmptyHint}</p>
              <Link className="btn btn-primary" to="/games">{t.navGames}</Link>
            </div>
          ) : (
            <ReviewSession cards={cards} />
          )
        }
      </QueryView>
    </Screen>
  )
}
