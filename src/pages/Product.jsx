import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { Bag, Cell, Minus, Plus, WhatsApp } from '../components/icons.jsx'
import { imgAttrs, photosOf } from '../components/productPhotos.js'
import ProductArt, { hasArt } from '../components/ProductArt.jsx'
import { CATEGORIES, SHIPPING, WHATSAPP_NUMBER, catalog, formatTL, trText } from '../data/catalog.js'
import { productInfo } from '../data/productInfo.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useDocumentMeta } from '../meta.js'
import { productHref } from '../router.js'
import NotFound from './NotFound.jsx'
import './Product.css'

function Gallery({ images, name, id }) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  if (images.length === 0) {
    return (
      <div className="pd__placeholder" role="img" aria-label={t('pd.noPhoto')}>
        {hasArt(id) ? (
          <>
            <ProductArt id={id} />
            <span className="pd__art-tag">{t('ln.art')}</span>
          </>
        ) : (
          <><Cell /><span className="pd__placeholder-name">{name}</span></>
        )}
      </div>
    )
  }
  return (
    <div className="pd__gallery">
      <img
        className="pd__main"
        {...imgAttrs(images[i])}
        sizes="(min-width: 960px) 50vw, 100vw"
        alt={name}
        fetchPriority="high"
        decoding="async"
      />
      {images.length > 1 && (
        <div className="pd__thumbs">
          {images.map((img, idx) => (
            <button
              key={img}
              type="button"
              aria-label={t('pd.photo', idx + 1, images.length)}
              aria-pressed={idx === i}
              onClick={() => setI(idx)}
            >
              <img {...imgAttrs(img)} sizes="96px" alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Related({ product }) {
  const { t, pick } = useI18n()
  const items = catalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3)
  if (items.length === 0) return null
  return (
    <section className="pd__related" aria-labelledby="pd-related">
      <h2 id="pd-related">{t('pd.related')}</h2>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            <a href={productHref(p.id)}>
              <strong>{pick(p.name)}</strong>
              <span>{pick(p.note)}</span>
              <em>{formatTL(Math.min(...p.variants.map((v) => v.price)))}</em>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Product({ id, query }) {
  const { t, pick } = useI18n()
  const { add, open } = useCart()
  const product = catalog.find((p) => p.id === id)
  const info = productInfo[id] ?? { images: [], facts: [] }

  const initialVariant = product?.variants.some((v) => v.id === query.get('boyut')) ? query.get('boyut') : product?.variants[0].id
  const [variantId, setVariantId] = useState(initialVariant)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const variant = product?.variants.find((v) => v.id === variantId)
  const name = product ? pick(product.name) : ''
  useDocumentMeta(product ? `${name} — Er Pervari Bal` : '', product ? pick(info.desc ?? product.note) : '')

  if (!product) return <NotFound message={t('pd.notFound')} />

  const soldOut = product.stock === 'out'

  const chooseVariant = (vid) => {
    setVariantId(vid)
    // Keep the URL on the chosen size so a shared or feed link opens the same price.
    window.history.replaceState(null, '', productHref(product.id, product.variants.length > 1 ? vid : undefined))
  }

  const onAdd = () => {
    add(product.id, variantId, qty)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1800)
  }

  const askText = `Merhaba, ${trText(product.name)} (${trText(variant.label)}) hakkında bilgi almak istiyorum.`
  let addLabel = t(product.stock === 'preorder' ? 'shop.preorder' : 'shop.add')
  if (added) addLabel = t('shop.added')
  if (soldOut) addLabel = t('shop.out')

  return (
    <article className="pd theme-light">
      <nav className="pd__crumbs" aria-label="Breadcrumb">
        <ol>
          <li><a href="/">{t('pd.home')}</a></li>
          <li><a href="/#siparis">{t('nav.shop')}</a></li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <div className="pd__top">
        <Gallery images={photosOf(product, info).list} name={name} id={product.id} />

        <div className="pd__buy">
          <h1 className="pd__title store-title">{name}</h1>
          <p className="pd__note">{pick(CATEGORIES.find((cat) => cat.id === product.category))} · {pick(product.note)}</p>

          {product.variants.length > 1 && (
            <fieldset className="pd__sizes">
              <legend>{t('pd.size')}</legend>
              <div className="pd__segments">
                {product.variants.map((v) => (
                  <label key={v.id} className={v.id === variantId ? 'is-on' : ''}>
                    <input type="radio" name="pd-size" value={v.id} checked={v.id === variantId} onChange={() => chooseVariant(v.id)} />
                    {pick(v.label)} · {formatTL(v.price)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <p className="pd__price" aria-live="polite" aria-atomic="true">{formatTL(variant.price)}</p>
          {product.stock !== 'in' && <span className={`badge badge--${product.stock}`}>{t(`shop.badge.${product.stock}`)}</span>}

          <div className="pd__actions">
            <div className="stepper pd__qty" role="group" aria-label={t('pd.qty')}>
              <button type="button" aria-label={t('cart.less', name)} onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus /></button>
              <output aria-live="polite">{qty}</output>
              <button type="button" aria-label={t('cart.more', name)} onClick={() => setQty((q) => Math.min(99, q + 1))}><Plus /></button>
            </div>
            <button type="button" className={`btn btn--ink pd__add ${added ? 'is-added' : ''}`} disabled={soldOut} onClick={onAdd}>
              <Bag /> {addLabel}
            </button>
          </div>
          {added && (
            <button type="button" className="pd__view-cart store-link" onClick={open}>{t('shop.float')}</button>
          )}

          <dl className="pd__info">
            <div>
              <dt>{t('pd.shipTitle')}</dt>
              <dd>{t('pd.shipFee', formatTL(SHIPPING.fee), formatTL(SHIPPING.freeOver))} {t('pd.shipTime')}</dd>
            </div>
            <div>
              <dt>{t('pd.payTitle')}</dt>
              <dd>{t('pd.pay')}</dd>
            </div>
          </dl>

          <a
            className="pd__ask btn btn--ghost"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(askText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsApp /> {t('pd.ask')}
          </a>
        </div>
      </div>

      <div className="pd__description">
        <p className="pd__desc store-lede">{pick(info.desc ?? product.note)}</p>
      </div>

      {info.facts.length > 0 && (
        <section className="pd__facts" aria-labelledby="pd-facts">
          <h2 id="pd-facts">{t('pd.details')}</h2>
          <dl>
            {info.facts.map(([key, value]) => (
              <div key={key}><dt>{t(`fact.${key}`)}</dt><dd>{pick(value)}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <Related product={product} />

      {/* Phone: the buy button stays reachable while reading the details. */}
      <div className="pd__sticky" aria-hidden="true">
        <span>
          <strong>{name}</strong>
          {pick(variant.label)} · {formatTL(variant.price)}
        </span>
        <button type="button" className="btn btn--ink" disabled={soldOut} onClick={onAdd} tabIndex={-1}>
          <Bag /> {addLabel}
        </button>
      </div>
    </article>
  )
}
