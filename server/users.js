/* Panel kullanıcıları (yalnızca dükkân sahibi yönetir).
   Çalışan eklerken e-posta gönderilmez (Supabase'in hazır e-postası yalnızca proje üyelerine gider):
   sunucu hesabı GEÇİCİ şifreyle açar, şifre panelde sahibe BİR KEZ gösterilir, sahip çalışana
   kendisi iletir; çalışan ilk girişte kendi şifresini belirlemek zorundadır (user_metadata.gecici_sifre).
   Kendi yetkisini değiştirmek / kendini silmek ve son sahibi kaldırmak engellenir. */
import { randomInt } from 'node:crypto'
import { db } from './db.js'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)
export const ROLES = ['sahip', 'personel']
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i
const UUID = /^[0-9a-f-]{36}$/i

function authAdmin(path, { method = 'GET', body } = {}) {
  const base = env('SUPABASE_URL').replace(/\/$/, '')
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  return fetch(`${base}/auth/v1/admin/${path}`, {
    method,
    headers: { apikey: key, ...(key.startsWith('sb_') ? {} : { authorization: `Bearer ${key}` }), 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/* Okunması kolay geçici şifre (karışan harfler yok: 0/O, 1/l/I). */
export function tempPassword(len = 14) {
  const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => abc[randomInt(abc.length)]).join('')
}

export const listUsers = () => db.admins()

export async function addUser(rawEmail, role) {
  const email = String(rawEmail ?? '').trim().toLowerCase()
  if (!EMAIL.test(email)) return { ok: false, error: 'Geçerli bir e-posta yazın.' }
  if (!ROLES.includes(role)) return { ok: false, error: 'Geçersiz yetki.' }
  let userId = await db.userIdByEmail(email)
  let password = null
  if (!userId) {
    password = tempPassword()
    const res = await authAdmin('users', { method: 'POST', body: { email, password, email_confirm: true, user_metadata: { gecici_sifre: true } } })
    const out = await res.json().catch(() => ({}))
    if (!res.ok || !out.id) return { ok: false, error: `Hesap açılamadı (${res.status}).` }
    userId = out.id
  }
  if ((await db.admins()).some((a) => a.user_id === userId)) return { ok: false, error: 'Bu kişi zaten panel kullanıcısı.' }
  const row = await db.addAdmin({ user_id: userId, role, email })
  // password yalnızca yeni açılan hesapta döner; var olan hesabın şifresine dokunulmaz.
  return { ok: true, user: row, password }
}

async function guard(actorId, userId) {
  if (!UUID.test(String(userId))) return 'Geçersiz kullanıcı.'
  if (userId === actorId) return 'Kendi yetkinizi değiştiremez ya da kendinizi kaldıramazsınız.'
  const all = await db.admins()
  const target = all.find((a) => a.user_id === userId)
  if (!target) return 'Kullanıcı bulunamadı.'
  return { all, target }
}

export async function setRole(actorId, userId, role) {
  if (!ROLES.includes(role)) return { ok: false, error: 'Geçersiz yetki.' }
  const g = await guard(actorId, userId)
  if (typeof g === 'string') return { ok: false, error: g }
  if (g.target.role === 'sahip' && role !== 'sahip' && g.all.filter((a) => a.role === 'sahip').length < 2) {
    return { ok: false, error: 'En az bir sahip kalmalı.' }
  }
  return { ok: true, user: await db.setAdminRole(userId, role) }
}

/* Panel yetkisini kaldırır ve hesabı siler (giriş yapamaz). Önce yetki satırı silinir ki işlem kayda geçsin. */
export async function removeUser(actorId, userId) {
  const g = await guard(actorId, userId)
  if (typeof g === 'string') return { ok: false, error: g }
  if (g.target.role === 'sahip' && g.all.filter((a) => a.role === 'sahip').length < 2) return { ok: false, error: 'En az bir sahip kalmalı.' }
  await db.removeAdmin(userId)
  const res = await authAdmin(`users/${userId}`, { method: 'DELETE' })
  return { ok: true, accountDeleted: res.ok }
}
