import { guideBySlug, guides } from '../data/guides.js'
import { photo } from '../components/photo.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import NotFound from './NotFound.jsx'
import Page from './Page.jsx'

/* Rehber (guide) articles: Turkish-only SEO content, see src/data/guides.js.
   /rehber lists them, /rehber/:slug renders one. */

const dateFmt = new Intl.DateTimeFormat('tr', { day: 'numeric', month: 'long', year: 'numeric' })
const fmt = (iso) => dateFmt.format(new Date(`${iso}T12:00:00`))

function TrOnly() {
  const { lang, t } = useI18n()
  if (lang === 'tr') return null
  return <p className="guide__tr-only">{t('gd.trOnly')}</p>
}

function GuideList() {
  const { t } = useI18n()
  return (
    <Page id="rehber" title1={t('gd.title1')} title2={t('gd.title2')} desc={t('gd.desc')}>
      <TrOnly />
      <ul className="guides" lang="tr">
        {guides.map((g) => (
          <li key={g.slug} className="guide-card">
            <a href={pageHref('rehber', g.slug)}>
              <img {...photo(g.img)} sizes="(min-width: 900px) 380px, 100vw" alt="" loading="lazy" decoding="async" style={{ objectPosition: g.imgPos }} />
              <span className="guide-card__body">
                <h2>{g.title}</h2>
                <span className="guide-card__desc">{g.description}</span>
                <span className="store-link">{t('gd.read')}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  )
}

function Article({ guide }) {
  const { t } = useI18n()
  const others = guides.filter((g) => g.slug !== guide.slug)
  return (
    <Page id="rehber-yazi" eyebrow={t('gd.eyebrow')} title1={guide.title} desc={guide.lede} metaDesc={guide.description}>
      <TrOnly />
      <article className="guide" lang="tr">
        <p className="guide__date">
          <time dateTime={guide.date}>{fmt(guide.date)}</time>
        </p>
        <figure className="guide__figure">
          <img {...photo(guide.img)} sizes="(min-width: 900px) 760px, 100vw" alt={guide.imgAlt} decoding="async" style={{ objectPosition: guide.imgPos }} />
        </figure>
        {guide.sections.map((s) => (
          <section key={s.h} className="guide__section">
            <h2>{s.h}</h2>
            {s.p?.map((para) => <p key={para.slice(0, 32)}>{para}</p>)}
            {s.list && (
              <ul>
                {s.list.map((li) => <li key={li.slice(0, 32)}>{li}</li>)}
              </ul>
            )}
            {s.after && <p>{s.after}</p>}
          </section>
        ))}

        <aside className="guide__cta">
          <p>{t('gd.ctaText')}</p>
          <div className="guide__cta-actions">
            <a className="btn btn--ink" href="/#siparis">{t('nav.order')}</a>
            <a className="btn btn--ghost" href="/#sss">{t('nav.faq')}</a>
          </div>
        </aside>
      </article>

      {others.length > 0 && (
        <nav className="guide__more" aria-label={t('gd.more')} lang="tr">
          <h2>{t('gd.more')}</h2>
          <ul>
            {others.map((g) => (
              <li key={g.slug}><a className="store-link" href={pageHref('rehber', g.slug)}>{g.title}</a></li>
            ))}
          </ul>
        </nav>
      )}
    </Page>
  )
}

export default function Guides({ slug }) {
  if (!slug) return <GuideList />
  const guide = guideBySlug(slug)
  if (!guide) return <NotFound />
  return <Article guide={guide} />
}
