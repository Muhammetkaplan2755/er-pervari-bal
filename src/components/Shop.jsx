import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { CATEGORIES, SHIPPING, catalog, formatTL } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref, productHref } from '../router.js'
import { Bag, Plus } from './icons.jsx'
import './Shop.css'

function ProductCard({ product }) {
  const { add } = useCart()
  const { t, pick } = useI18n()
  const [variantId, setVariantId] = useState(product.variants[0].id)
  const [added, setAdded] = useState(false)
  const timer = useRef(0)
  const variant = product.variants.find((v) => v.id === variantId)
  const name = pick(product.name)
  const soldOut = product.stock === 'out'

  useEffect(() => () => clearTimeout(timer.current), [])

  const onAdd = () => {
    add(product.id, variantId)
    setAdded(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1600)
  }

  let label = <><Plus /> {t('shop.add')}</>
  if (product.stock === 'preorder') label = <><Plus /> {t('shop.preorder')}</>
  if (added) label = t('shop.added')
  if (soldOut) label = t('shop.out')

  return (
    <li className={`board__row ${soldOut ? 'is-out' : ''}`}>
      <div className="board__name">
        <h4>
          <a className="board__link" href={productHref(product.id)}>{name}</a>
        </h4>
          {product.stock !== 'in' && <span className={`badge badge--${product.stock}`}>{t(`shop.badge.${product.stock}`)}</span>}
        <p>{pick(product.note)}</p>
      </div>

      {product.variants.length > 1 ? (
        <fieldset className="board__sizes">
          <legend className="sr-only">{t('shop.sizes', name)}</legend>
          {product.variants.map((v) => (
            <label key={v.id} className={v.id === variantId ? 'is-on' : ''}>
              <input
                type="radio"
                name={`size-${product.id}`}
                value={v.id}
                checked={v.id === variantId}
                onChange={() => setVariantId(v.id)}
              />
              {pick(v.label)}
            </label>
          ))}
        </fieldset>
      ) : (
        <span className="board__single">{pick(variant.label)}</span>
      )}

      <span className="board__price" aria-live="polite" aria-atomic="true">{formatTL(variant.price)}</span>

      <button type="button" className={`btn btn--ink board__add ${added ? 'is-added' : ''}`} onClick={onAdd} disabled={soldOut} aria-live="polite">
        {label}
      </button>
    </li>
  )
}

export default function Shop() {
  const { count, open } = useCart()
  const { t, pick } = useI18n()

  return (
    <section className="shop theme-light" id="siparis" aria-labelledby="siparis-title">
      <div className="shop__content">
        <div className="store-intro">
          <h2 className="store-title" id="siparis-title">{t('shop.title1')} {t('shop.title2')}</h2>
          <p className="store-lede">{t('shop.desc')}</p>
        </div>
        <p className="shop__ship">
          <span>{t('shop.ship', formatTL(SHIPPING.fee))}</span>
          <strong>{t('shop.free', formatTL(SHIPPING.freeOver))}</strong>
        </p>

        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="board__group" id={cat.id === 'kutu' ? 'hediye' : undefined}>
            <h3 className="board__cat">{pick(cat)}</h3>
            <ul className="board">
              {catalog.filter((p) => p.category === cat.id).map((product) => <ProductCard key={product.id} product={product} />)}
            </ul>
          </div>
        ))}

        <div className="shop__extras">
          <div className="extra">
            <h3>{t('shop.subTitle')}</h3>
            <p>{t('shop.subBody')}</p>
          </div>
          <div className="extra">
            <h3>{t('shop.corpTitle')}</h3>
            <p>{t('shop.corpBody')}</p>
            <a className="store-link" href={pageHref('kurumsal')}>
              {t('shop.corpCta')}
            </a>
          </div>
        </div>
      </div>

      {count > 0 && (
        <button type="button" className="shop__float" onClick={open}>
          <Bag />
          {t('shop.float')}
          <span className="shop__float-count">{count}</span>
        </button>
      )}
    </section>
  )
}
