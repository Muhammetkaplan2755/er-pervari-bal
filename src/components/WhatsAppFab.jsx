import { useEffect, useState } from 'react'
import { WHATSAPP_NUMBER } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { WhatsApp } from './icons.jsx'
import './WhatsAppFab.css'

/* Always-there WhatsApp shortcut. Shown once the visitor has scrolled past the
   first screen (the hero already has its own calls to action). The greeting
   is Turkish in every language, like the order message: the shop reads Turkish. */
const GREETING = 'Merhaba, siteden yazıyorum.'

export default function WhatsAppFab() {
  const { t } = useI18n()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <a
      className={`wa-fab ${shown ? 'is-shown' : ''}`}
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(GREETING)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('wa.fab')}
      tabIndex={shown ? 0 : -1}
    >
      <WhatsApp />
      <span className="wa-fab__label" aria-hidden="true">{t('wa.fabShort')}</span>
    </a>
  )
}
