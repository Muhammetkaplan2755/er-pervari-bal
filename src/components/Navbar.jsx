import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { LANGS, useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import { Bag, Close, Logo, Menu } from './icons.jsx'
import './Navbar.css'

const links = [
  { key: 'nav.karakovan', href: '/#karakovan' },
  { key: 'nav.shop', href: '/#siparis' },
  { key: 'nav.recipes', href: pageHref('tarifler') },
  { key: 'nav.journal', href: pageHref('gunluk') },
  { key: 'nav.faq', href: '/#sss' },
  { key: 'nav.visit', href: '/#dukkan' },
]

function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={`lang ${className}`} role="group" aria-label={t('nav.lang')}>
      {Object.entries(LANGS).map(([code, l]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          aria-label={l.name}
          onClick={() => setLang(code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [light, setLight] = useState(false)
  const cart = useCart()
  const { t } = useI18n()
  const burgerRef = useRef(null)
  const sheetRef = useRef(null)
  const wasOpen = useRef(false)

  // Opening moves focus into the sheet; closing hands it back to the burger.
  useEffect(() => {
    if (open) sheetRef.current?.querySelector('a, button')?.focus()
    else if (wasOpen.current) burgerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  // Bar is transparent over the hero photo, then gains a solid backing once the page scrolls.
  // Over the ivory store sections it turns to light glass (Apple-style) so it
  // reads as part of the page instead of a dark slab.
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      setScrolled(window.scrollY > 40)
      const under = document.elementsFromPoint(window.innerWidth / 2, 30)
        .find((el) => !el.closest('.nav'))
      setLight(Boolean(under?.closest('.theme-light')))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close the sheet on Escape, and when the viewport grows past the burger breakpoint.
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(min-width: 1080px)')
    const close = () => setOpen(false)
    const onKey = (e) => { if (e.key === 'Escape') close() }
    const onMq = (e) => { if (e.matches) close() }
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open])

  return (
    <header className={`nav ${scrolled || open ? 'is-scrolled' : ''} ${light && !open ? 'is-light' : ''}`}>
      <a className="nav__brand" href="/">
        <Logo className="nav__logo" />
        <span>Er Pervari <b>Bal</b></span>
      </a>

      <nav className="nav__pill" aria-label={t('nav.primary')}>
        <ul>
          {links.map((link) => (
            <li key={link.key}><a href={link.href}>{t(link.key)}</a></li>
          ))}
        </ul>
      </nav>

      <div className="nav__actions">
        <LangSwitch className="nav__lang" />
        <a className="btn btn--light nav__cta" href="/#siparis">{t('nav.order')}</a>
        <button
          className="nav__cart"
          type="button"
          aria-label={t('nav.cart', cart.count)}
          onClick={() => { setOpen(false); cart.open() }}
        >
          <Bag />
          {cart.count > 0 && <span className="nav__cart-count" aria-hidden="true">{cart.count}</span>}
        </button>
        <button
          ref={burgerRef}
          className="nav__burger"
          type="button"
          aria-controls="nav-sheet"
          aria-label={open ? t('nav.menuClose') : t('nav.menuOpen')}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="nav__sheet" id="nav-sheet" ref={sheetRef}>
          <ul>
            {links.map((link) => (
              <li key={link.key}>
                <a href={link.href} onClick={() => setOpen(false)}>{t(link.key)}</a>
              </li>
            ))}
          </ul>
          <LangSwitch className="nav__sheet-lang" />
          <a className="btn btn--honey nav__sheet-cta" href="/#siparis" onClick={() => setOpen(false)}>
            {t('nav.order')}
          </a>
        </div>
      )}
    </header>
  )
}
