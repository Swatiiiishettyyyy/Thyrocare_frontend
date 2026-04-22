import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './responsive.css'
import App from './App'

const BASENAME = '/labtest'

// If this micro-frontend is opened at `/`, bounce to `/labtest/` so the basename matches
// and the Router can render normally.
if (typeof window !== 'undefined') {
  const { pathname, search, hash } = window.location
  if (!pathname.startsWith('/labtest')) {
    window.location.replace(`/labtest${search}${hash}`)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASENAME}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
