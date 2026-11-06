import { Component, type ErrorInfo, type ReactNode } from 'react'
import { t } from '../i18n'

interface State {
  failed: boolean
}

/** Shows a way out instead of a blank page when a screen crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Screen crashed', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <main className="screen center stack" role="alert">
        <h1>{t.crashTitle}</h1>
        <p className="muted">{t.crashHint}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.assign('/')}>
          {t.crashReload}
        </button>
      </main>
    )
  }
}
