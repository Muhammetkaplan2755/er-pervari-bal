/* WhatsApp bildirimleri. İki yol var; hangisinin anahtarı tanımlıysa o kullanılır:

   1) GEÇİCİ — CallMeBot (ücretsiz, kişisel kullanım). Mesajı CallMeBot'un kendi
      WhatsApp numarası gönderir; dükkânın numarası otomasyona bağlanmaz, kapanma
      riski yok. Her alıcı telefon kendi anahtarını bir kez alır (KURULUM-YONETIM.md).
        CALLMEBOT   905536635864:ANAHTAR[,905xxxxxxxxx:ANAHTAR2]   (GİZLİ)
      Müşteri adresi/telefonu üçüncü tarafa gitmesin diye mesaj kısadır:
      sipariş no, ödeme, ürünler, tutar. Ayrıntılar panelde.

   2) KALICI — Meta WhatsApp Business Platform (Cloud API). Onaylı şablonlarla.
        WHATSAPP_TOKEN            Meta → kalıcı sistem kullanıcısı erişim anahtarı (GİZLİ)
        WHATSAPP_PHONE_NUMBER_ID  Meta → WhatsApp → API Setup → Phone number ID
        WHATSAPP_API_VERSION      varsayılan v23.0
        WHATSAPP_TEMPLATE_LANG    varsayılan tr
        WHATSAPP_NOTIFY           isteğe bağlı yedek liste: 905xxxxxxxxx,905yyyyyyyyy
      Bildirim numaraları panelden (settings.notify_numbers) yönetilir.
   İkisi de tanımlıysa Meta kullanılır. */
import { db, dbEnabled } from './db.js'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)

export const TEMPLATES = { order: 'siparis_bildirimi', weekly: 'haftalik_rapor' }

const metaEnabled = () => Boolean(env('WHATSAPP_TOKEN') && env('WHATSAPP_PHONE_NUMBER_ID'))

/* "905536635864:anahtar,905…:anahtar" → [{ phone, key }] */
function callmebotTargets() {
  return (env('CALLMEBOT') || '')
    .split(',')
    .map((pair) => pair.trim().split(':'))
    .map(([phone, key]) => ({ phone: normalizeNumber(phone), key: (key || '').trim() }))
    .filter((t) => t.phone && t.key)
}

export const whatsappEnabled = () => metaEnabled() || callmebotTargets().length > 0
export const whatsappMode = () => (metaEnabled() ? 'meta' : callmebotTargets().length ? 'callmebot' : 'yok')

/* Şablon değişkeninde satır sonu, sekme ve 4+ boşluk yasak. */
const clean = (v) => String(v ?? '-').replace(/\s+/g, ' ').trim().slice(0, 600) || '-'

export function normalizeNumber(raw) {
  const d = String(raw ?? '').replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('5')) return `90${d}`
  if (d.length === 11 && d.startsWith('05')) return `9${d}`
  if (d.length === 12 && d.startsWith('905')) return d
  return null
}

export async function notifyNumbers() {
  const list = []
  if (dbEnabled()) {
    try {
      const v = await db.setting('notify_numbers')
      if (Array.isArray(v)) list.push(...v)
    } catch (e) {
      console.error('notify_numbers okunamadı', e.message)
    }
  }
  list.push(...(env('WHATSAPP_NOTIFY') || '').split(','))
  return [...new Set(list.map(normalizeNumber).filter(Boolean))]
}

