import { useCallback, useEffect, useRef, useState } from 'react'
import { film, filmUi } from '../data/film.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { ease, easeOut, lerp, range, reducedMotion, useScrollScene } from '../motion/scroll.js'
import { photo } from './photo.js'
import './Film.css'

/* Scroll timeline (0..1 across the pinned wrapper). Each scene:
   in   = window in which it opens over the previous one
   copy = [fade in start, end, fade out start, end] for its text */
const T = [
  { in: [0.01, 0.13], copy: [0.1, 0.13, 0.20, 0.23], push: [0, 0.26] },
  { in: [0.23, 0.37], copy: [0.35, 0.38, 0.44, 0.47], push: [0.23, 0.5] },
  { in: [0.47, 0.6], copy: [0.59, 0.63, 0.68, 0.71], push: [0.47, 0.74] },
  { in: [0.71, 0.83], copy: [0.8, 0.87, 2, 2], push: [0.83, 1] },
]

/* Pointy-top hexagon inscribed in its square window (static, scales with it). */
const HEX = 'polygon(50% 0%, 93.30% 25%, 93.30% 75%, 50% 100%, 6.70% 75%, 6.70% 25%)'

function FilmTitle({ text }) {
  const words = text.split(' ')
  return (
    <h2 className="film__title" aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true">{i > 0 && ' '}<span className="film__mask"><span
          className="film__word" style={{ '--lag': i / words.length }}
        >{word}</span></span></span>
      ))}
    </h2>
  )
}

/* Write a style only when it changes: most scroll frames leave the clip alone. */
function setStyle(el, prop, value) {
  if (el && el.style[prop] !== value) el.style[prop] = value
}

