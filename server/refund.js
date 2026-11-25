/* Panelden kart iadesi / iptali (yalnızca yönetici, server/admin.js üzerinden).
   - Tam tutar ve sipariş bugün alındıysa önce İPTAL denenir (/payment/cancel): ödeme
     henüz hesaba aktarılmadan geri çevrilir, müşteri kartında hiç görünmeyebilir.
   - İptal olmazsa ya da kısmi tutarsa İADE (/v2/payment/refund, ödeme numarası + tutar).
   - Toplam iade sipariş tutarına ulaşınca durum "iade" olur; veritabanı tetikleyicisi stoğu geri ekler.
   Para hareketi geri alınamaz: panel onay ister; burada tutar ve durum ayrıca doğrulanır. */
import { randomBytes } from 'node:crypto'
import { db } from './db.js'
import { iyzico } from './payment.js'

const PAID = new Set(['odendi', 'kargolandi', 'teslim_edildi'])
const round = (n) => Math.round(n * 100) / 100
const price = (n) => String(round(n))
const istanbulDay = (d) => new Date(new Date(d).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10)

export async function refundOrder(orderId, amountIn, { ip = '127.0.0.1', now = new Date() } = {}) {
  const order = await db.getOrder(String(orderId ?? '').slice(0, 40))
  if (!order) return { ok: false, error: 'Sipariş bulunamadı.' }
  if (order.channel !== 'kart' || !order.provider_payment_id) return { ok: false, error: 'Bu sipariş kartla ödenmemiş; iade elle yapılır (havale/kapıda).' }
  if (!PAID.has(order.status)) return { ok: false, error: `Bu durumdaki sipariş iade edilemez: ${order.status}.` }

  const total = Number(order.total)
  const already = Number(order.refunded) || 0
  const left = round(total - already)
  const amount = amountIn === undefined || amountIn === null || amountIn === '' ? left : round(Number(amountIn))
  if (!(amount > 0)) return { ok: false, error: 'İade tutarı 0’dan büyük olmalı.' }
  if (amount > left + 0.001) return { ok: false, error: `En fazla ${left} TL iade edilebilir.` }

  const conversationId = `RF${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`
  const base = { locale: 'tr', conversationId, paymentId: String(order.provider_payment_id), ip }
  let method = 'refund'
  let r = null

  // Aynı gün ve tamamı iade ediliyorsa önce iptal.
  if (already === 0 && amount === total && istanbulDay(order.created_at) === istanbulDay(now)) {
    r = await iyzico('/payment/cancel', base)
    if (r?.status === 'success') method = 'cancel'
  }
  if (method !== 'cancel') {
    r = await iyzico('/v2/payment/refund', { ...base, price: price(amount), currency: 'TRY' })
    if (r?.status !== 'success') {
      console.error('iyzico iade', order.id, r?.errorCode, r?.errorMessage)
      return { ok: false, error: `iyzico iadeyi kabul etmedi: ${r?.errorMessage ?? r?.errorCode ?? 'bilinmeyen hata'}` }
    }
  }

  const refunded = round(already + amount)
  const full = refunded >= total - 0.001
  const stamp = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(now)
  const note = `${method === 'cancel' ? 'İptal' : 'İade'} ${amount} TL (${stamp}, iyzico ${conversationId})`
  const saved = await db.updateOrder(order.id, {
    refunded,
    ...(full ? { status: 'iade' } : {}),
    admin_note: [order.admin_note, note].filter(Boolean).join(' · ').slice(0, 1000),
  })
  return { ok: true, method, amount, refunded, full, order: saved }
}
