import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CrashScreen, ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={() => <CrashScreen />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
