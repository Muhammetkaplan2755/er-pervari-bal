import { useState } from 'react'
import { CARRIERS, WHATSAPP_NUMBER } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import Page from './Page.jsx'

export default function Tracking() {
  const { t } = useI18n()
  const [carrier, setCarrier] = useState(CARRIERS[0].id)
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    const clean = code.replace(/\s/g, '')
    if (!clean) { setError(true); return }
    const c = CARRIERS.find((x) => x.id === carrier)
    // Plain open so a blocked popup is detectable (noopener always returns null); then fall back.
    const url = c.url.replace('{kod}', encodeURIComponent(clean))
    const win = window.open(url, '_blank')
    if (win) win.opener = null
    else window.location.href = url
  }

  return (
    <Page id="takip" title1={t('tk.title1')} title2={t('tk.title2')} desc={t('tk.desc')}>
      <form className="lookup" onSubmit={onSubmit} noValidate>
        <fieldset className="pay chips lookup__carriers">
          <legend>{t('tk.carrier')}</legend>
          {CARRIERS.map((c) => (
            <label key={c.id} className={carrier === c.id ? 'is-on' : ''}>
              <input type="radio" name="carrier" value={c.id} checked={carrier === c.id} onChange={() => setCarrier(c.id)} />
              {c.name}
            </label>
          ))}
        </fieldset>
        <div className="field">
          <label htmlFor="tk-code">{t('tk.code')}</label>
          <input
            id="tk-code"
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            value={code}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'tk-err' : undefined}
            onChange={(e) => { setCode(e.target.value); setError(false) }}
          />
          {error && <span className="field__err" id="tk-err">{t('err.required')}</span>}
        </div>
        <button type="submit" className="btn btn--ink lookup__go">{t('tk.submit')}</button>
      </form>
      <p className="page__help">
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">{t('tk.help')}</a>
      </p>
    </Page>
  )
}
