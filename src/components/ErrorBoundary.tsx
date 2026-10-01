import { Component, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error) => ReactNode
  onError?: (error: Error) => void
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
    this.props.onError?.(error)
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children
  }
}

/** Last line of defence: never leave the visitor with a blank page. */
export function CrashScreen() {
  return (
    <div className="crash">
      <h1>Something went wrong</h1>
      <p>The page hit an error in this browser. Reloading usually fixes it.</p>
      <p>
        <a href={window.location.pathname}>Reload the page</a>
      </p>
    </div>
  )
}
