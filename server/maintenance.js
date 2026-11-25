/* Bakım görevleri (zamanlanmış, ek hesap gerektirmez):
   1) anonymizeStale(): KVKK saklama süresi — tamamlanmamış siparişlerin (WhatsApp'ta onaylanmayan,
      ödemesi yapılmayan, iptal edilen) kişisel verisi RETENTION_DAYS (varsayılan 30) gün sonra silinir.
      Satır kalır (rapor ve stok geçmişi bozulmasın), yalnızca kişi bilgisi gider; il/ilçe istatistik için kalır.
      Satışı tamamlanmış siparişler (fatura/vergi gereği 10 yıl) bu görevin dışındadır.
   2) backupNow(): tüm tablolar JSON olarak gizli "yedekler" deposuna; son 8 yedek tutulur.
      Supabase'in ücretsiz planında otomatik yedek yoktur; bu, yanlışlıkla silmeye karşı korur. */
import { db, dbEnabled } from './db.js'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)
const DAY = 24 * 3600 * 1000
const BUCKET = 'yedekler'
const KEEP = 8
const TABLES = ['products', 'variant_costs', 'inventory', 'orders', 'settings', 'admins']

export async function anonymizeStale(now = new Date()) {
  if (!dbEnabled()) return { skipped: 'veritabanı ayarı yok' }
  const days = Math.max(7, Number(env('RETENTION_DAYS')) || 30)
  const rows = await db.staleUnfinished(new Date(now - days * DAY).toISOString())
  let done = 0
  for (const o of rows ?? []) {
    const c = o.customer ?? {}
    await db.updateOrder(o.id, {
      customer: { anonymized: true, city: c.city ?? null, district: c.district ?? null },
      ip: null,
      provider_token: null,
      admin_note: `Kişisel veri ${days} günlük saklama süresi dolduğu için silindi (KVKK).`,
    })
    done += 1
  }
  // İşlem kaydı 1 yıl tutulur.
  let auditPruned = true
  try { await db.pruneAudit(new Date(now - 365 * DAY).toISOString()) } catch { auditPruned = false }
  return { anonymized: done, days, auditPruned }
}

/* ---------- yedek (Supabase Storage REST, service_role) ---------- */
function storage(path, { method = 'GET', body, type = 'application/json', headers = {} } = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  return fetch(`${base}/storage/v1/${path}`, {
    method,
    headers: { apikey: key, ...(key.startsWith('sb_') ? {} : { authorization: `Bearer ${key}` }), 'content-type': type, ...headers },
    body,
  })
}

export async function listBackups() {
  const res = await storage(`object/list/${BUCKET}`, { method: 'POST', body: JSON.stringify({ prefix: '', limit: 100, sortBy: { column: 'name', order: 'desc' } }) })
  if (!res.ok) throw new Error(`yedek listesi ${res.status}: ${(await res.text()).slice(0, 160)}`)
  return (await res.json()).filter((f) => f.name?.endsWith('.json')).map((f) => ({ name: f.name, size: f.metadata?.size ?? null, created_at: f.created_at }))
}

export async function backupNow(now = new Date()) {
  if (!dbEnabled()) return { skipped: 'veritabanı ayarı yok' }
  const data = { created_at: now.toISOString(), tables: {} }
  for (const t of TABLES) {
    try { data.tables[t] = await db.dump(t) } catch (e) { data.tables[t] = { error: e.message } }
  }
  const name = `${now.toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
  const res = await storage(`object/${BUCKET}/${name}`, { method: 'POST', body: JSON.stringify(data), headers: { 'x-upsert': 'true' } })
  if (!res.ok) throw new Error(`yedek yüklenemedi ${res.status}: ${(await res.text()).slice(0, 160)}`)
  // Eski yedekleri temizle (yalnızca son KEEP adet kalır).
  const all = await listBackups()
  const old = all.slice(KEEP).map((f) => f.name)
  if (old.length) await storage(`object/${BUCKET}`, { method: 'DELETE', body: JSON.stringify({ prefixes: old }) })
  const counts = Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, Array.isArray(v) ? v.length : 'hata']))
  return { name, counts, removed: old.length }
}

/* Yöneticiye 5 dakikalık indirme bağlantısı. */
export async function signedBackupUrl(name) {
  if (!/^[0-9-]+\.json$/.test(String(name))) throw new Error('geçersiz yedek adı')
  const res = await storage(`object/sign/${BUCKET}/${name}`, { method: 'POST', body: JSON.stringify({ expiresIn: 300 }) })
  if (!res.ok) throw new Error(`bağlantı üretilemedi ${res.status}`)
  const { signedURL } = await res.json()
  return `${env('SUPABASE_URL').replace(/\/$/, '')}/storage/v1${signedURL}`
}
