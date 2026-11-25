/* Supabase REST (PostgREST) — sunucu tarafı, service_role anahtarıyla.
   Bağımlılık yok: fetch yeter. Ortam değişkenleri:
     SUPABASE_URL                 https://xxxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY    Supabase → Project Settings → API (GİZLİ, tarayıcıya gitmez)
   Tanımlı değilse db.enabled false olur; site eskisi gibi products.js ile çalışır,
   siparişler kaydedilmez. */

import { AsyncLocalStorage } from 'node:async_hooks'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)

/* İşlem kaydı (audit_log) için: yönetici işlemi sırasında yapılan her veritabanı isteği
   "x-actor" başlığıyla gider; veritabanı tetikleyicisi bunu yalnızca service_role'den kabul eder. */
const actorStore = new AsyncLocalStorage()
export const runAs = (actor, fn) => actorStore.run(String(actor ?? '').replace(/[^\x20-\x7e]/g, '').slice(0, 200), fn)

export const dbEnabled = () => Boolean(env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY'))

// Yeni Supabase anahtarları (sb_publishable_… / sb_secret_…) JWT değildir: yalnızca apikey başlığıyla gider.
async function rest(path, { method = 'GET', body, prefer } = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  const res = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      ...(key.startsWith('sb_') ? {} : { authorization: `Bearer ${key}` }),
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
      ...(actorStore.getStore() ? { 'x-actor': actorStore.getStore() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`supabase ${method} ${path.split('?')[0]} ${res.status}: ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

export const db = {
  activeProducts: () => rest('products?select=id,category,stock,name,note,variants,images,sort&active=eq.true&order=sort.asc,id.asc'),
  insertOrder: (order) => rest('orders', { method: 'POST', body: order, prefer: 'return=minimal' }),
  updateOrder: (id, patch) => rest(`orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, prefer: 'return=representation' }).then((r) => r?.[0] ?? null),
  /* Yalnızca kayıt hâlâ fromStatus durumundaysa günceller (aynı anda gelen iki
     istekten yalnızca biri kazanır, çift bildirim olmaz). Değişmediyse null. */
  updateOrderIf: (id, fromStatus, patch) =>
    rest(`orders?id=eq.${encodeURIComponent(id)}&status=eq.${encodeURIComponent(fromStatus)}`, { method: 'PATCH', body: patch, prefer: 'return=representation' }).then((r) => r?.[0] ?? null),
  /* Belirli bir yaştaki "ödeme bekliyor" kart siparişleri (eşleştirme görevi için). */
  pendingPayments: (olderThanIso, newerThanIso) =>
    rest(`orders?select=id,created_at,provider_token&status=eq.odeme_bekliyor&channel=eq.kart&created_at=lt.${encodeURIComponent(olderThanIso)}&created_at=gt.${encodeURIComponent(newerThanIso)}&order=created_at.asc&limit=50`),
  /* KVKK saklama: tamamlanmamış ve henüz anonimleştirilmemiş eski siparişler. */
  staleUnfinished: (beforeIso) =>
    rest(`orders?select=id,customer&status=in.(beklemede,basarisiz,iptal,odeme_bekliyor)&created_at=lt.${encodeURIComponent(beforeIso)}&customer->>anonymized=is.null&limit=200`),
  /* Yedek için tablonun tamamı (küçük dükkân ölçeği; 10 bin satıra kadar). */
  dump: (table) => rest(`${table}?select=*&limit=10000`),
  /* İşlem kaydı saklama süresi (bakım görevi). */
  pruneAudit: (beforeIso) => rest(`audit_log?at=lt.${encodeURIComponent(beforeIso)}`, { method: 'DELETE', prefer: 'return=minimal' }),
  /* Yöneticiler (kullanıcı yönetimi; yalnızca sunucu). */
  admins: () => rest('admins?select=user_id,role,email,created_at&order=created_at.asc'),
  adminRole: (userId) => rest(`admins?user_id=eq.${encodeURIComponent(userId)}&select=role`).then((r) => r?.[0]?.role ?? null),
  addAdmin: (row) => rest('admins', { method: 'POST', body: row, prefer: 'return=representation' }).then((r) => r?.[0] ?? null),
  setAdminRole: (userId, role) => rest(`admins?user_id=eq.${encodeURIComponent(userId)}`, { method: 'PATCH', body: { role }, prefer: 'return=representation' }).then((r) => r?.[0] ?? null),
  removeAdmin: (userId) => rest(`admins?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE', prefer: 'return=minimal' }),
  userIdByEmail: (email) => rest('rpc/admin_user_id_by_email', { method: 'POST', body: { e: email } }),
  recentOrders: (sinceIso, channel) => rest(`orders?select=id&created_at=gte.${encodeURIComponent(sinceIso)}${channel ? `&channel=eq.${channel}` : ''}`),
  getOrder: (id) => rest(`orders?id=eq.${encodeURIComponent(id)}&select=*`).then((r) => r?.[0] ?? null),
  recentOrdersFromIp: (ip, sinceIso) => rest(`orders?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(sinceIso)}`),
  ordersBetween: (fromIso, toIso) => rest(`orders?select=*&created_at=gte.${encodeURIComponent(fromIso)}&created_at=lt.${encodeURIComponent(toIso)}&order=created_at.asc`),
  costs: () => rest('variant_costs?select=product_id,variant_id,cost'),
  setting: (key) => rest(`settings?key=eq.${encodeURIComponent(key)}&select=value`).then((r) => r?.[0]?.value),
}

/* Admin istekleri: tarayıcıdaki oturum anahtarını Supabase'e doğrulatır, sonra
   veritabanındaki is_admin() fonksiyonunu O KULLANICININ yetkisiyle çağırır. Böylece
   panel ile aynı kural geçerli olur (iki adımlı doğrulama açıksa kod girilmiş olmalı). */
export async function requireAdmin(request) {
  if (!dbEnabled()) return null
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token || token.length > 4096) return null
  const base = env('SUPABASE_URL').replace(/\/$/, '')
  const key = env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_SERVICE_ROLE_KEY')
  const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const user = await res.json()
  const check = await fetch(`${base}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  })
  if (!check.ok || (await check.json()) !== true) return null
  // Rol: "sahip" her şeyi, "personel" yalnızca siparişleri yönetir (supabase/migrations/20261126_01).
  return { ...user, role: (await db.adminRole(user.id).catch(() => null)) ?? 'personel' }
}
