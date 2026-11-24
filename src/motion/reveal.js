import { useEffect } from 'react'
import { reducedMotion } from './scroll.js'

/* Every direct child of the ordinary home sections rises into place the first
   time it scrolls into view. Pinned scenes (hero, film, shelf) are skipped.
   Siblings entering together are staggered slightly. */
// Grids marked data-reveal-children reveal tile by tile instead of as one block.
const TARGETS = 'main section:not(.hero):not(.film) > :not([data-reveal-children]), [data-reveal-children] > *'

export function useReveal(deps) {
  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return undefined
    const els = [...document.querySelectorAll(TARGETS)]
      .filter((el) => el.tagName !== 'SCRIPT' && !el.classList.contains('is-in'))
    const io = new IntersectionObserver((entries) => {
      let n = 0
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.style.setProperty('--reveal-delay', `${Math.min(n++, 4) * 0.08}s`)
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -12% 0px' })
    for (const el of els) {
      // Already on screen at load: show without animating.
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight) continue
      el.classList.add('reveal')
      io.observe(el)
    }
    return () => {
      io.disconnect()
      for (const el of els) el.classList.remove('reveal', 'is-in')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
