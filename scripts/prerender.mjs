/* Runs after `vite build`. The app renders in the browser, so this writes what crawlers and
   feeds need without a server:
   - dist/<route>/index.html for every page and product, with its own <title>, description,
     canonical URL and (for products) Product + BreadcrumbList JSON-LD
   - dist/404.html, dist/sitemap.xml, robots.txt Sitemap line (when SITE_URL is known)
   - dist/feeds/google-merchant.xml (RSS 2.0 + g: namespace) and dist/feeds/meta-catalog.csv */
import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CATEGORIES, SHIPPING, catalog } from '../src/data/catalog.js'
import { AVAILABILITY, productInfo } from '../src/data/productInfo.js'
import { BRAND, SITE_URL as SITE_FROM_FILE } from '../src/data/site.js'
import { S } from '../src/i18n/strings.js'
import { guides } from '../src/data/guides.js'
import { imagePath, photosOf } from '../src/components/productPhotos.js'
import { SELLER, legalDocs } from '../src/data/legal.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const SITE = (process.env.SITE_URL || SITE_FROM_FILE || '').replace(/\/$/, '')
const BASE = SITE || 'https://ALAN-ADI'
const abs = (path) => `${BASE}${path}`

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const tr = (v) => (v && typeof v === 'object' ? v.tr : v)
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

const template = readFileSync(join(dist, 'index.html'), 'utf8')

/* Body HTML from the SSR bundle (vite build --ssr src/entry-server.jsx), so
   every page paints its content before the JS arrives; main.jsx hydrates it. */
const { render } = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href)
const withBody = (path, html) => html.replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)

