import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { t } from '../i18n'
import { applyTheme, storedTheme } from '../theme/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState(storedTheme)
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={dark}
      aria-label={t.darkMode}
      title={dark ? t.lightMode : t.darkMode}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        applyTheme(next)
        setTheme(next)
      }}
    >
      <span key={theme} className="theme-icon">
        {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      </span>
    </button>
  )
}
