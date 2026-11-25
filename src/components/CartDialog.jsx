import { useEffect, useRef, useState } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { PAYMENT_METHODS, SHIPPING, SUBSCRIPTION, WHATSAPP_NUMBER, formatTL, trText } from '../data/catalog.js'
import { LANGS, useI18n } from '../i18n/I18nContext.jsx'
import { LEGAL_UPDATED, SELLER } from '../data/legal.js'
import { pageHref } from '../router.js'
import { Close, Minus, Plus, WhatsApp } from './icons.jsx'
import { openWhatsApp } from './whatsapp.js'
import './Shop.css'

/* Kartla ödeme (iyzico, server/payment.js) build sırasında VITE_KART_ODEME=1 ile açılır.
   Kapalıyken sepet eskisi gibi yalnızca WhatsApp siparişi gönderir. */
const CARD_ON = import.meta.env.VITE_KART_ODEME === '1'
const CARD = { id: 'kart', tr: 'Kredi / banka kartı', en: 'Credit / debit card', ar: 'بطاقة ائتمان / خصم' }
const METHODS = CARD_ON ? [CARD, ...PAYMENT_METHODS] : PAYMENT_METHODS
/* Yönetici paneli kuruluysa WhatsApp siparişleri de panele kaydedilir (server/orders.js). */
const PANEL_ON = Boolean(import.meta.env.VITE_SUPABASE_URL)

const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join('').toUpperCase()
const newOrderId = () => `EPW${Date.now().toString(36).toUpperCase()}${rnd()}`

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', city: '', district: '', payment: METHODS[0].id, repeat: SUBSCRIPTION[0].id, note: '', consent: false }

function validate(f) {
  const errors = {}
  if (f.name.trim().length < 3) errors.name = 'err.name'
  if (f.phone.replace(/\D/g, '').length < 10) errors.phone = 'err.phone'
  if (f.address.trim().length < 10) errors.address = 'err.address'
  if (!f.city.trim()) errors.city = 'err.city'
  if (!f.district.trim()) errors.district = 'err.district'
  if (f.payment === 'kart' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'err.email'
  // Mesafeli satış: ön bilgilendirme + sözleşme onayı her ödeme yönteminde zorunlu (TKHK md. 48).
  if (!f.consent) errors.consent = 'err.consent'
  return errors
}

/* The message goes to the shop, so it is always Turkish; the customer's language is noted. */
function buildMessage(cart, f, lang, orderId) {
  const lines = cart.items.map((i) => {
    const pre = i.product.stock === 'preorder' ? ' [ön sipariş]' : ''
    return `• ${i.qty} × ${trText(i.product.name)} (${trText(i.variant.label)})${pre} — ${formatTL(i.total)}`
  })
  const pay = PAYMENT_METHODS.find((m) => m.id === f.payment)
  const repeat = SUBSCRIPTION.find((s) => s.id === f.repeat)
  return [
    'Merhaba, siteden sipariş vermek istiyorum.',
    ...(orderId ? [`Sipariş no: ${orderId}`] : []),
    '',
    '*Sipariş*',
    ...lines,
    '',
    `Ara toplam: ${formatTL(cart.subtotal)}`,
    `Kargo: ${cart.shipping === 0 ? 'Ücretsiz' : formatTL(cart.shipping)}`,
    `*Toplam: ${formatTL(cart.total)}*`,
    ...(f.repeat !== 'yok' ? ['', `*Abonelik: ${repeat.tr}*`] : []),
    '',
    '*Teslimat*',
    `Ad Soyad: ${f.name.trim()}`,
    `Telefon: ${f.phone.trim()}`,
    `Adres: ${f.address.trim()}`,
    `İl / İlçe: ${f.city.trim()} / ${f.district.trim()}`,
    `Ödeme: ${pay.tr}`,
    ...(f.note.trim() ? [`Not: ${f.note.trim()}`] : []),
    '',
    `Ön bilgilendirme formunu ve mesafeli satış sözleşmesini (sürüm ${LEGAL_UPDATED}) okudum, onaylıyorum.`,
    ...(lang !== 'tr' ? [`Müşterinin dili: ${LANGS[lang].name}`] : []),
  ].join('\n')
}

const cartItems = (cart) => cart.items.map((i) => ({ id: i.product.id, variant: i.variant.id, qty: i.qty }))
const buyerOf = (f) => ({ name: f.name, phone: f.phone, email: f.email, address: f.address, city: f.city, district: f.district, note: f.note })

function Field({ id, label, error, multiline, ...props }) {
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      {error && <span className="field__err" id={`${id}-err`}>{error}</span>}
    </div>
  )
}

function Chips({ legend, name, options, value, onChange }) {
  const { pick } = useI18n()
  return (
    <fieldset className="pay chips">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.id} className={value === o.id ? 'is-on' : ''}>
          <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={onChange} />
          {pick(o)}
        </label>
      ))}
    </fieldset>
  )
}