export default function Film() {
  const { t, pick } = useI18n()
  const pin = useRef(null)
  const scenes = useRef([])
  const windows = useRef([])
  const frames = useRef([])
  const imgs = useRef([])
  const copies = useRef([])
  const wash = useRef(null)
  // The film overlaps the hero, so "lazy" images would still load with the
  // page and fight the hero photo (LCP). Arm them on the first scroll — the
  // hero dive takes a full screen of scrolling, which covers their download.
  // Reduced motion has no pinned overlap, so plain lazy loading is enough.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (armed) return undefined
    if (reducedMotion() || window.scrollY > 0) { setArmed(true); return undefined }
    const arm = () => setArmed(true)
    const pref = window.matchMedia('(prefers-reduced-motion: reduce)')
    pref.addEventListener('change', arm)
    window.addEventListener('scroll', arm, { once: true, passive: true })
    return () => {
      window.removeEventListener('scroll', arm)
      pref.removeEventListener('change', arm)
    }
  }, [armed])
  // Decode the photos off the critical path as soon as they are requested, so
  // the first frame of each reveal does not stall on a full-size image decode.
  useEffect(() => {
    if (!armed) return
    for (const img of imgs.current) img?.decode?.().catch(() => {})
  }, [armed])

  const onScroll = useCallback((p) => {
    const w = window.innerWidth
    const h = window.innerHeight
    const cover = Math.hypot(w, h)
    const rtl = document.documentElement.dir === 'rtl'
    const amber = Math.sin(Math.PI * range(p, ...T[2].in))
    setStyle(wash.current, 'opacity', (amber * 0.56).toFixed(3))

    /* Every reveal is compositor-only: the window keeps a FIXED clip shape and
       is scaled/moved with transform, while its frame gets the inverse
       transform so the photo itself stays put. Animating clip-path directly
       repainted a full-screen layer on every scroll frame. */
    scenes.current.forEach((el, i) => {
      if (!el) return
      const covered = i + 1 < T.length && p >= T[i + 1].in[1]
      const hidden = covered || p <= T[i].in[0]
      setStyle(el, 'visibility', hidden ? 'hidden' : 'visible')
      if (hidden) {
        setStyle(copies.current[i], 'visibility', 'hidden')
        return
      }
      const win = windows.current[i]
      const frame = frames.current[i]
      const k = ease(range(p, T[i].in[0], T[i].in[1]))
      const img = imgs.current[i]
      const push = range(p, T[i].push[0], T[i].push[1])
      let clip = 'none'
      let winT = 'none'
      let frameT = 'none'
      let scale = 1
      let opacity = 1
      // Square window centred on the shape (cx, cy) with half-size r, so the
      // scaled clip stays a true hexagon/circle instead of the viewport rect.
      let box = null

      if (i === 0) {
        // Out of the comb: the photo opens through a growing hexagon —
        // fast at first so the honey frame never sits empty.
        const kh = easeOut(range(p, T[0].in[0], T[0].in[1]))
        if (kh < 1) {
          const s = Math.max(kh, 0.002)
          clip = HEX
          box = { cx: w / 2, cy: h / 2, r: cover * 0.62 }
          winT = `scale(${s.toFixed(4)})`
          frameT = `scale(${(1 / s).toFixed(4)})`
        }
        scale = lerp(1.35, 1.02, easeOut(push))
      } else if (i === 1) {
        // A honey-drop wipe that spreads from the pour.
        if (k < 1) {
          const s = Math.max(k, 0.002)
          clip = 'circle(50% at 50% 50%)'
          box = { cx: w * 0.38, cy: h * 0.34, r: Math.hypot(w * 0.62, h * 0.66) + 1 }
          winT = `scale(${s.toFixed(4)})`
          frameT = `scale(${(1 / s).toFixed(4)})`
        }
        scale = lerp(1.25, 1.0, easeOut(push))
      } else if (i === 2) {
        // Pull back from the hexagonal shelves to the whole wall.
        opacity = k
        scale = lerp(1.27, 1.02, easeOut(push))
      } else {
        // A tall slit at the threshold widens before the camera enters.
        if (k < 1) {
          const aperture = Math.max(0.003, k)
          winT = `scaleX(${aperture.toFixed(4)})`
          frameT = `scaleX(${(1 / aperture).toFixed(4)})`
        }
        scale = lerp(1.04, 1.16, ease(push))
      }

      // Geometry only while revealing; fully open (or scenes 2/3) = viewport.
      const px = (n) => `${n.toFixed(2)}px`
      setStyle(win, 'left', box ? px(box.cx - box.r) : '')
      setStyle(win, 'top', box ? px(box.cy - box.r) : '')
      setStyle(win, 'width', box ? px(box.r * 2) : '')
      setStyle(win, 'height', box ? px(box.r * 2) : '')
      setStyle(frame, 'left', box ? px(box.r - box.cx) : '')
      setStyle(frame, 'top', box ? px(box.r - box.cy) : '')
      setStyle(frame, 'width', box ? px(w) : '')
      setStyle(frame, 'height', box ? px(h) : '')
      // Frame pivots on the window centre, expressed in frame coordinates.
      setStyle(frame, 'transformOrigin', box ? `${px(box.cx)} ${px(box.cy)}` : '')
      setStyle(win, 'clipPath', clip)
      setStyle(win, 'transform', winT)
      setStyle(frame, 'transform', frameT)
      setStyle(win, 'opacity', String(opacity))
      setStyle(img, 'transform', `scale(${scale.toFixed(4)})`)

      const c = copies.current[i]
      if (c) {
        const [a, b, d, e] = T[i].copy
        const vis = Math.min(range(p, a, b), 1 - range(p, d, e))
        const ein = easeOut(vis)
        setStyle(c, 'visibility', ein > 0 ? 'visible' : 'hidden')
        setStyle(c, 'opacity', ein.toFixed(3))
        // Opacity + translate only: a blur filter re-rasterised the big serif
        // headline on every frame.
        setStyle(c, 'transform', `translate3d(0, ${((1 - ein) * 36).toFixed(1)}px, 0)`)
        c.style.setProperty('--entry', (1 - easeOut(range(p, a, b))).toFixed(3))
        c.style.setProperty('--drift', rtl ? '-10px' : '10px')
      }
    })


  }, [])
  useScrollScene(pin, onScroll)

  return (
    <section className="film" aria-label={pick(filmUi.label)}>
      <div className="film__pin" ref={pin}>
        <div className="film__stage">
          {film.map((ch, i) => (
            <article
              key={ch.id}
              className={`film__scene film__scene--${ch.id}`}
              ref={(el) => { scenes.current[i] = el }}
            >
              <div className="film__window" ref={(el) => { windows.current[i] = el }}>
              <div className="film__frame" ref={(el) => { frames.current[i] = el }}>
                <img
                  ref={(el) => { imgs.current[i] = el }}
                  className="film__img"
                  {...(armed ? photo(ch.img) : { width: photo(ch.img).width, height: photo(ch.img).height })}
                  sizes="100vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: ch.pos }}
                />
                <noscript><img className="film__img" {...photo(ch.img)} sizes="100vw" loading="lazy" alt="" style={{ objectPosition: ch.pos }} /></noscript>
              </div>
              </div>
              <div className="film__copy" ref={(el) => { copies.current[i] = el }}>
                <FilmTitle text={pick(ch.title)} />
                <p className="film__body">{ch.id === 'dukkan' ? t('film.visitBody') : pick(ch.body)}</p>
                {ch.id === 'dukkan' && (
                  <div className="film__cta">
                    <a className="btn btn--honey film__go" href="#siparis">{t('nav.order')}</a>
                    <a className="btn btn--ghost" href="#dukkan">{pick(filmUi.visit)}</a>
                  </div>
                )}
              </div>
            </article>
          ))}
          <div className="film__wash" ref={wash} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
