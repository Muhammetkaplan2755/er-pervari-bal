import { useState } from 'react'
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { ArrowRight, Instagram, Pin, SHOP, WhatsApp } from './icons.jsx'
import { photo } from './photo.js'
import './Sections.css'

/* The map is click-to-load: no Google request (and no third-party cookies) until the visitor asks. */
const MAP_EMBED = 'https://www.google.com/maps?q=Bak%C4%B1rc%C4%B1lar+%C3%87ar%C5%9F%C4%B1s%C4%B1%2C+Gaziantep&z=16&output=embed'

export default function Visit() {
  const { t } = useI18n()
  const [showMap, setShowMap] = useState(false)

  return (
    <section className="visit" id="dukkan" aria-labelledby="dukkan-title">
      {/* Full-bleed shop front with a store card on top (Apple "Visit us"). */}
      <figure className="visit__photo">
        <img
          {...photo('dukkan')}
          sizes="100vw"
          alt={t('visit.photoAlt')}
          loading="lazy"
          decoding="async"
        />
      </figure>

      <div className="visit__copy">
        <h2 className="store-title" id="dukkan-title">
          {t('visit.title1')} {t('visit.title2')}
        </h2>
        <p className="visit__lede">{t('visit.lede')}</p>

        <address className="visit__address" lang="tr">
          <Pin />
          <span>
            Bakırcılar Çarşısı, No: 32A<br />
            Gaziantep
          </span>
        </address>

        <div className="visit__actions">
          <a className="btn btn--honey" href={SHOP.maps} target="_blank" rel="noopener noreferrer">
            {t('visit.route')}
            <span className="hero__go-dot" aria-hidden="true"><ArrowRight /></span>
          </a>
          <a className="btn btn--ghost" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            <WhatsApp className="visit__ig" />
            <span dir="ltr">{WHATSAPP_DISPLAY}</span>
          </a>
          <a className="btn btn--ghost" href={SHOP.instagram} target="_blank" rel="noopener noreferrer">
            <Instagram className="visit__ig" />
            <span dir="ltr">{SHOP.handle}</span>
          </a>
        </div>

        <div className="visit__map">
          {showMap ? (
            <iframe title={t('visit.mapTitle')} src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <button type="button" className="visit__map-load" onClick={() => setShowMap(true)}>
              <Pin />
              <span>
                <strong>{t('visit.mapLoad')}</strong>
                {t('visit.mapNote')}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
