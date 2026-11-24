import { GOOGLE_REVIEWS_URL, reviews } from '../data/reviews.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { ArrowRight } from './icons.jsx'
import './Sections.css'

/* Renders nothing until real reviews are added to src/data/reviews.js. */
export default function Reviews() {
  const { t } = useI18n()
  if (reviews.length === 0) return null

  return (
    <section className="reviews" id="yorumlar" aria-labelledby="yorumlar-title">
      <h2 className="section-title" id="yorumlar-title">{t('rev.title1')} <em>{t('rev.title2')}</em></h2>
      <ul className="reviews__list">
        {reviews.map((r, i) => (
          <li key={i} className="review">
            <blockquote lang="tr">{r.text}</blockquote>
            <p className="review__by">{r.name}{r.city && `, ${r.city}`}{r.source && <span> · {r.source}</span>}</p>
          </li>
        ))}
      </ul>
      {GOOGLE_REVIEWS_URL && (
        <a className="extra__link" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
          Google <ArrowRight className="flip-rtl" />
        </a>
      )}
    </section>
  )
}
