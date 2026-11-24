import { useEffect, useState } from 'react'

/* Path router. Real URLs (/urun/suzme, /tarifler) so every page can be indexed by Google,
   listed in the product feed and shared on its own; "/#karakovan" is an anchor on the home page.
   The build writes a static index.html for each route (scripts/prerender.mjs), and unknown paths
   fall back to index.html on the host (public/_redirects, vercel.json). */
export const PAGES = ['tarifler', 'gunluk', 'rehber', 'parti', 'takip', 'kurumsal', 'urun', 'yasal', 'odeme', 'yonetim']

const HOME = (anchor = '') => ({ page: '', params: [], anchor, query: new URLSearchParams() })

function parse(loc = window.location) {
  let parts
  try {
    parts = loc.pathname.split('/').filter(Boolean).map(decodeURIComponent)
  } catch {
    return { ...HOME(), page: '404' } // malformed %-escape
  }
  const [page, ...params] = parts
  if (!page) return HOME(loc.hash.slice(1))
  if (!PAGES.includes(page)) return { ...HOME(), page: '404' }
  return { page, params, anchor: '', query: new URLSearchParams(loc.search) }
}

const CHANGE = 'locationchange'

export function navigate(href, { replace = false } = {}) {
  const changePage = new URL(href, window.location.href).pathname !== window.location.pathname
  window.history[replace ? 'replaceState' : 'pushState'](null, '', href)
  const update = () => window.dispatchEvent(new Event(CHANGE))
  if (changePage && document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(async () => {
      update()
      await new Promise(resolve => requestAnimationFrame(resolve))
    })
  } else {
    update()
  }
}

/* Same-origin <a> clicks become client-side navigations; everything else (new tab, modifiers,
   external links, downloads, pure in-page hash jumps) is left to the browser. */
function onLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = e.target.closest?.('a[href]')
  if (!a || a.target || a.hasAttribute('download')) return
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin) return
  const samePage = url.pathname === window.location.pathname && url.search === window.location.search
  if (samePage && url.hash) return // browser jumps to the anchor and fires hashchange
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return // files: /raporlar/x.pdf, /feeds/…
  e.preventDefault()
  navigate(url.pathname + url.search + url.hash)
}

/* Build-time render (scripts/prerender.mjs → src/entry-server.jsx) has no
   window; it sets the path being rendered here instead. */
let serverPath = '/'
export function setServerPath(path) { serverPath = path }

/* Links from the earlier hash-based version ("#/tarifler") keep working. */
function readLocation() {
  if (typeof window === 'undefined') return parse(new URL(serverPath, 'http://prerender.local'))
  if (window.location.hash.startsWith('#/')) window.history.replaceState(null, '', window.location.hash.slice(1))
  return parse()
}

export function useRoute() {
  const [route, setRoute] = useState(readLocation)

  useEffect(() => {
    const update = () => setRoute(readLocation())
    window.addEventListener('popstate', update)
    window.addEventListener('hashchange', update)
    window.addEventListener(CHANGE, update)
    document.addEventListener('click', onLinkClick)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('hashchange', update)
      window.removeEventListener(CHANGE, update)
      document.removeEventListener('click', onLinkClick)
    }
  }, [])

  return route
}

export const pageHref = (page, ...params) => `/${[page, ...params].map(encodeURIComponent).join('/')}`
export const productHref = (id, variantId) => `/urun/${encodeURIComponent(id)}${variantId ? `?boyut=${encodeURIComponent(variantId)}` : ''}`