function page({ path, title, description, image = '/images/dukkan.jpg', extraHead = '' }) {
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(/^https?:/.test(image) || !SITE ? image : abs(image))}$2`)
  if (SITE) {
    html = html.replace(/<!-- Alan adı belli olunca:[\s\S]*?-->/, `<link rel="canonical" href="${esc(abs(path))}" />\n    <meta property="og:url" content="${esc(abs(path))}" />`)
    html = html.replace('"image": "/images/dukkan.jpg"', `"image": "${abs('/images/dukkan.jpg')}", "url": "${SITE}/"`)
  }
  return html.replace('</head>', `${extraHead}\n  </head>`)
}

function write(path, html) {
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, withBody(path, html))
}

const routes = []

/* ---------- home and content pages ---------- */
const metaDesc = S['meta.description'].tr
write('/', page({ path: '/', title: S['meta.title'].tr, description: metaDesc }))
routes.push('/')

const pages = [
  ['/tarifler', `${S['rec.title1'].tr} ${S['rec.title2'].tr}`, S['rec.desc'].tr],
  ['/gunluk', `${S['jr.title1'].tr} ${S['jr.title2'].tr}`, S['jr.desc'].tr],
  ['/parti', `${S['bt.title1'].tr} ${S['bt.title2'].tr}`, S['bt.desc'].tr],
  ['/takip', `${S['tk.title1'].tr} ${S['tk.title2'].tr}`, S['tk.desc'].tr],
  ['/kurumsal', `${S['co.title1'].tr} ${S['co.title2'].tr}`, S['co.desc'].tr],
]
for (const [path, title, description] of pages) {
  write(path, page({ path, title: `${title} — ${BRAND}`, description }))
  routes.push(path)
}

/* ---------- rehber (guide articles) ---------- */
write('/rehber', page({ path: '/rehber', title: `${S['gd.title1'].tr} ${S['gd.title2'].tr} — ${BRAND}`, description: S['gd.desc'].tr }))
routes.push('/rehber')
for (const g of guides) {
  const path = `/rehber/${g.slug}`
  const image = `/images/${g.img}.jpg`
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.description,
    inLanguage: 'tr',
    datePublished: g.date,
    dateModified: g.date,
    image: SITE ? abs(image) : image,
    author: { '@type': 'Organization', name: BRAND },
    publisher: { '@type': 'Organization', name: BRAND },
    ...(SITE ? { mainEntityOfPage: abs(path) } : {}),
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE ? `${SITE}/` : '/' },
      { '@type': 'ListItem', position: 2, name: 'Bal rehberi', item: SITE ? `${SITE}/rehber` : '/rehber' },
      { '@type': 'ListItem', position: 3, name: g.title },
    ],
  }
  write(path, page({
    path,
    title: `${g.title} — ${BRAND}`,
    description: g.description,
    image,
    extraHead: `    ${jsonLd(article)}
    ${jsonLd(crumbs)}`,
  }).replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="article" />'))
  routes.push(path)
}

/* ---------- yasal (legal texts) and payment result ---------- */
write('/yasal', page({ path: '/yasal', title: `${S['lg.title1'].tr} ${S['lg.title2'].tr} — ${BRAND}`, description: S['lg.desc'].tr }))
routes.push('/yasal')
for (const d of legalDocs) {
  const path = `/yasal/${d.slug}`
  write(path, page({ path, title: `${d.title} — ${BRAND}`, description: d.description }))
  routes.push(path)
}
// After iyzico: personal result page, not for search engines (and not in the sitemap).
write('/odeme', page({ path: '/odeme', title: `${S['pay.okEyebrow'].tr} — ${BRAND}`, description: S['pay.okDesc'].tr })
  .replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex" />'))

// Yönetici paneli: tarayıcıda çalışır, arama motorlarına kapalı.
write('/yonetim', page({ path: '/yonetim', title: `Yönetim — ${BRAND}`, description: '' })
  .replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, nofollow" />'))

/* ---------- products ---------- */
const shippingDetails = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: SHIPPING.fee, currency: 'TRY' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'TR' },
}

for (const p of catalog) {
  const info = productInfo[p.id] ?? { images: [] }
  const path = `/urun/${p.id}`
  const name = tr(p.name)
  const description = tr(info.desc ?? p.note)
  const shots = photosOf(p, info)
  const toAbs = (img) => { const path = imagePath(img); return path.startsWith('/') && SITE ? abs(path) : path }
  const images = shots.list.map(toAbs)
  const low = Math.min(...p.variants.map((v) => v.price))
  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    sku: p.id,
    brand: { '@type': 'Brand', name: BRAND },
    ...(images.length ? { image: images } : {}),
    offers: p.variants.map((v) => ({
      '@type': 'Offer',
      sku: `${p.id}-${v.id}`,
      name: `${name} ${tr(v.label)}`,
      price: v.price,
      priceCurrency: 'TRY',
      availability: AVAILABILITY[p.stock].schema,
      itemCondition: 'https://schema.org/NewCondition',
      url: SITE ? abs(p.variants.length > 1 ? `${path}?boyut=${v.id}` : path) : path,
      shippingDetails,
    })),
  }
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE ? `${SITE}/` : '/' },
      { '@type': 'ListItem', position: 2, name: 'Sipariş', item: SITE ? `${SITE}/#siparis` : '/#siparis' },
      { '@type': 'ListItem', position: 3, name },
    ],
  }
  write(path, page({
    path,
    title: `${name} — ${BRAND}`,
    description: `${description} ${low.toLocaleString('tr-TR')} TL'den başlayan fiyatlarla, WhatsApp'tan sipariş.`,
    image: shots.list[0] ? imagePath(shots.list[0]) : undefined,
    extraHead: `    ${jsonLd(product)}\n    ${jsonLd(crumbs)}`,
  }))
  routes.push(path)
}

/* ---------- 404, sitemap, robots ---------- */
writeFileSync(join(dist, '404.html'), withBody('/bulunamadi', page({ path: '/404', title: `${S['nf.title1'].tr} ${S['nf.title2'].tr} — ${BRAND}`, description: S['nf.desc'].tr }))
  .replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex" />'))

if (SITE) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes.map((r) => `  <url><loc>${esc(abs(r))}</loc><lastmod>${today}</lastmod></url>`).join('\n')
  writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  appendFileSync(join(dist, 'robots.txt'), `\nSitemap: ${SITE}/sitemap.xml\n`)
}

