import { useEffect } from 'react'
import { useCart } from '../cart/CartContext.jsx'
import { WHATSAPP_NUMBER } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import Page from './Page.jsx'

/* /odeme?durum=basarili&no=EP… or /odeme?durum=hata — where server/payment.js
   sends the customer back after the iyzico payment page. */
export default function PaymentResult({ query }) {
  const { t } = useI18n()
  const cart = useCart()
  const ok = query.get('durum') === 'basarili'
  const no = (query.get('no') ?? '').replace(/[^A-Z0-9]/gi, '').slice(0, 24)

  // Paid: the cart has become an order.
  useEffect(() => {
    if (ok) cart.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok])

  if (ok) {
    const msg = encodeURIComponent(`Merhaba, siteden kartla ödeme yaptım. Sipariş no: ${no}`)
    return (
      <Page id="odeme" eyebrow={t('pay.okEyebrow')} title1={t('pay.okTitle1')} title2={t('pay.okTitle2')} desc={t('pay.okDesc')}>
        {no && <p className="page__help pay__no">{t('pay.orderNo')} <strong dir="ltr">{no}</strong></p>}
        <a className="btn btn--ink page__cta" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`} target="_blank" rel="noopener noreferrer">{t('pay.okWa')}</a>
        <p className="page__help"><a href="/">{t('page.back')}</a></p>
      </Page>
    )
  }

  return (
    <Page id="odeme" eyebrow={t('pay.failEyebrow')} title1={t('pay.failTitle1')} title2={t('pay.failTitle2')} desc={t('pay.failDesc')}>
      <button type="button" className="btn btn--ink page__cta" onClick={cart.open}>{t('pay.retry')}</button>
      <p className="page__help"><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">{t('pay.failWa')}</a></p>
    </Page>
  )
}
