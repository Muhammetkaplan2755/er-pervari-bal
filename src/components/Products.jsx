import { useRef, useState } from 'react'
import { CATEGORIES, catalog, formatTL } from '../data/catalog.js'
import { productInfo } from '../data/productInfo.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { productHref } from '../router.js'
import ProductArt from './ProductArt.jsx'
import { imgAttrs, photosOf } from './productPhotos.js'
import './Products.css'

/* "Explore the range": a showcase only (buying happens in #siparis below, so
   the page never offers the same button twice). Segmented control per
   product group, one column per product — picture, name, line, sizes, price,
   "view product". Real photo when the shop has one, a labelled drawing otherwise. */
function LineupCard({ product }) {
  const { t, pick } = useI18n()

  const info = productInfo[product.id]
  const photos = photosOf(product, info)
  const shot = photos.real && photos.list[0]
  const first = product.variants[0]

  return (
    <li className="lineup__card">
      <a className="lineup__media" href={productHref(product.id)} tabIndex={-1} aria-hidden="true">
        {shot ? (
          <img {...imgAttrs(shot)} sizes="(min-width: 1100px) 22vw, (min-width: 700px) 40vw, 80vw" alt="" loading="lazy" decoding="async" />
        ) : (
          <>
            <ProductArt id={product.id} />
            <span className="lineup__art-tag">{t('ln.art')}</span>
          </>
        )}
      </a>
      {product.stock !== 'in' && <span className={`lineup__badge badge--${product.stock}`}>{t(`shop.badge.${product.stock}`)}</span>}
      <h3 className="lineup__name">
        <a href={productHref(product.id)}>{pick(product.name)}</a>
      </h3>
      <p className="lineup__note">{pick(product.note)}</p>
      <p className="lineup__sizes">
        <span className="sr-only">{t('ln.sizes')}: </span>
        {product.variants.map((v) => pick(v.label)).join(' · ')}
      </p>
      <p className="lineup__price">{formatTL(first.price)}</p>
      <div className="lineup__actions">
        <a className="btn btn--ghost lineup__view" href={productHref(product.id)}>{t('pd.view')}</a>
      </div>
    </li>
  )
}

export default function Products() {
  const { t, pick } = useI18n()
  const [tab, setTab] = useState(CATEGORIES[0].id)
  const tabs = useRef([])

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onKey = (e, i) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1
    const next = (i + step * rtl + CATEGORIES.length) % CATEGORIES.length
    setTab(CATEGORIES[next].id)
    tabs.current[next]?.focus()
  }

  const items = catalog.filter((p) => p.category === tab)

  return (
    <section className="lineup theme-light" id="urunler" aria-labelledby="urunler-title">
      <header className="store-intro">
        <h2 className="store-title" id="urunler-title">{t('pr.title')}</h2>
        <p className="store-lede">{t('pr.desc')}</p>
      </header>

      <div className="lineup__tabs" role="tablist" aria-label={t('ln.tabs')}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            ref={(el) => { tabs.current[i] = el }}
            type="button"
            role="tab"
            id={`ln-tab-${cat.id}`}
            aria-selected={tab === cat.id}
            aria-controls="ln-panel"
            tabIndex={tab === cat.id ? 0 : -1}
            className={tab === cat.id ? 'is-on' : ''}
            onClick={() => setTab(cat.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {pick(cat)}
          </button>
        ))}
      </div>

      <div id="ln-panel" role="tabpanel" aria-labelledby={`ln-tab-${tab}`} className="lineup__panel">
        <ul className="lineup__row" key={tab}>
          {items.map((product) => <LineupCard key={product.id} product={product} />)}
        </ul>
        <p className="lineup__to-shop">
          <a className="store-link" href="#siparis">{t('nav.order')}</a>
        </p>
      </div>
    </section>
  )
}
