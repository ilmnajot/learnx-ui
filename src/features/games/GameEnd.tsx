import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client'
import type { GameName, GameResult } from '../../api/types'
import { Confetti } from '../../components/Confetti'
import { Button, ErrorNote } from '../../components/ui'
import { t } from '../../i18n'

interface Props {
  game: GameName
  correct: number
  total: number
  onReplay: () => void
}

export function GameEnd({ game, correct, total, onReplay }: Props) {
  const queryClient = useQueryClient()
  const submitted = useRef(false)
  const save = useMutation({
    mutationFn: () => api<GameResult>('/games/results', { method: 'POST', body: { game, correct, total } }),
    onSuccess: () => void queryClient.invalidateQueries(),
  })
  const saveResult = save.mutate

  useEffect(() => {
    // One game must produce one result, even under React StrictMode's double effect.
    if (submitted.current) return
    submitted.current = true
    saveResult()
  }, [saveResult])

  return (
    <div className="center stack">
      {correct > 0 && <Confetti />}
      <p className="prompt">{t.gameOver}</p>
      <p className="big-number pop">{correct} / {total}</p>
      {save.data && (
        <p className={save.data.points > 0 ? 'ok' : 'muted'}>
          {save.data.points > 0 ? t.pointsEarned(save.data.points) : correct === 0 ? t.tryAgain : t.dailyLimitReached}
        </p>
      )}
      <ErrorNote error={save.error} />
      <Button variant="primary" onClick={onReplay}>{t.playAgain}</Button>
      <Link className="btn btn-secondary" to="/games">{t.back}</Link>
    </div>
  )
}
