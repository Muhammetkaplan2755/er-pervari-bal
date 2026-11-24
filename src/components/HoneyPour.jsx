import { useEffect, useRef } from 'react'
import './HoneyPour.css'

function Still() {
  return <svg viewBox="0 0 600 340" className="pour__still" focusable="false">
    <defs>
      <linearGradient id="pour-steel" x2=".25" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#dec9b1"/><stop offset=".3" stopColor="#766653"/><stop offset=".55" stopColor="#f8ebd8"/><stop offset=".73" stopColor="#9e9081"/><stop offset="1" stopColor="#534537"/>
      </linearGradient>
      <linearGradient id="pour-amber">
        <stop stopColor="#844209"/><stop offset=".22" stopColor="#f7b535"/><stop offset=".34" stopColor="#ffe29a"/><stop offset=".47" stopColor="#eaa11d"/><stop offset=".78" stopColor="#ae5b0b"/><stop offset="1" stopColor="#f1b33c"/>
      </linearGradient>
      <radialGradient id="pour-puddle" cy=".36">
        <stop stopColor="#f3ac29"/><stop offset=".76" stopColor="#d38216"/><stop offset=".94" stopColor="#9d540c"/><stop offset="1" stopColor="#efb949"/>
      </radialGradient>
    </defs>
    <path fill="url(#pour-steel)" d="M262 93Q299 91 346 71L503 21Q522 16 520 26Q520 30 508 33L348 80Q329 86 318 98Q292 127 260 119Q246 115 250 106Z"/>
    <path fill="url(#pour-puddle)" d="M252 105Q275 100 317 87Q310 104 281 114Q255 124 251 115Z"/>
    <ellipse cx="257" cy="278" rx="63" ry="15" fill="url(#pour-puddle)"/>
    <path fill="none" stroke="url(#pour-amber)" strokeWidth="7" strokeLinecap="round" d="M239 276C264 287 299 269 264 266C230 262 225 277 254 276S280 260 254 262C242 263 243 269 250 269"/>
    <path fill="url(#pour-amber)" d="M250 110Q247 123 251 143C256 171 249 229 246 251Q243 266 249 271L254 270Q248 263 252 249C254 205 259 163 260 143Q260 126 271 116Z"/>
    <path fill="#ffe1a1" d="M211 280Q224 287 248 287Q222 290 211 280Z"/>
  </svg>
}

export default function HoneyPour() {
  const host = useRef(null)
  useEffect(() => {
    const el = host.current
    const media = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)')
    const net = navigator.connection
    let near = false
    let cleanup
    let generation = 0
    let cancelIdle
    function refresh() {
      const version = ++generation
      cancelIdle?.()
      cleanup?.()
      cleanup = null
      el.removeAttribute('data-live')
      if (!near || !media.matches || net?.saveData || document.readyState !== 'complete') return
      async function start() {
        try {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('webgl2', { alpha: true, antialias: true })
          if (!context) return
          const { mountPour } = await import('./honeyPourScene.js')
          if (version !== generation) {
            context.getExtension('WEBGL_lose_context')?.loseContext()
            return
          }
          cleanup = mountPour(el, canvas, context)
        } catch { /* Keep the prerendered illustration. */ }
      }
      if (window.requestIdleCallback) {
        const id = window.requestIdleCallback(start, { timeout: 1500 })
        cancelIdle = () => window.cancelIdleCallback(id)
      } else {
        const id = setTimeout(start, 200)
        cancelIdle = () => clearTimeout(id)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        near = true
        observer.disconnect()
        refresh()
      }
    }, { rootMargin: '300px' })
    observer.observe(el)
    window.addEventListener('load', refresh)
    media.addEventListener('change', refresh)
    net?.addEventListener('change', refresh)
    return () => {
      generation++
      observer.disconnect()
      cancelIdle?.()
      cleanup?.()
      media.removeEventListener('change', refresh)
      net?.removeEventListener('change', refresh)
      window.removeEventListener('load', refresh)
    }
  }, [])
  return <div className="pour" aria-hidden="true"><div ref={host} className="pour__stage"><Still /></div></div>
}
