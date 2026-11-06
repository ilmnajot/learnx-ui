export type Theme = 'light' | 'dark'

const KEY = 'learnx-theme'

/** White is the default for everyone. Dark applies only after a person chooses it. */
export function storedTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10151f' : '#ffffff')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // The choice still applies to this visit when storage is blocked.
  }
}
