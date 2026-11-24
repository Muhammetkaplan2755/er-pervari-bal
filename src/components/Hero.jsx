import { useCallback, useRef } from 'react'
import { counter } from '../data/content.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { ArrowRight, Cell, Instagram, SHOP } from './icons.jsx'
import HeroComb from './HeroComb.jsx'
import { photo } from './photo.js'
import { heroScroll } from '../motion/heroState.js'
import { useScrollScene } from '../motion/scroll.js'
import './Hero.css'

export default function Hero() {
  const { t, pick } = useI18n()
  const pin = useRef(null)
  const hero = useRef(null)

  // Pinned for two extra screens. First screen: copy drifts away, the photo
  // pushes in and the 3D comb dives into a cell until the frame is honey.
  // Second screen: the hero holds that honey frame while the film (which
  // overlaps it, transparent at first) opens a hexagon window over it.
  const onScroll = useCallback((p) => {
    const dive = Math.min(1, p * 2)
    heroScroll.p = dive
    heroScroll.wake?.()
    hero.current?.style.setProperty('--hp', dive.toFixed(4))
    hero.current?.toggleAttribute('data-copy-hidden', dive >= 0.4)
  }, [])
  useScrollScene(pin, onScroll)


  return (
    <div className="hero-pin" ref={pin}>
    <section className="hero" id="top" ref={hero}>
      <div className="hero__media">
        {/* The poured-honey shot: dark shelving top-left, honey stream right of centre —
            the same light split the copy column needs. */}
        {/* Fades in with CSS, not on a JS load event: the prerendered page
            shows it before the bundle has even arrived. */}
        <img
          className="hero__photo"
          {...photo('suzme')}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero__scrim" aria-hidden="true" />
        <HeroComb />
        <div className="hero__amber" aria-hidden="true" />
      </div>

      <div className="hero__inner">
        <div className="hero__lead">
          <h1 className="hero__title">
            {t('hero.title1')}<br />
            {t('hero.title2')} {t('hero.title3')}
          </h1>

          <p className="hero__sub">{t('hero.sub')}</p>

          <div className="hero__cta">
            <a className="btn btn--honey hero__go" href="#karakovan">
              {t('hero.cta')}
              <span className="hero__go-dot" aria-hidden="true"><ArrowRight /></span>
            </a>

            <a className="hero__proof" href={SHOP.instagram} target="_blank" rel="noopener noreferrer">
              <span className="hero__ig" aria-hidden="true"><Instagram /></span>
              <span className="hero__proof-text">
                <strong dir="ltr">{SHOP.handle}</strong>
                {t('hero.proof')}
              </span>
            </a>
          </div>


        </div>
      </div>

      <div className="hero__foot">
        <a className="hero__door" href="#dukkan" aria-label={t('nav.visit')}><bdi>32A</bdi></a>
        <div className="hero__partners">
          <span className="hero__partners-label">{t('hero.counter')}</span>
          <ul>
            {counter.map((item) => (
              <li key={item.tr}>
                <Cell />
                <span>{pick(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
    </div>
  )
}
