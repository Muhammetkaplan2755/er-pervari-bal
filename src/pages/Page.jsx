import { useI18n } from '../i18n/I18nContext.jsx'
import { ArrowRight } from '../components/icons.jsx'
import { useDocumentMeta } from '../meta.js'
import './Pages.css'

/* Shared frame for the sub-pages: back link, title and intro. */
// metaDesc: search-result description when it should differ from the visible intro.
export default function Page({ id, eyebrow, title1, title2, desc, metaDesc, children }) {
  const { t } = useI18n()
  useDocumentMeta(`${[title1, title2].filter(Boolean).join(' ')} — Er Pervari Bal`, metaDesc ?? desc)
  return (
    <section className="page theme-light" aria-labelledby={`${id}-title`}>
      <a className="page__back" href="/">
        <ArrowRight className="page__back-icon" /> {t('page.back')}
      </a>
      <header className="store-intro page__head">
        <h1 className="store-title page__title" id={`${id}-title`}>{[title1, title2].filter(Boolean).join(' ')}</h1>
        {(desc || eyebrow) && <p className="store-lede">{[eyebrow, desc].filter(Boolean).join(' · ')}</p>}
      </header>
      {children}
    </section>
  )
}
