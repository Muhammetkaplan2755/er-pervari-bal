/* Kartla ödeme — iyzico Checkout Form (hosted ödeme sayfası, 3D Secure).
   Kart bilgisi bu siteye hiç gelmez: müşteri iyzico'nun sayfasında öder,
   iyzico tarayıcıyı /api/odeme-sonuc adresine geri yollar, sonucu buradan
   iyzico'ya sorarak doğrularız.

   Ortam değişkenleri (Netlify / Vercel panelinde ya da yerelde .env.local):
     IYZICO_API_KEY, IYZICO_SECRET_KEY   iyzico panelinden (önce sandbox)
     IYZICO_BASE_URL                     varsayılan sandbox; canlıda https://api.iyzipay.com
     PUBLIC_ORIGIN                       isteğe bağlı, örn. https://www.alanadi.com
   Yönetici paneli kuruluysa (server/db.js) sipariş veritabanına yazılır, ödeme
   sonucunda iyzico komisyonu kaydedilir ve WhatsApp bildirimi gider.

   Tutar her zaman sunucuda hesaplanır; tarayıcının gönderdiği fiyata güvenilmez.
   Platform bağımsız: Request alır, Response döner (netlify/functions/*, api/* ve
   geliştirmede vite.config.js bunu çağırır). */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { trText } from '../src/data/catalog.js'
import { cleanBuyer, clientIp, json, orderItems, priceOrder, sameSiteJson } from './catalog-live.js'
import { db, dbEnabled } from './db.js'
import { notifyOrder } from './whatsapp.js'

const SANDBOX = 'https://sandbox-api.iyzipay.com'
const INIT_PATH = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
const DETAIL_PATH = '/payment/iyzipos/checkoutform/auth/ecom/detail'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)

/* iyzico wants decimal strings; basket item prices must add up to `price` exactly. */
const money = (n) => (Number.isInteger(n) ? `${n}.0` : n.toFixed(2))
const num = (v) => Number(v) || 0

async function iyzico(path, body) {
  const apiKey = env('IYZICO_API_KEY')
  const secret = env('IYZICO_SECRET_KEY')
  if (!apiKey || !secret) throw new Error('IYZICO_API_KEY / IYZICO_SECRET_KEY tanımlı değil')
  const base = (env('IYZICO_BASE_URL') || SANDBOX).replace(/\/$/, '')
  const payload = JSON.stringify(body)
  const rnd = `${Date.now()}${randomBytes(4).toString('hex')}`
  const signature = createHmac('sha256', secret).update(rnd + path + payload).digest('hex')
  const auth = Buffer.from(`apiKey:${apiKey}&randomKey:${rnd}&signature:${signature}`).toString('base64')
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `IYZWSv2 ${auth}`, 'x-iyzi-rnd': rnd },
    body: payload,
  })
  return res.json()
}

function originOf(request) {
  const fixed = env('PUBLIC_ORIGIN')
  if (fixed) return fixed.replace(/\/$/, '')
  return new URL(request.url).origin
}

const gsm = (digits) => `+90${digits.slice(-10)}`

/* iyzico yanıt imzası (docs.iyzico.com › Response Signature Validation):
   HMAC-SHA256(secret, paymentStatus:paymentId:currency:basketId:conversationId:paidPrice:price:token), hex.
   Tutarlarda ondalık sıfırlar atılır ("600.0" → "600"). İmza alanı yoksa (eski hesap ayarı) geçer. */