export default function CartDialog() {
  const cart = useCart()
  const { t, pick, lang } = useI18n()
  const ref = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const card = form.payment === 'kart'

  // Native <dialog>: showModal gives focus trapping, Escape-to-close and an inert page behind it.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (cart.isOpen && !d.open) d.showModal()
    if (!cart.isOpen && d.open) d.close()
  }, [cart.isOpen])

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setPayError('')
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      ref.current?.querySelector(`#f-${Object.keys(found)[0]}`)?.focus()
      return
    }
    if (card) return payByCard()
    const orderId = PANEL_ON ? newOrderId() : ''
    openWhatsApp(WHATSAPP_NUMBER, buildMessage(cart, form, lang, orderId))
    // WhatsApp hemen açılmalı (açılır pencere engeli); kayıt arkadan, sonucunu beklemeden gider.
    if (PANEL_ON) {
      fetch('/api/siparis', {
        method: 'POST',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: orderId, lang, consent: form.consent, legalVersion: LEGAL_UPDATED, payment: form.payment, repeat: form.repeat, website: form.website ?? '', items: cartItems(cart), buyer: buyerOf(form) }),
      }).catch(() => {})
    }
    setSent(true)
  }

  /* Sunucu tutarı katalogdan yeniden hesaplar ve iyzico ödeme sayfasının adresini döner. */
  const payByCard = async () => {
    setPaying(true)
    setPayError('')
    try {
      const res = await fetch('/api/odeme-baslat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lang,
          consent: form.consent,
          legalVersion: LEGAL_UPDATED,
          expectedTotal: cart.total,
          items: cartItems(cart),
          buyer: buyerOf(form),
        }),
      })
      const out = await res.json().catch(() => ({}))
      if (out.error === 'price_changed' || out.error === 'stock') {
        setPayError(t(out.error === 'stock' ? 'pay.outOfStock' : 'pay.priceChanged'))
        setPaying(false)
        return
      }
      if (!res.ok || !out.url) throw new Error(out.error || 'provider')
      window.location.assign(out.url)
    } catch {
      setPayError(t('pay.startError'))
      setPaying(false)
    }
  }

  const finish = () => {
    cart.clear()
    setForm(EMPTY_FORM)
    setSent(false)
    cart.close()
  }

  const toFree = SHIPPING.freeOver - cart.subtotal
  const err = (k) => (errors[k] ? t(errors[k]) : undefined)

  return (
    <dialog
      ref={ref}
      className="cart"
      aria-labelledby="cart-title"
      onClose={cart.close}
      onClick={(e) => { if (e.target === ref.current) cart.close() }}
    >
      <div className="cart__inner">
        <div className="cart__top">
          <h2 id="cart-title">{t('cart.title')}</h2>
          <button type="button" className="cart__x" aria-label={t('cart.close')} onClick={cart.close}><Close /></button>
        </div>

        {cart.items.length === 0 ? (
          <div className="cart__body">
            <div className="cart__empty">
              <p>{t('cart.empty')}</p>
              <a className="btn btn--ghost" href="/#siparis" onClick={cart.close}>{t('cart.toList')}</a>
            </div>
          </div>
        ) : (
          <form className="cart__inner cart__checkout" onSubmit={onSubmit} noValidate>
            <div className="cart__body">
              <ul className="cart__lines">
                {cart.items.map((i) => {
                  const name = `${pick(i.product.name)} ${pick(i.variant.label)}`
                  return (
                    <li key={i.key} className="cart__line">
                      <div>
                        <h3>{pick(i.product.name)}</h3>
                        <small>
                          {t('cart.each', pick(i.variant.label), formatTL(i.variant.price))}
                          {i.product.stock === 'preorder' && ` · ${t('cart.preorder')}`}
                        </small>
                      </div>
                      <span className="cart__line-total">{formatTL(i.total)}</span>
                      <div className="stepper">
                        <button type="button" aria-label={t('cart.less', name)} onClick={() => cart.setQty(i.key, i.qty - 1)}><Minus /></button>
                        <output aria-live="polite">{i.qty}</output>
                        <button type="button" aria-label={t('cart.more', name)} onClick={() => cart.setQty(i.key, i.qty + 1)}><Plus /></button>
                      </div>
                      <button type="button" className="cart__remove" onClick={() => cart.setQty(i.key, 0)}>{t('cart.remove')}</button>
                    </li>
                  )
                })}
              </ul>

              <dl className="cart__sums">
                <div><dt>{t('cart.subtotal')}</dt><dd>{formatTL(cart.subtotal)}</dd></div>
                <div><dt>{t('cart.shipping')}</dt><dd>{cart.shipping === 0 ? t('cart.free') : formatTL(cart.shipping)}</dd></div>
                <div className="is-total"><dt>{t('cart.total')}</dt><dd>{formatTL(cart.total)}</dd></div>
              </dl>
              {toFree > 0 && <p className="cart__hint">{t('cart.toFree', formatTL(toFree))}</p>}

              <div className="cart__form" role="group" aria-labelledby="cart-delivery">
                <h3 id="cart-delivery">{t('cart.delivery')}</h3>
                <Field id="f-name" label={t('cart.name')} autoComplete="name" value={form.name} onChange={set('name')} error={err('name')} />
                <Field id="f-phone" label={t('cart.phone')} type="tel" dir="ltr" autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" value={form.phone} onChange={set('phone')} error={err('phone')} />
                {card && <Field id="f-email" label={t('cart.email')} type="email" dir="ltr" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} error={err('email')} />}
                <Field id="f-address" label={t('cart.address')} multiline autoComplete="street-address" value={form.address} onChange={set('address')} error={err('address')} />
                <div className="field-row">
                  <Field id="f-city" label={t('cart.city')} autoComplete="address-level1" value={form.city} onChange={set('city')} error={err('city')} />
                  <Field id="f-district" label={t('cart.district')} autoComplete="address-level2" value={form.district} onChange={set('district')} error={err('district')} />
                </div>
                <Chips legend={t('cart.payment')} name="payment" options={METHODS} value={form.payment} onChange={set('payment')} />
                {!card && <Chips legend={t('cart.repeat')} name="repeat" options={SUBSCRIPTION} value={form.repeat} onChange={set('repeat')} />}
                <Field id="f-note" label={t('cart.note')} multiline value={form.note} onChange={set('note')} />
                {/* Bot tuzağı: insanlar görmez, doldurursa sipariş kaydı yok sayılır. */}
                <input className="cart__hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website ?? ''} onChange={set('website')} />
                {/* Siparişe özel ön bilgilendirme özeti (Mesafeli Sözleşmeler Yönetmeliği md. 5). Yasal metin Türkçedir. */}
                <details className="cart__preinfo" lang="tr">
                  <summary>{t('cart.preinfo')}</summary>
                  <dl>
                    <div><dt>Satıcı</dt><dd>{SELLER.title} ({SELLER.brand}), {SELLER.address} · {SELLER.phone} · {SELLER.email}</dd></div>
                    <div><dt>Ürünler</dt><dd>{cart.items.map((i) => `${i.qty} × ${trText(i.product.name)} ${trText(i.variant.label)} — ${formatTL(i.total)}`).join('; ')}</dd></div>
                    <div><dt>Toplam (KDV dahil)</dt><dd>{formatTL(cart.subtotal)} + kargo {cart.shipping === 0 ? 'ücretsiz' : formatTL(cart.shipping)} = {formatTL(cart.total)}</dd></div>
                    <div><dt>Ödeme</dt><dd>{card ? 'Kredi / banka kartı (iyzico, 3D Secure)' : PAYMENT_METHODS.find((m) => m.id === form.payment)?.tr}</dd></div>
                    <div><dt>Teslimat</dt><dd>{form.name || '—'}, {form.address || '—'} {form.district} / {form.city}. Kargoya veriliş: {SELLER.shipWithin}; en geç 30 gün.</dd></div>
                    <div><dt>Cayma hakkı</dt><dd>Teslimden itibaren 14 gün. Ambalajı açılmış gıda ürünlerinde (hijyen) cayma hakkı yoktur.</dd></div>
                  </dl>
                </details>
                {(
                  <div className="field cart__consent">
                    <label>
                      <input id="f-consent" type="checkbox" checked={form.consent} onChange={set('consent')} aria-invalid={errors.consent ? 'true' : undefined} aria-describedby={errors.consent ? 'f-consent-err' : undefined} />
                      <span>
                        {t('cart.consentPre')}{' '}
                        <a href={pageHref('yasal', 'on-bilgilendirme-formu')} target="_blank" rel="noopener">{t('cart.consentInfo')}</a>{' '}{t('cart.consentAnd')}{' '}
                        <a href={pageHref('yasal', 'mesafeli-satis-sozlesmesi')} target="_blank" rel="noopener">{t('cart.consentContract')}</a>{t('cart.consentPost')}
                      </span>
                    </label>
                    {errors.consent && <span className="field__err" id="f-consent-err">{t(errors.consent)}</span>}
                  </div>
                )}
                <p className="cart__privacy">
                  {t(PANEL_ON ? 'cart.privacyStored' : 'cart.privacy')}{' '}
                  <a href={pageHref('yasal', 'kvkk-aydinlatma-metni')} target="_blank" rel="noopener">{t('cart.privacyLink')}</a>
                </p>
              </div>
            </div>

            <div className="cart__foot">
              {card ? (
                <button type="submit" className="btn cart__send cart__send--card" disabled={paying} aria-busy={paying || undefined}>
                  {paying ? t('pay.starting') : t('pay.button', formatTL(cart.total))}
                </button>
              ) : (
                <button type="submit" className="btn cart__send">
                  <WhatsApp /> {t('cart.send')}
                </button>
              )}
              {payError && <p className="field__err cart__pay-err" role="alert">{payError}</p>}
              {card && <p className="cart__secure">{t('pay.secure')}</p>}
              {sent && (
                <div className="cart__sent" role="status">
                  <span>{t('cart.sent')}</span>
                  <button type="button" onClick={finish}>{t('cart.finish')}</button>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
