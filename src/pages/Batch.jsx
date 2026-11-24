import { useState } from 'react'
import { findBatch } from '../data/batches.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import Page from './Page.jsx'

/* Lookup for the QR code on each jar: #/parti/KOD opens straight onto that batch. */
export default function Batch({ code: initial = '' }) {
  const { t, pick } = useI18n()
  const [input, setInput] = useState(initial)
  const [query, setQuery] = useState(initial)
  const batch = query ? findBatch(query) : null

  const onSubmit = (e) => {
    e.preventDefault()
    const code = input.trim()
    if (!code) return
    setQuery(code)
    window.history.replaceState(null, '', pageHref('parti', code.toUpperCase()))
  }

  return (
    <Page id="parti" title1={t('bt.title1')} title2={t('bt.title2')} desc={t('bt.desc')}>
      <form className="lookup" onSubmit={onSubmit}>
        <label className="field" htmlFor="bt-code">
          {t('bt.label')}
          <input
            id="bt-code"
            dir="ltr"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck="false"
            placeholder="KK2026-01"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--ink lookup__go">{t('bt.submit')}</button>
      </form>

      <div aria-live="polite">
        {query && !batch && <p className="lookup__miss">{t('bt.notFound', query)}</p>}
        {batch && (
          <dl className="batch">
            <div><dt>{t('bt.label')}</dt><dd dir="ltr">{batch.code}</dd></div>
            <div><dt>{t('bt.product')}</dt><dd>{pick(batch.product)}</dd></div>
            {batch.harvest && <div><dt>{t('bt.harvest')}</dt><dd>{pick(batch.harvest)}</dd></div>}
            {batch.region && <div><dt>{t('bt.region')}</dt><dd>{pick(batch.region)}</dd></div>}
            {batch.filled && <div><dt>{t('bt.filled')}</dt><dd dir="ltr">{batch.filled}</dd></div>}
            <div className="batch__report">
              {batch.report
                ? <a className="btn btn--ghost" href={batch.report} target="_blank" rel="noopener noreferrer">{t('bt.report')}</a>
                : <p>{t('bt.noReport')}</p>}
            </div>
          </dl>
        )}
      </div>
    </Page>
  )
}
