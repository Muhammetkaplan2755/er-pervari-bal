import { LEGAL_UPDATED, legalBySlug, legalDocs } from '../data/legal.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import NotFound from './NotFound.jsx'
import Page from './Page.jsx'

/* /yasal lists the legal texts, /yasal/:slug renders one (src/data/legal.js).
   Turkish only: they are the binding versions under Turkish consumer law. */

const dateFmt = new Intl.DateTimeFormat('tr', { day: 'numeric', month: 'long', year: 'numeric' })

function TrOnly() {
  const { lang, t } = useI18n()
  if (lang === 'tr') return null
  return <p className="guide__tr-only">{t('lg.trOnly')}</p>
}

function DocList() {
  const { t } = useI18n()
  return (
    <Page id="yasal" title1={t('lg.title1')} title2={t('lg.title2')} desc={t('lg.desc')}>
      <TrOnly />
      <nav className="guide__more legal__list" aria-label={t('lg.title1')} lang="tr">
        <ul>
          {legalDocs.map((d) => (
            <li key={d.slug}><a className="store-link" href={pageHref('yasal', d.slug)}>{d.title}</a></li>
          ))}
        </ul>
      </nav>
    </Page>
  )
}

function Doc({ doc }) {
  const { t } = useI18n()
  return (
    <Page id="yasal-metin" eyebrow={t('lg.eyebrow')} title1={doc.title} metaDesc={doc.description}>
      <TrOnly />
      <article className="guide legal" lang="tr">
        <p className="guide__date">
          Son güncelleme: <time dateTime={LEGAL_UPDATED}>{dateFmt.format(new Date(`${LEGAL_UPDATED}T12:00:00`))}</time>
        </p>
        {doc.sections.map((s) => (
          <section key={s.h} className="guide__section">
            <h2>{s.h}</h2>
            {s.p?.map((para) => <p key={para.slice(0, 40)}>{para}</p>)}
            {s.list && (
              <ul>
                {s.list.map((li) => <li key={li.slice(0, 40)}>{li}</li>)}
              </ul>
            )}
            {s.after && <p>{s.after}</p>}
          </section>
        ))}
      </article>
      <nav className="guide__more" aria-label={t('lg.title1')} lang="tr">
        <h2>{t('lg.others')}</h2>
        <ul>
          {legalDocs.filter((d) => d.slug !== doc.slug).map((d) => (
            <li key={d.slug}><a className="store-link" href={pageHref('yasal', d.slug)}>{d.title}</a></li>
          ))}
        </ul>
      </nav>
    </Page>
  )
}

export default function Legal({ slug }) {
  if (!slug) return <DocList />
  const doc = legalBySlug(slug)
  if (!doc) return <NotFound />
  return <Doc doc={doc} />
}
