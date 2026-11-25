/* Yarıda kalan kartlı ödemelerin eşleştirilmesi.
   Sorun: müşteri iyzico sayfasında öder ama tarayıcıyı siteye dönmeden kapatırsa
   /api/odeme-sonuc hiç çağrılmaz; para çekilmiştir, sipariş "ödeme bekliyor"da kalır.
   Çözüm: iki yedek kanal — ikisi de sonucu iyzico'ya SUNUCUDAN sorar (settleByToken):
   1) reconcilePayments(): her 15 dakikada bir, 10 dakikadan eski bekleyen siparişleri sorar.
   2) handleIyzicoWebhook(): iyzico ödeme olunca bildirim gönderir (iyzico panelinde açılırsa).
   Bildirimin içeriğine güvenilmez; yalnızca "şu token'a bak" tetikleyicisi olarak kullanılır. */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { json } from './catalog-live.js'
import { db, dbEnabled } from './db.js'
import { settleByToken } from './payment.js'

const MIN = 60 * 1000
const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)

export async function reconcilePayments(now = new Date()) {
  if (!dbEnabled()) return { skipped: 'veritabanı ayarı yok' }
  if (!env('IYZICO_API_KEY') || !env('IYZICO_SECRET_KEY')) return { skipped: 'iyzico ayarı yok' }
  const rows = await db.pendingPayments(new Date(now - 10 * MIN).toISOString(), new Date(now - 48 * 60 * MIN).toISOString())
  const summary = { checked: 0, paid: 0, failed: 0, waiting: 0 }
  for (const o of rows ?? []) {
    summary.checked += 1
    const age = now - new Date(o.created_at)
    // iyzico ödeme oturumu ~30 dakikada kapanır; 1 saatten eski ve hâlâ ödenmemişse terk edilmiştir.
    const abandon = age > 60 * MIN
    if (!o.provider_token) {
      if (abandon) {
        await db.updateOrderIf(o.id, 'odeme_bekliyor', { status: 'basarisiz', admin_note: 'Ödeme sayfası tamamlanmadı (iyzico oturum bilgisi yok).' })
        summary.failed += 1
      } else summary.waiting += 1
      continue
    }
    const r = await settleByToken(o.provider_token, { abandon, expectedOrder: o.id })
    if (r.ok) summary.paid += 1
    else if (r.reached && (abandon || r.paymentStatus === 'FAILURE')) summary.failed += 1
    else summary.waiting += 1
  }
  if (summary.paid) console.log('eşleştirme: dönüşü gelmeyen ödeme(ler) bulundu ve kaydedildi', summary.paid)
  return summary
}

/* iyzico X-IYZ-SIGNATURE-V3 (Checkout Form biçimi): HMAC-SHA256(secretKey,
   secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status), hex.
   (TEYİT) Biçim iyzico dokümanından doğrulanmalı; uyuşmazlık yalnızca kayda geçer, çünkü
   karar zaten iyzico'ya sunucudan sorularak veriliyor. */
function webhookSignatureOk(body, header) {
  if (!header) return null
  const secret = env('IYZICO_SECRET_KEY') || ''
  const data = secret + [body.iyziEventType, body.iyziPaymentId, body.token, body.paymentConversationId, body.status].map((v) => v ?? '').join('')
  const a = Buffer.from(createHmac('sha256', secret).update(data).digest('hex'))
  const b = Buffer.from(String(header).toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function handleIyzicoWebhook(request) {
  if (request.method !== 'POST') return json(405, { error: 'method' })
  let body
  try { body = await request.json() } catch { return json(400, { error: 'json' }) }
  const token = String(body?.token ?? '')
  if (!/^[A-Za-z0-9-]{8,200}$/.test(token)) return json(400, { error: 'token' })
  const sig = webhookSignatureOk(body, request.headers.get('x-iyz-signature-v3'))
  if (sig === false) console.error('iyzico bildirim imzası uyuşmadı (karar yine iyzico sorgusuyla verilecek)')
  const orderId = String(body?.paymentConversationId ?? '').slice(0, 40)
  const r = await settleByToken(token, { abandon: false, expectedOrder: orderId })
  // iyzico'ya her durumda 200: kendi kararımızı sorguyla verdik, tekrar göndermesine gerek yok.
  return json(200, { ok: r.ok })
}
