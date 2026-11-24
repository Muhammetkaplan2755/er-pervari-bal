/* Sunucuda fiyat hesabı için ürün listesi: panel kuruluysa veritabanından
   (az önce değişen fiyat da dahil), değilse build'deki src/data/products.js. */
import { catalog, shippingFor, trText } from '../src/data/catalog.js'
import { db, dbEnabled } from './db.js'

export async function liveProducts() {
  if (!dbEnabled()) return catalog
  try {
    const rows = await db.activeProducts()
    return rows?.length ? rows : catalog
  } catch (e) {
    console.error('ürünler veritabanından okunamadı, build listesi kullanılıyor', e.message)
    return catalog
  }
}

/* Tarayıcıdan yalnızca id ve adet gelir; fiyatlar buradan. */
export async function priceOrder(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return null
  const list = await liveProducts()
  const lines = []
  for (const it of items) {
    const product = list.find((p) => p.id === String(it?.id ?? ''))
    const variant = product?.variants.find((v) => v.id === String(it?.variant ?? ''))
    const qty = Number(it?.qty)
    if (!product || !variant || product.stock === 'out' || !Number.isInteger(qty) || qty < 1 || qty > 99) return null
    lines.push({ product, variant, qty, total: Number(variant.price) * qty })
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const shipping = shippingFor(subtotal)
  return { lines, subtotal, shipping, total: subtotal + shipping }
}

/* Veritabanına yazılan sipariş kalemleri (Türkçe adlarla, rapor için). */
export const orderItems = (order) => order.lines.map((l) => ({
  product_id: l.product.id,
  variant_id: l.variant.id,
  name: trText(l.product.name),
  label: trText(l.variant.label),
  qty: l.qty,
  unit_price: Number(l.variant.price),
  total: l.total,
}))

export function cleanBuyer(b = {}, { needEmail = false } = {}) {
  const s = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
  const buyer = {
    name: s(b.name, 80),
    phone: String(b.phone ?? '').replace(/\D/g, '').slice(0, 15),
    email: s(b.email, 120),
    address: s(b.address, 300),
    city: s(b.city, 60),
    district: s(b.district, 60),
    note: s(b.note, 500),
  }
  const errors = []
  if (buyer.name.length < 3) errors.push('name')
  if (buyer.phone.length < 10) errors.push('phone')
  if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) errors.push('email')
  if (buyer.address.length < 10) errors.push('address')
  if (!buyer.city) errors.push('city')
  if (!buyer.district) errors.push('district')
  return { buyer, errors }
}

/* Ziyaretçi IP'si — yalnızca platformun kendisinin koyduğu değere güvenilir:
   Netlify: fonksiyona verilen context.ip (adaptör ctx.ip olarak geçirir).
   Vercel: x-real-ip (Vercel istemcinin gönderdiğini ezer).
   Yerel geliştirme: bağlantı adresi yok, x-forwarded-for ya da 127.0.0.1.
   IPv6 adresleri /64'e indirilir (tek bağlantı çok adres kullanabilir). */
export function clientIp(request, ctx = {}) {
  let ip = ctx.ip
  if (!ip && typeof process !== 'undefined' && process.env.VERCEL) ip = request.headers.get('x-real-ip')
  if (!ip && typeof process !== 'undefined' && !process.env.NETLIFY && !process.env.VERCEL) ip = (request.headers.get('x-forwarded-for') || '').split(',')[0]
  ip = String(ip || '127.0.0.1').trim()
  if (ip.includes(':')) ip = ip.split(':').slice(0, 4).join(':') + '::/64'
  return ip.slice(0, 64)
}

/* Tarayıcıdan gelen siparişler için CSRF koruması: başka bir site ziyaretçinin
   tarayıcısından "basit istek" (text/plain form) gönderemesin. JSON içerik türü
   tarayıcıda ön kontrol (preflight) ister ve CORS izni vermediğimiz için engellenir;
   Origin başlığı varsa sitenin kendisi olmalı. */
export function sameSiteJson(request) {
  const type = request.headers.get('content-type') || ''
  if (!type.toLowerCase().startsWith('application/json')) return json(415, { error: 'content-type' })
  const origin = request.headers.get('origin')
  if (origin) {
    const allowed = new Set([new URL(request.url).origin])
    const fixed = typeof process !== 'undefined' ? process.env.PUBLIC_ORIGIN : ''
    if (fixed) allowed.add(fixed.replace(/\/$/, ''))
    if (!allowed.has(origin)) return json(403, { error: 'origin' })
  }
  return null
}

export const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
