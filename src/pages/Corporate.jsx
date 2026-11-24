import { useState } from 'react'
import { WhatsApp } from '../components/icons.jsx'
import { openWhatsApp } from '../components/whatsapp.js'
import { LANGS, useI18n } from '../i18n/I18nContext.jsx'
import { WHATSAPP_NUMBER, catalog, trText } from '../data/catalog.js'
import Page from './Page.jsx'

const OCCASIONS = ['wedding', 'holiday', 'company', 'other']
const OCCASION_TR = { wedding: 'Düğün / nişan', holiday: 'Bayram', company: 'Firma hediyesi', other: 'Diğer' }
const boxes = catalog.filter((p) => p.category === 'kutu')

export default function Corporate() {
  const { t, pick, lang } = useI18n()
  const [f, setF] = useState({ name: '', phone: '', occasion: 'wedding', qty: '', box: boxes[0]?.id ?? 'custom', date: '', note: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: false })) }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = {
      name: f.name.trim().length < 2,
      phone: f.phone.replace(/\D/g, '').length < 10,
      qty: !(Number.isInteger(Number(f.qty)) && Number(f.qty) > 0),
    }
    setErrors(found)
    const first = Object.keys(found).find((k) => found[k])
    if (first) { document.getElementById(`co-${first}`)?.focus(); return }

    const box = boxes.find((b) => b.id === f.box)
    const msg = [
      'Merhaba, toplu / kurumsal sipariş için teklif almak istiyorum.',
      '',
      `Ad Soyad / Firma: ${f.name.trim()}`,
      `Telefon: ${f.phone.trim()}`,
      `Ne için: ${OCCASION_TR[f.occasion]}`,
      `Yaklaşık adet: ${f.qty}`,
      `Kutu: ${box ? trText(box.name) : 'Size özel içerik'}`,
      ...(f.date ? [`İstenen teslim tarihi: ${f.date}`] : []),
      ...(f.note.trim() ? [`Not: ${f.note.trim()}`] : []),
      ...(lang !== 'tr' ? [`Müşterinin dili: ${LANGS[lang].name}`] : []),
    ].join('\n')
    openWhatsApp(WHATSAPP_NUMBER, msg)
  }

  const errFor = (k, key) => (errors[k] ? <span className="field__err" id={`co-${k}-err`}>{t(key)}</span> : null)
  const aria = (k) => (errors[k] ? { 'aria-invalid': 'true', 'aria-describedby': `co-${k}-err` } : {})

  return (
    <Page id="kurumsal" title1={t('co.title1')} title2={t('co.title2')} desc={t('co.desc')}>
      <form className="lookup lookup--wide" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="co-name">{t('co.name')}</label>
          <input id="co-name" autoComplete="organization" value={f.name} onChange={set('name')} {...aria('name')} />
          {errFor('name', 'err.name')}
        </div>
        <div className="field">
          <label htmlFor="co-phone">{t('cart.phone')}</label>
          <input id="co-phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" value={f.phone} onChange={set('phone')} {...aria('phone')} />
          {errFor('phone', 'err.phone')}
        </div>

        <fieldset className="pay chips">
          <legend>{t('co.occasion')}</legend>
          {OCCASIONS.map((o) => (
            <label key={o} className={f.occasion === o ? 'is-on' : ''}>
              <input type="radio" name="occasion" value={o} checked={f.occasion === o} onChange={set('occasion')} />
              {t(`co.occ.${o}`)}
            </label>
          ))}
        </fieldset>

        <div className="field-row">
          <div className="field">
            <label htmlFor="co-qty">{t('co.qty')}</label>
            <input id="co-qty" type="number" min="1" inputMode="numeric" dir="ltr" value={f.qty} onChange={set('qty')} {...aria('qty')} />
            {errFor('qty', 'err.required')}
          </div>
          <label className="field" htmlFor="co-date">
            {t('co.date')}
            <input id="co-date" type="date" dir="ltr" value={f.date} onChange={set('date')} />
          </label>
        </div>

        <fieldset className="pay chips">
          <legend>{t('co.box')}</legend>
          {[...boxes.map((b) => ({ id: b.id, label: pick(b.name) })), { id: 'custom', label: t('co.boxCustom') }].map((b) => (
            <label key={b.id} className={f.box === b.id ? 'is-on' : ''}>
              <input type="radio" name="box" value={b.id} checked={f.box === b.id} onChange={set('box')} />
              {b.label}
            </label>
          ))}
        </fieldset>

        <label className="field" htmlFor="co-note">
          {t('cart.note')}
          <textarea id="co-note" value={f.note} onChange={set('note')} />
        </label>

        <p className="cart__privacy">{t('cart.privacy')}</p>
        <button type="submit" className="btn btn--ink lookup__go"><WhatsApp /> {t('co.send')}</button>
      </form>
    </Page>
  )
}
