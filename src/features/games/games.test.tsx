import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReviewCard } from '../../api/types'
import { sameSentence, scramble, tokenize } from './gameLogic'
import { PhraseMatchBoard } from './PhraseMatchPage'
import { apiOk } from '../../test/api'

const CARDS: ReviewCard[] = [
  { phraseId: '1', english: 'Good catch', translation: 'Yaxshi topdingiz', example: 'Good catch, thanks.' },
  { phraseId: '2', english: 'No rush', translation: 'Shoshilinch emas', example: 'No rush at all.' },
]

describe('word order logic', () => {
  it('never returns the original order when words can be rearranged', () => {
    for (let i = 0; i < 200; i++) {
      expect(scramble('It turned out fine').join(' ')).not.toBe('It turned out fine')
    }
  })

  it('keeps every word', () => {
    expect(scramble('a b c d').sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('handles sentences that cannot be rearranged', () => {
    expect(scramble('Done')).toEqual(['Done'])
    expect(scramble('go go')).toEqual(['go', 'go'])
  })

  it('compares ignoring case and punctuation, but not word order', () => {
    expect(sameSentence('good catch, thanks', 'Good catch, thanks.')).toBe(true)
    expect(sameSentence('thanks good catch', 'Good catch, thanks.')).toBe(false)
    expect(tokenize('  a   b ')).toEqual(['a', 'b'])
  })
})

describe('PhraseMatchBoard', () => {
  afterEach(() => vi.unstubAllGlobals())

  function renderBoard() {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      apiOk({ points: 1, gamesScoredToday: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <PhraseMatchBoard cards={CARDS} onReplay={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    return fetchMock
  }

  async function submittedScore(fetchMock: ReturnType<typeof renderBoard>) {
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    return JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as { correct: number; total: number }
  }

  it('reports a perfect score when every pair is right first time', async () => {
    const user = userEvent.setup()
    const fetchMock = renderBoard()
    await user.click(screen.getByText('Good catch'))
    await user.click(screen.getByText('Yaxshi topdingiz'))
    await user.click(screen.getByText('No rush'))
    await user.click(screen.getByText('Shoshilinch emas'))
    expect(await submittedScore(fetchMock)).toMatchObject({ correct: 2, total: 2 })
  })

  it('does not count a pair that needed a second try', async () => {
    const user = userEvent.setup()
    const fetchMock = renderBoard()
    await user.click(screen.getByText('Good catch'))
    await user.click(screen.getByText('Shoshilinch emas'))
    await user.click(screen.getByText('Good catch'))
    await user.click(screen.getByText('Yaxshi topdingiz'))
    await user.click(screen.getByText('No rush'))
    await user.click(screen.getByText('Shoshilinch emas'))
    expect(await submittedScore(fetchMock)).toMatchObject({ correct: 1, total: 2 })
  })

  it('submits exactly one result', async () => {
    const user = userEvent.setup()
    const fetchMock = renderBoard()
    await user.click(screen.getByText('Good catch'))
    await user.click(screen.getByText('Yaxshi topdingiz'))
    await user.click(screen.getByText('No rush'))
    await user.click(screen.getByText('Shoshilinch emas'))
    await submittedScore(fetchMock)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
