import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CrashScreen, ErrorBoundary } from '../components/ErrorBoundary'
import CodebreakingApp from './CodebreakingApp'
import '../styles.css'
import './codebreaking.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={() => <CrashScreen />}>
      <CodebreakingApp />
    </ErrorBoundary>
  </StrictMode>,
)
