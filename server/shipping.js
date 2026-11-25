/* Kargoya verme (yalnızca yönetici, server/admin.js "kargo" işlemi).
   Kargo firması + takip numarası girilince sipariş "kargoda" olur, takip bağlantısı
   üretilir ve müşterinin e-postası varsa (Brevo ayarlıysa) kargo e-postası gider.
   WhatsApp bildirimi dükkânın kendi WhatsApp'ından, panelde açılan hazır mesajla yapılır. */
import { CARRIERS } from '../src/data/catalog.js'
import { db } from './db.js'
import { sendShippingEmail } from './mailer.js'

const SHIPPABLE = new Set(['odendi', 'onaylandi', 'kargolandi'])
const CODE = /^[A-Za-z0-9-]{4,40}$/

export const trackingUrl = (carrierId, code) => {
  const c = CARRIERS.find((x) => x.id === carrierId)
  return c ? c.url.replace('{kod}', encodeURIComponent(code)) : ''
}

export async function markShipped(orderId, carrierId, codeIn) {
  const code = String(codeIn ?? '').replace(/\s+/g, '')
  if (!CARRIERS.some((c) => c.id === carrierId)) return { ok: false, error: 'Kargo firması seçin.' }
  if (!CODE.test(code)) return { ok: false, error: 'Takip numarası 4–40 harf/rakam olmalı.' }
  const order = await db.getOrder(String(orderId ?? '').slice(0, 40))
  if (!order) return { ok: false, error: 'Sipariş bulunamadı.' }
  if (!SHIPPABLE.has(order.status)) return { ok: false, error: `Bu durumdaki sipariş kargoya verilemez: ${order.status}.` }

  const saved = await db.updateOrder(order.id, { status: 'kargolandi', carrier: carrierId, tracking_code: code })
  const url = trackingUrl(carrierId, code)
  const mail = await sendShippingEmail(saved ?? order, { url, carrier: CARRIERS.find((c) => c.id === carrierId).name, code })
  return { ok: true, order: saved, url, mail }
}