async function sendTemplate(to, name, params) {
  const version = env('WHATSAPP_API_VERSION') || 'v23.0'
  const res = await fetch(`https://graph.facebook.com/${version}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env('WHATSAPP_TOKEN')}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: env('WHATSAPP_TEMPLATE_LANG') || 'tr' },
        components: [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: clean(p) })) }],
      },
    }),
  })
  if (!res.ok) throw new Error(`whatsapp ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

async function sendCallmebot({ phone, key }, text) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`
  const res = await fetch(url)
  const body = (await res.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  // CallMeBot hata durumunda da 200 dönebilir; başarıda "Message queued" yazar.
  if (!res.ok || !/queued|sent/i.test(body)) throw new Error(`callmebot ${res.status}: ${body.slice(0, 200)}`)
  return true
}

/* Herkese gönderir; birinin hatası diğerlerini durdurmaz. Hiç hata fırlatmaz.
   name/params: Meta şablonu · text: CallMeBot için düz metin. */
async function broadcastWhatsapp(name, params, text) {
  const mode = whatsappMode()
  if (mode === 'yok') return { sent: 0, total: 0, skipped: 'whatsapp ayarı yok' }
  let targets
  let send
  if (mode === 'meta') {
    targets = await notifyNumbers()
    send = (to) => sendTemplate(to, name, params)
  } else {
    targets = callmebotTargets()
    // CallMeBot aynı anda birden çok isteği reddedebilir; sırayla gönder.
    send = (t) => sendCallmebot(t, text)
  }
  const results = []
  if (mode === 'meta') {
    results.push(...(await Promise.allSettled(targets.map(send))))
  } else {
    for (const t of targets) results.push(...(await Promise.allSettled([send(t)])))
  }
  results.forEach((r, i) => { if (r.status === 'rejected') console.error('whatsapp →', mode, targets[i]?.phone ?? targets[i], r.reason?.message) })
  return { sent: results.filter((r) => r.status === 'fulfilled').length, total: targets.length, mode }
}

/* ---------- Telegram (sahibe ücretsiz, sınırsız bildirim) ----------
   TELEGRAM_BOT_TOKEN  @BotFather'dan alınan bot anahtarı (GİZLİ)
   TELEGRAM_CHAT_IDS   bildirim alacak sohbet kimlikleri, virgülle (npm run kontrol bulur)
   Mesaj WhatsApp'taki kısa metinle aynıdır: müşteri adı/telefonu/adresi yok. */
const telegramChats = () => (env('TELEGRAM_CHAT_IDS') || '').split(',').map((x) => x.trim()).filter((x) => /^-?\d{4,20}$/.test(x))
export const telegramEnabled = () => Boolean(env('TELEGRAM_BOT_TOKEN')) && telegramChats().length > 0

async function sendTelegram(text) {
  if (!telegramEnabled()) return { sent: 0, total: 0 }
  const chats = telegramChats()
  const results = await Promise.allSettled(chats.map(async (chat_id) => {
    const res = await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id, text: String(text).slice(0, 4000), disable_web_page_preview: true }),
    })
    if (!res.ok) throw new Error(`telegram ${res.status}`)
  }))
  results.forEach((r) => { if (r.status === 'rejected') console.error('telegram →', r.reason?.message) })
  return { sent: results.filter((r) => r.status === 'fulfilled').length, total: chats.length }
}

export const notifyEnabled = () => whatsappEnabled() || telegramEnabled()

/* Tüm bildirim kanallarına gönderir (WhatsApp + Telegram); hiç hata fırlatmaz. */
export async function broadcast(name, params, text) {
  if (!notifyEnabled()) return { sent: 0, skipped: 'bildirim ayarı yok' }
  const [wa, tg] = await Promise.all([broadcastWhatsapp(name, params, text), sendTelegram(text)])
  return { sent: wa.sent + tg.sent, total: wa.total + tg.total, mode: wa.mode, telegram: tg.sent }
}

/* Kritik durum uyarısı (ödeme alındı ama kaydedilemedi, yedek alınamadı…): yalnızca Telegram,
   çünkü WhatsApp şablon gerektirir. Telegram yoksa yalnızca sunucu kaydına düşer. */
export async function alertOwner(text) {
  console.error('UYARI:', text)
  return sendTelegram(text)
}

const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
const CHANNEL = { kart: 'Kartla ödendi', havale: 'Havale / EFT (WhatsApp)', kapida: 'Kapıda ödeme (WhatsApp)' }

/* Şablon "siparis_bildirimi" — 4 değişken, sırası KURULUM-YONETIM.md ile aynı.
   Veri en aza indirildi (KVKK md. 4, yurt dışı aktarım): müşteri adı ve telefonu
   WhatsApp'a / Meta'ya gönderilmez; ayrıntılar yalnızca panelde. */
export function notifyOrder(order) {
  const c = order.customer ?? {}
  const items = (order.items ?? []).map((i) => `${i.qty}× ${i.name} ${i.label}`).join(', ')
  const pay = CHANNEL[order.payment_method] ?? order.channel
  const total = tl.format(Number(order.total) || 0)
  const text = [
    `🍯 Yeni sipariş: ${order.id}`,
    pay,
    `Ürünler: ${items}`,
    `Tutar: ${total}`,
    `${c.city ?? ''} / ${c.district ?? ''}`,
    'Müşteri bilgileri yönetici panelinde.',
  ].join('\n')
  return broadcast(TEMPLATES.order, [`${pay} · ${order.id}`, `${c.city ?? ''} / ${c.district ?? ''}`, items, total], text)
}
