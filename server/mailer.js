/* Sipariş onay e-postası — Brevo (sunucuları AB'de: Fransa/Almanya).
   Kartla ödenen her siparişte müşteriye gider ve şunları içerir:
   sipariş özeti + siparişe özel ön bilgilendirme + mesafeli satış sözleşmesi.
   Mesafeli Sözleşmeler Yönetmeliği: sözleşme en geç teslimata kadar "kalıcı veri
   saklayıcısıyla" (e-posta bunlardan biri) tüketiciye gönderilmelidir.

   Ortam değişkenleri:
     BREVO_API_KEY    Brevo → SMTP & API → API Keys (GİZLİ; xkeysib- ile başlar)
     MAIL_FROM        Brevo'da doğrulanmış gönderici adresi (örn. siparis@alanadi.com)
     MAIL_FROM_NAME   isteğe bağlı, varsayılan "Er Pervari Bal"
     MAIL_REPLY_TO    isteğe bağlı, müşterinin yanıtlayacağı adres
   Tanımlı değilse e-posta gönderilmez, sipariş akışı etkilenmez. */
import { LEGAL_UPDATED, SELLER, legalBySlug } from '../src/data/legal.js'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)
export const mailEnabled = () => Boolean(env('BREVO_API_KEY') && env('MAIL_FROM'))

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
const money = (n) => tl.format(Number(n) || 0)
const dateTr = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' })

function docHtml(slug) {
  const doc = legalBySlug(slug)
  if (!doc) return ''
  const sections = doc.sections.map((s) => [
    `<h3 style="font-size:15px;margin:18px 0 6px">${esc(s.h)}</h3>`,
    ...(s.p ?? []).map((p) => `<p style="margin:0 0 8px">${esc(p)}</p>`),
    s.list ? `<ul style="margin:0 0 8px;padding-left:18px">${s.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : '',
    s.after ? `<p style="margin:0 0 8px">${esc(s.after)}</p>` : '',
  ].join('')).join('')
  return `<h2 style="font-size:18px;margin:28px 0 4px">${esc(doc.title)}</h2>${sections}`
}

/* E-postanın HTML'i: sade, tablo tabanlı (e-posta istemcileri modern CSS'i desteklemez). */
export function orderEmailHtml(order) {
  const c = order.customer ?? {}
  const rows = (order.items ?? []).map((i) =>
    `<tr><td style="padding:6px 0">${esc(i.qty)} × ${esc(i.name)} ${esc(i.label)}</td><td style="padding:6px 0;text-align:right">${money(i.total)}</td></tr>`).join('')
  const when = order.consent_at ? dateTr.format(new Date(order.consent_at)) : dateTr.format(new Date())
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#1d1306">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffdf9;border-radius:12px;padding:28px">
<tr><td>
<p style="font-size:13px;color:#6e5c46;margin:0">${esc(SELLER.brand)}</p>
<h1 style="font-size:22px;margin:6px 0 4px">Siparişiniz alındı</h1>
<p style="margin:0 0 16px;color:#4f3f2c">Sipariş no: <strong>${esc(order.id)}</strong> · ${esc(when)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #e6dccb;border-bottom:1px solid #e6dccb">
${rows}
<tr><td style="padding:6px 0;color:#4f3f2c">Kargo</td><td style="padding:6px 0;text-align:right">${Number(order.shipping) ? money(order.shipping) : 'Ücretsiz'}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Toplam (KDV dahil)</td><td style="padding:8px 0;text-align:right;font-weight:bold">${money(order.total)}</td></tr>
</table>
<p style="font-size:14px;margin:16px 0 4px"><strong>Teslimat:</strong> ${esc(c.name)}, ${esc(c.address)}, ${esc(c.district)} / ${esc(c.city)}</p>
<p style="font-size:14px;margin:0 0 4px"><strong>Ödeme:</strong> Kredi / banka kartı (iyzico)</p>
<p style="font-size:14px;margin:0 0 16px"><strong>Kargoya veriliş:</strong> ${esc(SELLER.shipWithin)}; en geç 30 gün. Kargo takip numarası ayrıca iletilir.</p>
<p style="font-size:13px;color:#4f3f2c;margin:0 0 4px">Aşağıda, ödeme öncesi onayladığınız ön bilgilendirme formu ve mesafeli satış sözleşmesinin (sürüm ${esc(LEGAL_UPDATED)}) tam metni yer almaktadır. Lütfen bu e-postayı saklayın.</p>
<div style="font-size:13px;line-height:1.55;color:#33281a">
${docHtml('on-bilgilendirme-formu')}
${docHtml('mesafeli-satis-sozlesmesi')}
</div>
<p style="font-size:12px;color:#6e5c46;margin:24px 0 0">${esc(SELLER.title)} · ${esc(SELLER.address)} · ${esc(SELLER.phone)} · ${esc(SELLER.email)}</p>
</td></tr></table></td></tr></table></body></html>`
}

/* Hiç hata fırlatmaz: e-posta gitmese de sipariş akışı sürer; sonuç kayda geçer. */
async function send(order, subject, html, tag) {
  const to = order?.customer?.email
  if (!mailEnabled()) return { sent: false, skipped: 'e-posta ayarı yok' }
  if (!to) return { sent: false, skipped: 'müşteri e-postası yok' }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env('BREVO_API_KEY'), 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: env('MAIL_FROM_NAME') || SELLER.brand, email: env('MAIL_FROM') },
        to: [{ email: to, name: order.customer.name || undefined }],
        ...(env('MAIL_REPLY_TO') ? { replyTo: { email: env('MAIL_REPLY_TO') } } : {}),
        subject,
        htmlContent: html,
        tags: [tag],
      }),
    })
    if (!res.ok) throw new Error(`brevo ${res.status}: ${(await res.text()).slice(0, 200)}`)
    return { sent: true }
  } catch (e) {
    console.error(`${tag} e-postası gönderilemedi`, order.id, e.message)
    return { sent: false, error: e.message }
  }
}

export const sendOrderEmail = (order) => send(order, `Siparişiniz alındı — ${order.id}`, orderEmailHtml(order), 'siparis-onay')

export function shippingEmailHtml(order, { url, carrier, code }) {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#1d1306">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fffdf9;border-radius:12px;padding:28px"><tr><td>
<p style="font-size:13px;color:#6e5c46;margin:0">${esc(SELLER.brand)}</p>
<h1 style="font-size:22px;margin:6px 0 8px">Siparişiniz kargoya verildi</h1>
<p style="margin:0 0 16px;color:#4f3f2c">Sipariş no: <strong>${esc(order.id)}</strong></p>
<p style="font-size:15px;margin:0 0 6px">${esc(carrier)} · Takip no: <strong>${esc(code)}</strong></p>
<p style="margin:16px 0"><a href="${esc(url)}" style="display:inline-block;background:#1d1306;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px">Kargonu takip et</a></p>
<p style="font-size:12px;color:#6e5c46;margin:24px 0 0">${esc(SELLER.title)} · ${esc(SELLER.address)} · ${esc(SELLER.phone)}</p>
</td></tr></table></td></tr></table></body></html>`
}

export const sendShippingEmail = (order, info) =>
  send(order, `Siparişiniz kargoda — ${order.id}`, shippingEmailHtml(order, info), 'kargo')
