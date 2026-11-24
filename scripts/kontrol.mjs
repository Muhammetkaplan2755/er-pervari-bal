/* Kurulum kontrolü: npm run kontrol
   .env.local / .env.development.local (ya da ortam) içindeki anahtarlarla
   Supabase, iyzico ve WhatsApp bağlantılarını dener; hiçbir anahtarı ekrana
   yazmaz, hiçbir şeyi değiştirmez, mesaj GÖNDERMEZ. */
import { existsSync, readFileSync } from 'node:fs'
import { createHmac, randomBytes } from 'node:crypto'

for (const f of ['.env', '.env.local', '.env.development.local']) {
  if (!existsSync(f)) continue
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const E = process.env
let fails = 0
const ok = (msg) => console.log(`  ✓ ${msg}`)
const bad = (msg) => { fails += 1; console.log(`  ✗ ${msg}`) }
const skip = (msg) => console.log(`  – ${msg}`)
const check = (cond, good, fail, soft = false) => (cond ? ok(good) : soft ? skip(fail) : bad(fail))
const sbHeaders = (key) => (key.startsWith('sb_') ? { apikey: key } : { apikey: key, authorization: `Bearer ${key}` })
const get = async (url, headers = {}) => {
  const res = await fetch(url, { headers })
  let body = null
  try { body = await res.json() } catch { /* not json */ }
  return { status: res.status, body }
}

/* ---------- Supabase ---------- */
console.log('\nSupabase (veritabanı + panel girişi)')
const sbUrl = (E.VITE_SUPABASE_URL || E.SUPABASE_URL || '').replace(/\/$/, '')
if (!sbUrl || !E.VITE_SUPABASE_ANON_KEY) {
  skip('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY yok — panel kapalı, site products.js ile çalışır')
} else {
  try {
    const anon = sbHeaders(E.VITE_SUPABASE_ANON_KEY)
    const p = await get(`${sbUrl}/rest/v1/products?select=id,images&active=eq.true`, anon)
    if (p.status === 200 && Array.isArray(p.body)) {
      check(p.body.length, `ürünler okunuyor (${p.body.length} aktif ürün)`, 'ürün tablosu boş — supabase/seed.sql çalıştırılmalı')
    } else if (p.status === 400 && JSON.stringify(p.body).includes('images')) {
      bad('products.images sütunu yok — supabase/schema.sql dosyasını yeniden çalıştırın')
    } else bad(`ürünler okunamadı (HTTP ${p.status}) — schema.sql çalıştı mı, URL/anahtar doğru mu?`)

    const o = await get(`${sbUrl}/rest/v1/orders?select=id&limit=1`, anon)
    if (o.status === 200 && Array.isArray(o.body) && o.body.length === 0) ok('siparişler ziyaretçiye kapalı (RLS çalışıyor)')
    else if (o.status === 200 && o.body?.length) bad('DİKKAT: siparişler anon anahtarla okunabiliyor — RLS açık değil!')
    else if (o.status === 401 || o.status === 403) ok('siparişler ziyaretçiye kapalı (izin yok)')
    else skip(`sipariş tablosu kontrolü: HTTP ${o.status}`)

    if (!E.SUPABASE_SERVICE_ROLE_KEY) {
      bad('SUPABASE_SERVICE_ROLE_KEY yok — sipariş kaydı ve bildirimler çalışmaz')
    } else {
      const svc = sbHeaders(E.SUPABASE_SERVICE_ROLE_KEY)
      const a = await get(`${sbUrl}/rest/v1/admins?select=user_id`, svc)
      if (a.status !== 200) bad(`service_role anahtarı geçersiz ya da admins tablosu yok (HTTP ${a.status})`)
      else check(a.body.length, `${a.body.length} yönetici tanımlı`, 'admins tablosu boş — KURULUM-YONETIM.md adım 1.6')
      const s = await get(`${sbUrl}/rest/v1/settings?select=key,value`, svc)
      const nums = s.body?.find?.((r) => r.key === 'notify_numbers')?.value
      if (Array.isArray(nums)) check(nums.length, `${nums.length} bildirim numarası kayıtlı`, 'bildirim numarası yok — panel › Ayarlar', true)
      const c = await get(`${sbUrl}/rest/v1/orders?select=consent_at,legal_version&limit=1`, svc)
      check(c.status === 200, 'sipariş onay kanıtı sütunları var', 'consent_at / legal_version sütunu yok — supabase/guncelleme-guvenlik.sql çalıştırılmalı (yoksa sipariş kaydı başarısız olur)')
      const b = await get(`${sbUrl}/storage/v1/bucket/urunler`, svc)
      check(b.status === 200 && b.body?.public, 'fotoğraf deposu "urunler" hazır ve herkese açık', '"urunler" fotoğraf deposu yok — schema.sql yeniden çalıştırılmalı')
    }
  } catch (e) {
    bad(`Supabase'e bağlanılamadı: ${e.message}`)
  }
}

/* ---------- iyzico ---------- */
console.log('\niyzico (kartla ödeme)')
if (!E.IYZICO_API_KEY || !E.IYZICO_SECRET_KEY) {
  skip('IYZICO_API_KEY / IYZICO_SECRET_KEY yok — kartla ödeme kapalı')
} else {
  const base = (E.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').replace(/\/$/, '')
  const path = '/payment/iyzipos/checkoutform/auth/ecom/detail'
  const payload = JSON.stringify({ locale: 'tr', token: 'kontrol-sahte-token' })
  const rnd = `${Date.now()}${randomBytes(4).toString('hex')}`
  const sig = createHmac('sha256', E.IYZICO_SECRET_KEY).update(rnd + path + payload).digest('hex')
  const auth = Buffer.from(`apiKey:${E.IYZICO_API_KEY}&randomKey:${rnd}&signature:${sig}`).toString('base64')
  try {
    const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `IYZWSv2 ${auth}`, 'x-iyzi-rnd': rnd }, body: payload }).then((x) => x.json())
    // Sahte token ile "bulunamadı" dönmesi anahtarların ve imzanın kabul edildiğini gösterir.
    if (r.errorCode === '1001' || /api bilgileri/i.test(r.errorMessage ?? '')) bad('iyzico anahtarları geçersiz')
    else if (/imza|signature/i.test(r.errorMessage ?? '')) bad('iyzico imzası reddedildi — gizli anahtarı kontrol edin')
    else ok(`iyzico anahtarları kabul edildi (${base.includes('sandbox') ? 'DENEME ortamı' : 'CANLI ortam'})`)
  } catch (e) {
    bad(`iyzico'ya bağlanılamadı: ${e.message}`)
  }
  check(E.VITE_KART_ODEME === '1', 'sepette kart seçeneği açık (VITE_KART_ODEME=1)', 'VITE_KART_ODEME=1 değil — sepette kart seçeneği görünmez', true)
}

