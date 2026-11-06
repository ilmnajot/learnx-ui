import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { t } from '../../i18n'
import { ShadowingSession } from './ShadowingPage'
import { compareSpeech } from './speechMatch'

describe('compareSpeech', () => {
  it('passes a perfect repeat, ignoring case and punctuation', () => {
    const result = compareSpeech('Good catch, thanks.', 'good catch thanks')
    expect(result.percent).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.words.every((w) => w.matched)).toBe(true)
  })

  it('marks exactly the missing word', () => {
    const result = compareSpeech('I ran into an issue', 'I ran into issue')
    expect(result.words.map((w) => w.matched)).toEqual([true, true, true, false, true])
    expect(result.percent).toBe(80)
  })

  it('treats contractions and their full forms as the same', () => {
    expect(compareSpeech("I'm almost done", 'I am almost done').percent).toBe(100)
    expect(compareSpeech('It is not ready', "it isn't ready").percent).toBe(100)
    expect(compareSpeech("It isn't ready", 'it isn’t ready').percent).toBe(100)
  })

  it('requires both parts of a contraction', () => {
    const result = compareSpeech("It isn't ready", 'it is ready')
    expect(result.words.map((w) => w.matched)).toEqual([true, false, true])
    expect(result.passed).toBe(false)
  })

  it('does not reward words said in the wrong order', () => {
    expect(compareSpeech('one two three four', 'four three two one').percent).toBe(25)
  })

  it('ignores extra words', () => {
    expect(compareSpeech('no rush at all', 'um no rush like at all').percent).toBe(100)
  })

  it('handles empty speech and empty targets', () => {
    expect(compareSpeech('Hello there', '').percent).toBe(0)
    expect(compareSpeech('Hello there', '').passed).toBe(false)
    expect(compareSpeech('', 'hello').percent).toBe(0)
  })
})

describe('ShadowingSession', () => {
  const SENTENCES = [{ id: '1', text: 'No rush at all.', translation: 'Shoshilinch emas.' }]
  let recognizer: FakeRecognition | undefined

  class FakeRecognition {
    lang = ''
    interimResults = false
    continuous = false
    onresult: ((event: unknown) => void) | null = null
    onerror: ((event: { error: string }) => void) | null = null
    onend: (() => void) | null = null
    constructor() {
      recognizer = this
    }
    start() {}
    stop() {
      this.onend?.()
    }
    abort() {}
    say(text: string) {
      this.onresult?.({ results: [[{ transcript: text }]] })
    }
  }

  function renderSession() {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ points: 1, gamesScoredToday: 1 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ShadowingSession sentences={SENTENCES} onReplay={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    return fetchMock
  }

  const submitted = (fetchMock: ReturnType<typeof renderSession>) =>
    JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as { game: string; correct: number; total: number }

  beforeEach(() => {
    recognizer = undefined
    vi.stubGlobal('SpeechRecognition', FakeRecognition)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('stops listening once every word is caught and scores a pass', async () => {
    const user = userEvent.setup()
    const fetchMock = renderSession()
    await user.click(screen.getByRole('button', { name: t.shadowRepeat }))
    act(() => recognizer?.say('no rush at all'))
    expect(await screen.findByRole('status')).toHaveTextContent('100%')
    await user.click(screen.getByRole('button', { name: t.next }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submitted(fetchMock)).toEqual({ game: 'SHADOWING', correct: 1, total: 1 })
  })

  it('does not count a poor attempt, but lets the learner move on', async () => {
    const user = userEvent.setup()
    const fetchMock = renderSession()
    await user.click(screen.getByRole('button', { name: t.shadowRepeat }))
    act(() => recognizer?.say('no'))
    await user.click(screen.getByRole('button', { name: t.stopSpeaking }))
    expect(await screen.findByRole('status')).toHaveTextContent('25%')
    await user.click(screen.getByRole('button', { name: t.shadowSkip }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submitted(fetchMock).correct).toBe(0)
  })

  it('keeps the best attempt when a retry goes worse', async () => {
    const user = userEvent.setup()
    const fetchMock = renderSession()
    await user.click(screen.getByRole('button', { name: t.shadowRepeat }))
    act(() => recognizer?.say('no rush at all'))
    await screen.findByRole('status')
    await user.click(screen.getByRole('button', { name: t.shadowAgain }))
    act(() => recognizer?.say('no'))
    await user.click(screen.getByRole('button', { name: t.stopSpeaking }))
    await user.click(screen.getByRole('button', { name: t.next }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submitted(fetchMock).correct).toBe(1)
  })

  it('still works without speech recognition, without claiming a score', async () => {
    vi.stubGlobal('SpeechRecognition', undefined)
    const user = userEvent.setup()
    const fetchMock = renderSession()
    expect(screen.getByText(new RegExp(t.micUnsupported))).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: t.shadowSaidIt }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(submitted(fetchMock).correct).toBe(0)
  })
})
