import { compare, traits } from '../data/content.js'
import { filmUi } from '../data/film.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { photo } from './photo.js'
import './Karakovan.css'
import HoneyPour from './HoneyPour.jsx'


export default function Karakovan() {
  const { t, pick } = useI18n()

  return (
    <section className="kk theme-light" id="karakovan" aria-labelledby="karakovan-title">
      <div className="kk__spread">
        <figure className="kk__plate">
          <img {...photo('petek')} sizes="(min-width: 800px) 50vw, 100vw" alt={t('kk.photoAlt')} loading="lazy" decoding="async" />
          <figcaption>{t('kk.photoCap')}</figcaption>
        </figure>
        <div className="kk__notes">
          <h2 className="store-title" id="karakovan-title">{t('kk.title1')} {t('kk.title2')}</h2>
          <p className="store-lede">{t('kk.lede')}</p>
          {traits.map((trait) => (
            <section key={trait.title.tr}>
              <h3>{pick(trait.title)}</h3>
              <p>{pick(trait.body)}</p>
            </section>
          ))}
          <section>
            <h3>{t('kk.keepLabel').replace(/:$/, '')}</h3>
            <p>{t('kk.keep')}</p>
          </section>
        </div>
      </div>

      <div className="kk__compare">
        <h3 className="kk__compare-title">{t('kk.compareTitle')}</h3>
        <div className="kk__table-wrap">
          <table className="kk__table" aria-label={t('kk.compareAria')}>
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">{t('kk.topic')}</span></th>
                <th scope="col" className="is-hero">{t('kk.colKarakovan')}</th>
                <th scope="col">{t('kk.colFrame')}</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.topic.tr}>
                  <th scope="row">{pick(row.topic)}</th>
                  <td className="is-hero">{pick(row.karakovan)}</td>
                  <td>{pick(row.cerceve)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="kk__pour">
        <HoneyPour />
        <div className="kk__pour-copy">
          <p>{pick(filmUi.label)}</p>
          <a className="btn btn--ink kk__cta" href="#siparis">{t('nav.order')}</a>
        </div>
      </div>
    </section>
  )
}
