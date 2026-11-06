import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, storedTheme } from './theme'

describe('theme', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('defaults to white', () => {
    expect(storedTheme()).toBe('light')
  })

  it('remembers a chosen theme', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(storedTheme()).toBe('dark')
    applyTheme('light')
    expect(storedTheme()).toBe('light')
  })

  it('falls back to white when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(storedTheme()).toBe('light')
  })
})
