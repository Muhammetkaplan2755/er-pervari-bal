import { faq } from '../data/faq.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import './Sections.css'

/* Native <details>: keyboard and screen-reader support for free, works without JS. */
export default function Faq() {
  const { t, pick } = useI18n()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: pick(q),
      acceptedAnswer: { '@type': 'Answer', text: pick(a) },
    })),
  }

  return (
    <section className="faq theme-light" id="sss" aria-labelledby="sss-title">
      <header className="store-intro">
        <h2 className="store-title" id="sss-title">{t('faq.title1')} {t('faq.title2')}</h2>
        <p className="store-lede">{t('faq.desc')}</p>
      </header>

      <div className="faq__list">
        {faq.map(({ q, a }) => (
          <details key={q.tr} className="faq__item">
            <summary>{pick(q)}</summary>
            <p>{pick(a)}</p>
          </details>
        ))}
      </div>
      <p className="faq__more">
        <a className="store-link" href={pageHref('rehber')}>{t('gd.faqLink')}</a>
      </p>

      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </section>
  )
}
