import { useEffect } from 'react'

/* Tiny scroll-scene engine: one passive scroll listener, one rAF per frame,
   every pinned scene reads its own 0..1 progress from its tall wrapper.
   Scenes write styles straight to DOM nodes — no React re-render per frame. */

const scenes = new Set()
let queued = false

function tick() {
  queued = false
  const vh = window.innerHeight
  const updates = []
  for (const scene of scenes) {
    const el = scene.el
    if (!el) continue
    const rect = el.getBoundingClientRect()
    // Skip work for scenes far off screen.
    if (rect.bottom < -vh || rect.top > vh * 2) continue
    const travel = Math.max(1, rect.height - vh)
    const p = clamp(-rect.top / travel, 0, 1)
    if (p !== scene.last) {
      scene.last = p
      updates.push([scene, p, rect])
    }
  }
  for (const [scene, progress, rect] of updates) scene.fn(progress, rect)
}

function queue() {
  if (!queued) {
    queued = true
    requestAnimationFrame(tick)
  }
}

let listening = false
function listen() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', () => {
    for (const s of scenes) s.last = -1
    queue()
  }, { passive: true })
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* useScrollScene(ref, (p) => {...}): p = how far the wrapper has been
   scrolled through, 0 when its top hits the viewport top, 1 when its bottom
   reaches the viewport bottom. Not called at all with reduced motion. */
export function useScrollScene(ref, fn) {
  useEffect(() => {
    const scene = { el: ref.current, fn, last: -1 }
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    function sync() {
      scene.el.toggleAttribute('data-scroll-scene', !preference.matches)
      if (preference.matches) {
        scenes.delete(scene)
      } else {
        scene.last = -1
        scenes.add(scene)
        listen()
        queue()
      }
    }
    sync()
    preference.addEventListener('change', sync)
    return () => {
      scenes.delete(scene)
      scene.el.removeAttribute('data-scroll-scene')
      preference.removeEventListener('change', sync)
    }
  }, [ref, fn])
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

/* Local progress of p inside [a, b], clamped to 0..1. */
export function range(p, a, b) {
  return clamp((p - a) / (b - a), 0, 1)
}

export const lerp = (a, b, t) => a + (b - a) * t

/* Cinematic easing: slow in, long soft landing. */
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t) => 1 - Math.pow(1 - t, 3)
