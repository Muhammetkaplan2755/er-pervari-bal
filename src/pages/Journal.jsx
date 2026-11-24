import { photo } from '../components/photo.js'
import { Instagram, SHOP } from '../components/icons.jsx'
import { journal } from '../data/journal.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import Page from './Page.jsx'

const monthFmt = (lang) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : lang, { month: 'long', year: 'numeric' })

export default function Journal() {
  const { t, pick, lang } = useI18n()

  return (
    <Page id="gunluk" title1={t('jr.title1')} title2={t('jr.title2')} desc={t('jr.desc')}>
      <ol className="journal">
        {journal.map((entry) => (
          <li key={entry.title.tr} className="entry">
            <img
              className="entry__img"
              {...photo(entry.img)}
              sizes="(min-width: 900px) 360px, 100vw"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div>
              {entry.date && <time dateTime={entry.date}>{monthFmt(lang).format(new Date(`${entry.date}-01`))}</time>}
              <h2>{pick(entry.title)}</h2>
              <p>{pick(entry.body)}</p>
            </div>
          </li>
        ))}
      </ol>
      <a className="btn btn--ghost page__cta" href={SHOP.instagram} target="_blank" rel="noopener noreferrer">
        <Instagram className="page__cta-icon" /> <span dir="ltr">{SHOP.handle}</span>
      </a>
    </Page>
  )
}
