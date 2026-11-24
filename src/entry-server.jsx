import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { setServerPath } from './router.js'

/* Build-time render of one route to HTML (used by scripts/prerender.mjs).
   Always Turkish with an empty cart: main.jsx only hydrates when the visitor
   matches that, otherwise it renders fresh over this markup. */
export function render(path) {
  setServerPath(path)
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