/* ---------- WhatsApp ---------- */
console.log('\nWhatsApp (otomatik bildirimler)')
const cmb = (E.CALLMEBOT || '').split(',').map((p) => p.trim().split(':')).filter(([n, k]) => n && k)
if (!E.WHATSAPP_TOKEN || !E.WHATSAPP_PHONE_NUMBER_ID) {
  if (cmb.length) ok(`geçici bildirim (CallMeBot) ${cmb.length} numaraya ayarlı: ${cmb.map(([n]) => n).join(', ')} — denemek için panel › Ayarlar › Deneme bildirimi`)
  else if (E.CALLMEBOT) bad('CALLMEBOT anahtarı boş — biçim 905536635864:ANAHTAR')
  else skip('WhatsApp ayarı yok (CALLMEBOT ya da WHATSAPP_TOKEN) — bildirim gitmez')
} else {
  const v = E.WHATSAPP_API_VERSION || 'v23.0'
  const h = { authorization: `Bearer ${E.WHATSAPP_TOKEN}` }
  try {
    const n = await get(`https://graph.facebook.com/${v}/${E.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating`, h)
    if (n.status === 200) ok(`gönderici numara: ${n.body.display_phone_number} (${n.body.verified_name})`)
    else bad(`numara okunamadı (HTTP ${n.status}): ${n.body?.error?.message ?? ''}`)
    if (E.WHATSAPP_WABA_ID) {
      const t = await get(`https://graph.facebook.com/${v}/${E.WHATSAPP_WABA_ID}/message_templates?fields=name,status,language&limit=100`, h)
      for (const name of ['siparis_bildirimi', 'haftalik_rapor']) {
        const row = t.body?.data?.find((x) => x.name === name)
        if (!row) bad(`şablon "${name}" yok — KURULUM-YONETIM.md adım 2.6`)
        else check(row.status === 'APPROVED', `şablon "${name}" onaylı`, `şablon "${name}" durumu: ${row.status}`)
      }
    } else {
      skip('şablon onayı kontrolü için WHATSAPP_WABA_ID ekleyin (isteğe bağlı)')
    }
  } catch (e) {
    bad(`Meta'ya bağlanılamadı: ${e.message}`)
  }
}

/* ---------- yayın ---------- */
console.log('\nYayın')
check(E.NETLIFY_BUILD_HOOK, 'NETLIFY_BUILD_HOOK tanımlı (panel "Siteye yayınla")', 'NETLIFY_BUILD_HOOK yok — "Siteye yayınla" düğmesi çalışmaz (yerelde normal)', true)

console.log(fails ? `\n${fails} sorun var.\n` : '\nHer şey yolunda.\n')
process.exitCode = fails ? 1 : 0
