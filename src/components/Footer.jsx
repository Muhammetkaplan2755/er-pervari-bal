import { SELLER } from '../data/legal.js'
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../data/catalog.js'
import { useI18n } from '../i18n/I18nContext.jsx'
import { pageHref } from '../router.js'
import { Logo, SHOP } from './icons.jsx'
import './Sections.css'

export default function Footer() {
  const { t } = useI18n()

  const cols = [
    {
      title: t('foot.shop'),
      links: [
        [t('nav.shop'), '/#siparis'],
        [t('foot.gifts'), '/#hediye'],
        [t('co.title1'), pageHref('kurumsal')],
        [t('tk.title1') + ' ' + t('tk.title2'), pageHref('takip')],
      ],
    },
    {
      title: t('foot.info'),
      links: [
        [t('nav.karakovan'), '/#karakovan'],
        [t('nav.recipes'), pageHref('tarifler')],
        [t('nav.journal'), pageHref('gunluk')],
        [t('gd.title1') + ' ' + t('gd.title2'), pageHref('rehber')],
        [t('bt.title1') + ' ' + t('bt.title2'), pageHref('parti')],
        [t('nav.faq'), '/#sss'],
      ],
    },
    {
      title: t('foot.legal'),
      links: [
        ['Mesafeli satış sözleşmesi', pageHref('yasal', 'mesafeli-satis-sozlesmesi')],
        ['İade ve cayma', pageHref('yasal', 'iade-ve-cayma')],
        ['KVKK aydınlatma metni', pageHref('yasal', 'kvkk-aydinlatma-metni')],
        ['Gizlilik ve çerezler', pageHref('yasal', 'gizlilik-ve-cerez')],
      ],
    },
  ]

  return (
    <footer className="footer theme-light">
      <div className="footer__brand-col">
        <span className="footer__brand"><Logo /> Er Pervari Bal</span>
        <p>{t('foot.tagline')}</p>
        <address lang="tr">Bakırcılar Çarşısı, No: 32A, Gaziantep</address>
        {/* Satıcı künyesi (6563 sayılı Kanun md. 3). Yalnızca doldurulmuş alanlar görünür;
            boş ([TEYİT …]) alanlar build sırasında uyarı verir (scripts/prerender.mjs). */}
        <p className="footer__legal" lang="tr">
          {[SELLER.title, SELLER.email, SELLER.taxOffice && SELLER.taxNo && `${SELLER.taxOffice} / ${SELLER.taxNo}`, SELLER.mersis && `MERSİS ${SELLER.mersis}`]
            .filter((v) => v && !String(v).includes('[TEYİT'))
            .join(' · ')}
        </p>
      </div>

      {cols.map((col) => (
        <nav key={col.title} className="footer__col" aria-label={col.title}>
          <h2>{col.title}</h2>
          <ul>
            {col.links.map(([label, href]) => <li key={href}><a href={href}>{label}</a></li>)}
          </ul>
        </nav>
      ))}

      <div className="footer__col">
        <h2>{t('foot.contact')}</h2>
        <ul>
          <li><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" dir="ltr">WhatsApp {WHATSAPP_DISPLAY}</a></li>
          <li><a href={SHOP.instagram} target="_blank" rel="noopener noreferrer" dir="ltr">Instagram {SHOP.handle}</a></li>
          <li><a href={SHOP.maps} target="_blank" rel="noopener noreferrer">{t('visit.route')}</a></li>
        </ul>
      </div>
    </footer>
  )
}
