import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught error', error, info)
    }
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 className="serif">Something went wrong</h1>
          <p className="muted" style={{ margin: '12px 0 24px' }}>
            We hit an unexpected error. You can reload the page or go back to the home screen.
          </p>
          <button className="btn" type="button" onClick={this.handleReload}>
            Reload
          </button>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: 24, textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--danger)' }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      </main>
    )
  }
}
