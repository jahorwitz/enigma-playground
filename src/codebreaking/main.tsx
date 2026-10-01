import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CodebreakingApp from './CodebreakingApp'
import '../styles.css'
import './codebreaking.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CodebreakingApp />
  </StrictMode>,
)
