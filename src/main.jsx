import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/instrument-serif/latin-ext-400-italic.css'
import './styles/globals.css'
import App from './App.jsx'

const container = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

/* The build prerenders every page in Turkish with an empty cart and no query
   string. Hydrate only when this visit matches that; otherwise (saved EN/AR,
   items in the cart, ?boyut=…, old #/ links) render fresh over the markup so
   React never has to patch a mismatch. */
function matchesPrerender() {
  if (!container.firstElementChild) return false
  if (location.search || location.hash.startsWith('#/')) return false
  // Yönetici paneli yalnızca tarayıcıda çizilir (lazy); sunucu HTML'i yer tutucudur.
  if (location.pathname.startsWith('/yonetim')) return false
  try {
    const lang = localStorage.getItem('erpervari-dil')
    if (lang && lang !== 'tr') return false
    const cart = JSON.parse(localStorage.getItem('erpervari-sepet-v1') ?? '{}')
    if (Object.keys(cart).length) return false
  } catch { /* storage blocked: defaults apply, same as the prerender */ }
  return true
}

if (matchesPrerender()) hydrateRoot(container, app)
else createRoot(container).render(app)
