import { useI18n } from '../i18n/I18nContext.jsx'
import { useDocumentMeta } from '../meta.js'
import Page from './Page.jsx'

export default function NotFound({ message }) {
  const { t } = useI18n()
  useDocumentMeta(`${t('nf.title1')} ${t('nf.title2')} — Er Pervari Bal`, '')
  return (
    <Page id="nf" title1={t('nf.title1')} title2={t('nf.title2')} desc={message ?? t('nf.desc')}>
      <a className="btn btn--ink page__cta" href="/#siparis">{t('cart.toList')}</a>
    </Page>
  )
}
