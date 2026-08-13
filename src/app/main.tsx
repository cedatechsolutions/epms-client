import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { initTheme } from '@/shared/theme'
import App from './App'
import './styles/globals.css'

// Installs the prefers-color-scheme listener so a `system` preference keeps following the OS.
// Runs outside React: the theme is a document-level attribute, not component state.
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
