import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAccessToken } from '../../api/client'
import type { Letter, User } from '../../api/types'
import { App } from '../../App'
import { AuthProvider } from '../../auth/AuthContext'
import { t } from '../../i18n'
import { apiOk } from '../../test/api'
import { buildRounds, optionsFor } from './letterLogic'

function letter(pos: number, glyph: string, name: string, latin: string, similar: string[] = []): Letter {
  return {
    lessonId: `lesson-${pos}`, glyph, name, latin, hint: `${name} hint`,
    isolatedForm: glyph, initialForm: `${glyph}ـ`, medialForm: `ـ${glyph}ـ`, finalForm: `ـ${glyph}`,
    say: glyph, word: 'باب', wordLatin: 'bāb', wordMeaning: 'eshik', similar,
  }
}

const LETTERS: Letter[] = [
  letter(1, 'ا', 'alif', 'a', ['ل']),
  letter(2, 'ب', 'bāʼ', 'b', ['ت', 'ث', 'ن']),
  letter(3, 'ت', 'tāʼ', 't', ['ب', 'ث']),
  letter(4, 'ث', 'thāʼ', 'th', ['ت', 'ب']),
  letter(5, 'ن', 'nūn', 'n', ['ب', 'ت']),
  letter(6, 'ل', 'lām', 'l', ['ا']),
]

const BA = LETTERS[1] as Letter
const TA = LETTERS[2] as Letter

describe('letter quiz rules', () => {
  it('offers four different answers including the right one, preferring look-alikes', () => {
    for (let i = 0; i < 50; i++) {
      const options = optionsFor(BA, LETTERS)
      const glyphs = options.map((o) => o.glyph)
      expect(new Set(glyphs).size).toBe(4)
      expect(glyphs).toContain('ب')
      expect(glyphs.filter((g) => BA.similar.includes(g))).toHaveLength(3)
    }
  })

  it('practises telling the letter apart from a look-alike already learned', () => {
    const rounds = buildRounds(TA, LETTERS)
    expect(rounds.map((r) => r.kind)).toEqual(['hear', 'hear', 'see', 'see', 'see'])
    expect(rounds[0]?.answer.glyph).toBe('ت')
    expect(rounds[1]?.answer.glyph).toBe('ب')
    expect(rounds.slice(2).map((r) => r.shown)).toEqual(['تـ', 'ـتـ', 'ـت'])
  })

  it('repeats the letter itself when nothing has been learned yet', () => {
    expect(buildRounds(LETTERS[0] as Letter, LETTERS)[1]?.answer.glyph).toBe('ا')
  })
})

const ARABIC_USER: User = {
  id: '1', email: 'a@example.test', displayName: 'Aziz', nativeLanguage: 'uz', timezone: 'Asia/Tashkent',
  onboarded: true, emailVerified: true, admin: false, course: 'ARABIC_LETTERS',
}

function renderAt(path: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('letter lesson', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('teaches a letter, quizzes it and completes the lesson', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const path = String(input)
      if (path.endsWith('/auth/refresh')) return apiOk({ accessToken: 'token', user: ARABIC_USER })
      if (path.endsWith('/letters')) return apiOk(LETTERS)
      if (path.endsWith('/complete')) return apiOk({ firstCompletion: true, canDo: '«ت» harfini taniysiz' })
      return apiOk({
        lesson: { id: 'lesson-3', title: 'ت — tāʼ', canDo: '«ت» harfini taniysiz', scenario: '', aiPersona: '', openingLine: '', estMinutes: 3 },
        phrases: [], completed: false, letter: TA,
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/lessons/lesson-3')

    expect(await screen.findByText('tāʼ — «t»')).toBeInTheDocument()
    expect(screen.getByText('ـتـ')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: t.letterStartQuiz }))

    // Answers every round correctly: listening rounds by letter name, reading rounds by sound.
    for (const answer of ['tāʼ', 'bāʼ', 't', 't', 't']) {
      await user.click(await screen.findByRole('button', { name: answer }))
      expect(screen.getByRole('status')).toHaveTextContent(t.letterCorrect)
      await user.click(screen.getByRole('button', { name: t.next }))
    }

    expect(await screen.findByText(t.letterScore(5, 5))).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/lessons/lesson-3/complete'))).toBe(true)
    expect(screen.getByRole('link', { name: /ث/ })).toHaveAttribute('href', '/lessons/lesson-4')
  })

  it('shows the right answer after a mistake', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
      const path = String(input)
      if (path.endsWith('/auth/refresh')) return apiOk({ accessToken: 'token', user: ARABIC_USER })
      if (path.endsWith('/letters')) return apiOk(LETTERS)
      return apiOk({
        lesson: { id: 'lesson-2', title: 'ب — bāʼ', canDo: 'x', scenario: '', aiPersona: '', openingLine: '', estMinutes: 3 },
        phrases: [], completed: false, letter: BA,
      })
    }))
    const user = userEvent.setup()
    renderAt('/lessons/lesson-2')
    await user.click(await screen.findByRole('button', { name: t.letterStartQuiz }))
    const options = await screen.findAllByRole('button', { name: /tāʼ|thāʼ|nūn/ })
    await user.click(options[0] as HTMLElement)
    expect(screen.getByRole('status')).toHaveTextContent('ب — bāʼ «b»')
  })
})

describe('onboarding', () => {
  beforeEach(() => setAccessToken(null))
  afterEach(() => vi.unstubAllGlobals())

  it('lets new learners choose the Arabic alphabet and skip the English questions', async () => {
    const newUser: User = { ...ARABIC_USER, onboarded: false, course: 'ENGLISH' }
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const path = String(input)
      if (path.endsWith('/auth/refresh')) return apiOk({ accessToken: 'token', user: newUser })
      if (path.endsWith('/me') && init?.method === 'PATCH') return apiOk(ARABIC_USER)
      if (path.endsWith('/today')) return apiOk({ streak: 0, dueReviews: 0, completedLessons: 0, totalLessons: 28 })
      return apiOk([])
    })
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderAt('/welcome')

    await user.click(await screen.findByRole('button', { name: new RegExp(t.courseArabic) }))
    await user.click(screen.getByRole('button', { name: t.onboardingStart }))

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([input, init]) => String(input).endsWith('/me') && init?.method === 'PATCH')
      expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ course: 'ARABIC_LETTERS', onboarded: true })
    })
    expect(await screen.findByRole('heading', { level: 1, name: t.greeting('Aziz') })).toBeInTheDocument()
    const nav = screen.getByRole('navigation')
    expect(within(nav).queryByText(t.navVideos)).toBeNull()
  })

  it('keeps the English path unchanged', async () => {
    const newUser: User = { ...ARABIC_USER, onboarded: false, course: 'ENGLISH' }
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input) => {
      const path = String(input)
      if (path.endsWith('/auth/refresh')) return apiOk({ accessToken: 'token', user: newUser })
      return apiOk([])
    }))
    const user = userEvent.setup()
    renderAt('/welcome')
    await user.click(await screen.findByRole('button', { name: new RegExp(t.courseEnglish) }))
    expect(screen.getByRole('heading', { name: t.onboardingRole })).toBeInTheDocument()
  })
})
