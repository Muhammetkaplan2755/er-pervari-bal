import { useEffect, useRef, useState } from 'react'

// Decorative 3D comb on the hero's far side. Only on wide screens, only with
// motion allowed and WebGL available, and only after the page has loaded, so
// phones and the LCP image never pay for three.js.
const WIDE = '(min-width: 1100px) and (prefers-reduced-motion: no-preference)'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!gl) return false
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !/swiftshader|llvmpipe|software rasterizer/i.test(renderer)
  } catch {
    return false
  }
}

function afterLoad(cb) {
  let idle = 0
  let timer = 0
  const go = () => {
    idle = window.requestIdleCallback
      ? window.requestIdleCallback(cb, { timeout: 1500 })
      : (timer = window.setTimeout(cb, 200))
  }
  if (document.readyState === 'complete') go()
  else window.addEventListener('load', go, { once: true })
  return () => {
    window.removeEventListener('load', go)
    if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle)
    window.clearTimeout(timer)
  }
}

export default function HeroComb() {
  const box = useRef(null)
  // Starts false so the prerendered HTML and the first client render match.
  const [wide, setWide] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const onChange = () => setWide(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!wide || !hasWebGL()) return undefined
    let dispose = null
    let cancelled = false
    const cancelWait = afterLoad(() => {
      import('./honeycombScene.js')
        .then(({ mountHoneycomb }) => {
          if (cancelled || !box.current) return
          dispose = mountHoneycomb(box.current, { onReady: () => setReady(true) })
        })
        .catch(() => { /* decorative: the photo hero stands on its own */ })
    })
    return () => {
      cancelled = true
      cancelWait()
      dispose?.()
      setReady(false)
    }
  }, [wide])

  if (!wide) return null
  return <div ref={box} className={`hero__comb ${ready ? 'is-ready' : ''}`} aria-hidden="true" />
}
