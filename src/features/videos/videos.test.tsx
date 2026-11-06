import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { embedUrl, VideoPlayer } from './VideoPlayer'
import { formatDuration } from './VideosPage'

describe('VideoPlayer', () => {
  it('does not load YouTube until the learner presses play', async () => {
    const user = userEvent.setup()
    render(<VideoPlayer youtubeId="BKorP55Aqvg" title="The Expert" />)
    expect(document.querySelector('iframe')).toBeNull()

    await user.click(screen.getByRole('button'))

    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/BKorP55Aqvg')
    expect(iframe?.getAttribute('title')).toBe('The Expert')
  })

  it('asks for English captions and escapes the id', () => {
    expect(embedUrl('abc')).toContain('cc_load_policy=1')
    expect(embedUrl('abc')).toContain('cc_lang_pref=en')
    expect(embedUrl('a/b?c')).toContain('/embed/a%2Fb%3Fc?')
  })
})

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(189)).toBe('3:09')
    expect(formatDuration(600)).toBe('10:00')
    expect(formatDuration(59)).toBe('0:59')
  })
})