/* ---------- feeds ---------- */
const feedItems = []
const skipped = []
for (const p of catalog) {
  const info = productInfo[p.id]
  const shots = photosOf(p, info)
  if (!shots.real || !shots.list.length) { skipped.push(p.id); continue }
  const toAbs = (img) => { const path = imagePath(img); return path.startsWith('/') ? abs(path) : path }
  const cat = CATEGORIES.find((c) => c.id === p.category)
  for (const v of p.variants) {
    feedItems.push({
      id: `${p.id}-${v.id}`,
      group: p.variants.length > 1 ? p.id : '',
      title: `${tr(p.name)} ${tr(v.label)}`.slice(0, 150),
      description: tr(info?.desc ?? p.note),
      link: abs(p.variants.length > 1 ? `/urun/${p.id}?boyut=${v.id}` : `/urun/${p.id}`),
      image: toAbs(shots.list[0]),
      extraImages: shots.list.slice(1).map(toAbs),
      availability: AVAILABILITY[p.stock].feed,
      price: `${v.price.toFixed(2)} TRY`,
      size: tr(v.label),
      type: tr(cat?.tr ? cat : p.category),
    })
  }
}

const placeholderNote = SITE ? '' : '\n<!-- UYARI: SITE_URL ayarlanmadı; adreslerdeki "ALAN-ADI" gerçek alan adıyla değişmeden bu feed kullanılamaz. -->'
const gItems = feedItems.map((i) => `    <item>
      <g:id>${esc(i.id)}</g:id>
      <title>${esc(i.title)}</title>
      <description>${esc(i.description)}</description>
      <link>${esc(i.link)}</link>
      <g:image_link>${esc(i.image)}</g:image_link>
${i.extraImages.map((x) => `      <g:additional_image_link>${esc(x)}</g:additional_image_link>\n`).join('')}      <g:availability>${i.availability}</g:availability>
      <g:price>${i.price}</g:price>
      <g:brand>${esc(BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
${i.group ? `      <g:item_group_id>${esc(i.group)}</g:item_group_id>\n` : ''}      <g:size>${esc(i.size)}</g:size>
      <g:product_type>${esc(i.type)}</g:product_type>
      <g:shipping>
        <g:country>TR</g:country>
        <g:price>${SHIPPING.fee.toFixed(2)} TRY</g:price>
      </g:shipping>
    </item>`).join('\n')

mkdirSync(join(dist, 'feeds'), { recursive: true })
writeFileSync(join(dist, 'feeds', 'google-merchant.xml'), `<?xml version="1.0" encoding="UTF-8"?>${placeholderNote}
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(BRAND)}</title>
    <link>${esc(BASE)}/</link>
    <description>${esc(metaDesc)}</description>
${gItems}
  </channel>
</rss>
`)

const META_AVAIL = { in_stock: 'in stock', out_of_stock: 'out of stock', preorder: 'preorder' }
const csv = (v) => `"${String(v).replace(/"/g, '""')}"`
const metaRows = [
  ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'additional_image_link', 'brand', 'item_group_id', 'size', 'product_type'],
  ...feedItems.map((i) => [i.id, i.title, i.description, META_AVAIL[i.availability], 'new', i.price, i.link, i.image, i.extraImages.join(','), BRAND, i.group, i.size, i.type]),
]
writeFileSync(join(dist, 'feeds', 'meta-catalog.csv'), '\uFEFF' + metaRows.map((r) => r.map(csv).join(',')).join('\n') + '\n')

const missingSeller = Object.entries(SELLER).filter(([, v]) => String(v).includes('[TEYİT')).map(([k]) => k)
if (missingSeller.length) console.warn(`UYARI: yasal satıcı bilgileri eksik (src/data/legal.js SELLER): ${missingSeller.join(', ')} — canlı satıştan önce doldurun.`)
console.log(`prerender: ${routes.length} sayfa, 404.html${SITE ? ', sitemap.xml' : ''}`)
console.log(`feeds: ${feedItems.length} ürün satırı → dist/feeds/google-merchant.xml, dist/feeds/meta-catalog.csv`)
if (skipped.length) console.log(`feeds: ürün fotoğrafı olmadığı için dışarıda kalanlar: ${skipped.join(', ')}`)
if (!SITE) console.warn('UYARI: SITE_URL boş — canonical ve sitemap yazılmadı, feed adresleri "ALAN-ADI" içeriyor. src/data/site.js')
