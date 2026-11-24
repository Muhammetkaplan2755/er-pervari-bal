/* WhatsApp ile verilen siparişin kaydı: müşteri WhatsApp'ı açarken tarayıcı
   siparişi buraya da yollar. Panelde "WhatsApp — onay bekliyor" görünür;
   müşteri mesajı gönderip ödeme netleşince dükkân "Onaylandı" yapar.
   Kötüye kullanıma karşı: honeypot alanı, IP başına 10 dakikada 3 sipariş. */
import { cleanBuyer, clientIp, json, orderItems, priceOrder, sameSiteJson } from './catalog-live.js'
import { db, dbEnabled } from './db.js'
import { notifyOrder } from './whatsapp.js'

const ID = /^EPW[A-Z0-9]{8,16}$/
const METHODS = new Set(['havale', 'kapida'])

export async function recordWhatsAppOrder(request, ctx = {}) {
  if (request.method !== 'POST') return json(405, { error: 'method' })
  if (!dbEnabled()) return json(202, { skipped: true })
  const blocked = sameSiteJson(request)
  if (blocked) return blocked
  let data
  try { data = await request.json() } catch { return json(400, { error: 'json' }) }
  if (data?.website) return json(202, { ok: true }) // bot: sessizce yok say
  if (data?.consent !== true) return json(400, { error: 'consent' })

  const id = String(data?.id ?? '')
  if (!ID.test(id)) return json(400, { error: 'id' })
  const order = await priceOrder(data?.items)
  if (!order) return json(400, { error: 'cart' })
  const { buyer, errors } = cleanBuyer(data?.buyer)
  if (errors.length) return json(400, { error: 'buyer', fields: errors })

  const ip = clientIp(request, ctx)
  try {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const recent = await db.recentOrdersFromIp(ip, since)
    if ((recent?.length ?? 0) >= 3) return json(429, { error: 'rate' })

    const row = {
      id,
      channel: 'whatsapp',
      status: 'beklemede',
      payment_method: METHODS.has(data?.payment) ? data.payment : 'havale',
      customer: { ...buyer, repeat: String(data?.repeat ?? 'yok').slice(0, 20) },
      // Onay kanıtı: zaman ve onaylanan yasal metin sürümü.
      consent_at: new Date().toISOString(),
      legal_version: String(data?.legalVersion ?? '').slice(0, 20),
      items: orderItems(order),
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      ip,
    }
    await db.insertOrder(row)
    // Bildirim tavanı: tüm siteden 10 dakikada 15'ten fazla WhatsApp siparişi gelirse
    // (saldırı ihtimali) kayıt yine yapılır ama mesaj atılmaz; panelden görülür.
    const burst = await db.recentOrders(since, 'whatsapp')
    if ((burst?.length ?? 0) <= 15) await notifyOrder(row)
    else console.error('bildirim tavanı aşıldı, mesaj gönderilmedi', id)
    return json(201, { ok: true })
  } catch (e) {
    if (String(e.message).includes(' 409')) return json(409, { error: 'duplicate' })
    console.error('whatsapp siparişi', e.message)
    return json(502, { error: 'db' })
  }
}