export function signatureOk(r, token) {
  if (!r?.signature) return true
  const dec = (v) => String(Number(v))
  const data = [r.paymentStatus, r.paymentId, r.currency, r.basketId, r.conversationId, dec(r.paidPrice), dec(r.price), token].join(':')
  const expected = createHmac('sha256', env('IYZICO_SECRET_KEY') || '').update(data).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(r.signature).toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function startPayment(request, ctx = {}) {
  if (request.method !== 'POST') return json(405, { error: 'method' })
  const blocked = sameSiteJson(request)
  if (blocked) return blocked
  let data
  try { data = await request.json() } catch { return json(400, { error: 'json' }) }
  if (data?.consent !== true) return json(400, { error: 'consent' })

  const order = await priceOrder(data?.items)
  if (!order) return json(400, { error: 'cart' })
  // Panelden fiyat değiştiyse müşteri eski fiyatı görüyor olabilir: sayfayı yenilemesini iste.
  if (data?.expectedTotal !== undefined && num(data.expectedTotal) !== order.total) return json(409, { error: 'price_changed', total: order.total })
  const { buyer, errors } = cleanBuyer(data?.buyer, { needEmail: true })
  if (errors.length) return json(400, { error: 'buyer', fields: errors })

  const words = buyer.name.split(' ')
  const surname = words.length > 1 ? words.pop() : buyer.name
  const firstName = words.join(' ') || buyer.name
  const orderNo = `EP${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`
  const fullAddress = `${buyer.address}, ${buyer.district}`
  const place = { contactName: buyer.name, city: buyer.city, country: 'Turkey', address: fullAddress }
  const ip = clientIp(request, ctx)

  // Aynı IP'den 10 dakikada en fazla 5 ödeme denemesi (bot / kötüye kullanım).
  if (dbEnabled()) {
    try {
      const recent = await db.recentOrdersFromIp(ip, new Date(Date.now() - 10 * 60 * 1000).toISOString())
      if ((recent?.length ?? 0) >= 5) return json(429, { error: 'rate' })
    } catch (e) {
      console.error('ödeme sınırı kontrolü', e.message)
    }
  }

  const basketItems = order.lines.map((l) => ({
    id: `${l.product.id}-${l.variant.id}`,
    name: `${l.qty} x ${trText(l.product.name)} ${trText(l.variant.label)}`.slice(0, 120),
    category1: 'Gıda',
    category2: trText(l.product.name),
    itemType: 'PHYSICAL',
    price: money(l.total),
  }))
  if (order.shipping > 0) {
    basketItems.push({ id: 'kargo', name: 'Kargo', category1: 'Kargo', itemType: 'VIRTUAL', price: money(order.shipping) })
  }

  const body = {
    locale: data?.lang === 'tr' || !data?.lang ? 'tr' : 'en',
    conversationId: orderNo,
    price: money(order.total),
    paidPrice: money(order.total),
    currency: 'TRY',
    basketId: orderNo,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${originOf(request)}/api/odeme-sonuc`,
    // Taksit: şimdilik yalnızca tek çekim. Açmak için örn. [1, 2, 3, 6] (komisyon artar).
    enabledInstallments: [1],
    buyer: {
      id: orderNo,
      name: firstName,
      surname,
      gsmNumber: gsm(buyer.phone),
      email: buyer.email,
      // (TEYİT) T.C. kimlik no istenmiyor; iyzico'nun kabul ettiği yer tutucu. Mali müşavire danışın.
      identityNumber: '11111111111',
      registrationAddress: fullAddress,
      ip,
      city: buyer.city,
      country: 'Turkey',
    },
    shippingAddress: place,
    billingAddress: place,
    basketItems,
  }

  // Panel kuruluysa sipariş önce "ödeme bekliyor" olarak yazılır; kayıt olmadan ödeme alınmaz.
  if (dbEnabled()) {
    try {
      await db.insertOrder({
        id: orderNo,
        channel: 'kart',
        status: 'odeme_bekliyor',
        payment_method: 'kart',
        customer: buyer,
        // Onay kanıtı: zaman ve onaylanan yasal metin sürümü.
        consent_at: new Date().toISOString(),
        legal_version: String(data?.legalVersion ?? '').slice(0, 20),
        items: orderItems(order),
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        ip,
      })
    } catch (e) {
      console.error('sipariş kaydı', e.message)
      return json(502, { error: 'db' })
    }
  }

  try {
    const r = await iyzico(INIT_PATH, body)
    if (r.status !== 'success' || !r.paymentPageUrl) {
      console.error('iyzico initialize', r.errorCode, r.errorMessage)
      if (dbEnabled()) await db.updateOrder(orderNo, { status: 'basarisiz', admin_note: `iyzico: ${r.errorMessage ?? r.errorCode}` }).catch(() => {})
      return json(502, { error: 'provider' })
    }
    // Token saklanır: müşteri iyzico sayfasını kapatırsa (dönüş hiç gelmezse) zamanlanmış
    // eşleştirme görevi ödemeyi bu token ile iyzico'ya sorar (server/reconcile.js).
    if (dbEnabled() && r.token) {
      await db.updateOrder(orderNo, { provider_token: String(r.token).slice(0, 200) }).catch((e) => console.error('token kaydı', e.message))
    }
    return json(200, { url: r.paymentPageUrl, orderNo })
  } catch (e) {
    console.error('iyzico initialize', e.message)
    return json(502, { error: 'provider' })
  }
}

/* iyzico posts the form back here (application/x-www-form-urlencoded, field "token"). */
export async function finishPayment(request) {
  const origin = originOf(request)
  const back = (q) => new Response(null, { status: 303, headers: { location: `${origin}/odeme?${q}`, 'cache-control': 'no-store' } })
  let token = ''
  try {
    // iyzico sonucu her zaman POST eder; token adres çubuğuna/loglara düşmesin diye GET kabul edilmez.
    if (request.method === 'POST') token = String((await request.formData()).get('token') ?? '').slice(0, 200)
  } catch { /* falls through to the error page */ }
  if (!token) return back('durum=hata')

  const { ok, orderNo, reached } = await settleByToken(token, { abandon: true })
  if (!reached) return back('durum=hata')
  return ok ? back(`durum=basarili&no=${encodeURIComponent(orderNo)}`) : back('durum=hata')
}

/* Ödeme sonucunu token ile iyzico'ya sorar ve siparişi günceller. Üç yerden çağrılır:
   müşterinin tarayıcı dönüşü (finishPayment), iyzico bildirimi (webhook) ve zamanlanmış
   eşleştirme (reconcile). Kaynak ne olursa olsun karar iyzico'nun sunucudan verdiği yanıttır.
   abandon: true → ödeme başarısızsa sipariş "başarısız" yapılır (müşteri döndü ya da süre doldu).
   abandon: false → ödeme hâlâ sürüyor olabilir; yalnızca kesin başarısızlıkta işaretlenir. */
export async function settleByToken(token, { abandon = false, expectedOrder = '' } = {}) {
  let r
  try {
    r = await iyzico(DETAIL_PATH, { locale: 'tr', token })
  } catch (e) {
    console.error('iyzico detail', e.message)
    return { ok: false, orderNo: expectedOrder, reached: false }
  }
  const ok = r.status === 'success' && r.paymentStatus === 'SUCCESS'
  const orderNo = r.basketId || expectedOrder || ''
  if (!ok) console.error('iyzico detail', r.paymentStatus, r.errorCode, r.errorMessage)
  // Kesin başarısızlık: iyzico ödemenin başarısız olduğunu söylüyor (devam eden 3D aşamaları değil).
  const definiteFail = !ok && (abandon || r.paymentStatus === 'FAILURE')

  if (dbEnabled() && orderNo) {
    try {
      const before = await db.getOrder(orderNo)
      // Derinlemesine savunma: ödenen tutar ve para birimi siparişle aynı olmalı; iyzico'nun
      // dolandırıcılık incelemesindeki (fraudStatus 0) ya da reddettiği (-1) ödeme "ödendi" sayılmaz.
      const amountOk = before && Math.abs(num(r.paidPrice) - Number(before.total)) < 0.01 && (r.currency ?? 'TRY') === 'TRY'
      const fraudOk = r.fraudStatus === undefined || Number(r.fraudStatus) === 1
      const sigOk = signatureOk(r, token)
      if (!sigOk) console.error('iyzico imza uyuşmadı', orderNo)
      if (ok && before?.status === 'odeme_bekliyor' && (!amountOk || !fraudOk || !sigOk || r.conversationId !== orderNo)) {
        await db.updateOrderIf(orderNo, 'odeme_bekliyor', { admin_note: `KONTROL EDİN: iyzico tutar ${r.paidPrice} ${r.currency ?? ''}, fraudStatus ${r.fraudStatus}, imza ${sigOk ? 'tamam' : 'UYUŞMADI'}. Kargolamadan önce iyzico panelinden doğrulayın.` })
      } else if (ok && before?.status === 'odeme_bekliyor') {
        // iyzico'nun bu ödemeden kestiği tutar ve hesaba geçecek net tutar.
        const commission = num(r.iyziCommissionRateAmount) + num(r.iyziCommissionFee)
        const payout = (r.itemTransactions ?? []).reduce((s, it) => s + num(it.merchantPayoutAmount), 0)
        // Koşullu güncelleme: aynı anda iki dönüş gelirse yalnızca biri durumu değiştirir ve bildirir.
        const saved = await db.updateOrderIf(orderNo, 'odeme_bekliyor', {
          status: 'odendi',
          commission: Math.round(commission * 100) / 100,
          payout: payout ? Math.round(payout * 100) / 100 : null,
          provider_payment_id: String(r.paymentId ?? ''),
        })
        if (saved) await notifyOrder(saved)
      } else if (definiteFail && before?.status === 'odeme_bekliyor') {
        await db.updateOrderIf(orderNo, 'odeme_bekliyor', { status: 'basarisiz', admin_note: `iyzico: ${r.errorMessage ?? r.paymentStatus ?? ''}` })
      }
    } catch (e) {
      // Ödeme alındı ama kayıt güncellenemedi: müşteriye başarı göster, panelde "ödeme bekliyor" kalır;
      // zamanlanmış eşleştirme bir sonraki turda yeniden dener.
      console.error('sipariş güncelleme', orderNo, e.message)
    }
  }
  return { ok, orderNo, reached: true, paymentStatus: r.paymentStatus }
}
