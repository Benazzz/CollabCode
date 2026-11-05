import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return (
        <main className="empty-state">
          <h1>Something interrupted the flow.</h1>
          <p>Refresh the page to get back to your projects.</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Refresh page
          </button>
        </main>
      )
    return this.props.children
  }
}
