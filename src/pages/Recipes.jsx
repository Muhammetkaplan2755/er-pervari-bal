import { useCart } from '../cart/CartContext.jsx'
import { photo } from '../components/photo.js'
import { Bag } from '../components/icons.jsx'
import { recipes } from '../data/recipes.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import Page from './Page.jsx'

export default function Recipes() {
  const { t, pick, lang } = useI18n()
  const { addMany, open } = useCart()

  return (
    <Page id="tarifler" title1={t('rec.title1')} title2={t('rec.title2')} desc={t('rec.desc')}>
      <div className="recipes">
        {recipes.map((r) => (
          <article key={r.id} className={`recipe ${r.img ? 'has-img' : ''}`} id={`tarif-${r.id}`}>
            {r.img && (
              <img
                className="recipe__img"
                {...photo(r.img)}
                sizes="(min-width: 900px) 40vw, 100vw"
                alt=""
                loading="lazy"
                decoding="async"
                style={{ objectPosition: r.pos }}
              />
            )}
            <div className="recipe__body">
              <h2>{pick(r.title)}</h2>
              <p className="recipe__meta">{t('rec.time', r.minutes)} · {t('rec.serves', r.serves)}</p>
              <p className="recipe__intro">{pick(r.intro)}</p>

              <div className="recipe__cols">
                <div>
                  <h3>{t('rec.ingredients')}</h3>
                  <ul>{(r.ingredients[lang] ?? r.ingredients.tr).map((x) => <li key={x}>{x}</li>)}</ul>
                </div>
                <div>
                  <h3>{t('rec.steps')}</h3>
                  <ol>{(r.steps[lang] ?? r.steps.tr).map((x) => <li key={x}>{x}</li>)}</ol>
                </div>
              </div>

              <button type="button" className="btn btn--ghost recipe__buy" onClick={() => { addMany(r.buy); open() }}>
                <Bag /> {t('rec.buy')}
              </button>
            </div>
          </article>
        ))}
      </div>
    </Page>
  )
}
