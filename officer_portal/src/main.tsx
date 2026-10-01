import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { configureAmplify } from './config/amplify'
import './index.css'
import App from './App.tsx'

configureAmplify()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
