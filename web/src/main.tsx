import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/app'

// After a new deployment, old page chunks no longer exist. Reload once to get the new version.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'collabcode:chunk-reload'
  try {
    const last = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem(key, String(Date.now()))
  } catch {
    // Storage may be unavailable; reloading is still the best recovery.
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)