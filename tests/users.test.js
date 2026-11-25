import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminAction } from '../server/admin.js'
import { addUser, removeUser, setRole, tempPassword } from '../server/users.js'

/* Sahte Supabase (auth + REST): gerçek ağa çıkılmaz. */
const OWNER = '11111111-1111-1111-1111-111111111111'
const STAFF = '22222222-2222-2222-2222-222222222222'
let admins
let calls
let existing

function fakeFetch(url, opts = {}) {
  const u = String(url)
  const method = opts.method ?? 'GET'
  calls.push({ url: u, method, headers: opts.headers ?? {}, body: opts.body })
  const ok = (v, status = 200) => Promise.resolve(new Response(JSON.stringify(v), { status }))
  // Oturum: "Bearer owner" → sahip, "Bearer staff" → personel
  if (u.endsWith('/auth/v1/user')) {
    const t = opts.headers.authorization.replace('Bearer ', '')
    return t === 'owner' ? ok({ id: OWNER, email: 'sahip@ornek.com' }) : t === 'staff' ? ok({ id: STAFF, email: 'personel@ornek.com' }) : ok({}, 401)
  }
  if (u.endsWith('/rest/v1/rpc/is_admin')) return ok(true)
  if (u.endsWith('/rest/v1/rpc/admin_user_id_by_email')) return ok(existing[JSON.parse(opts.body).e] ?? null)
  if (u.includes('/auth/v1/admin/users') && method === 'POST') return ok({ id: '33333333-3333-3333-3333-333333333333' })
  if (u.includes('/auth/v1/admin/users/') && method === 'DELETE') return ok({})
  if (u.includes('/rest/v1/admins')) {
    const q = new URL(u)
    const id = q.searchParams.get('user_id')?.replace('eq.', '')
    if (method === 'POST') { const row = JSON.parse(opts.body); admins.push(row); return ok([row]) }
    if (method === 'PATCH') { const a = admins.find((x) => x.user_id === id); Object.assign(a, JSON.parse(opts.body)); return ok([a]) }
    if (method === 'DELETE') { admins = admins.filter((x) => x.user_id !== id); return Promise.resolve(new Response('')) }
    return ok(id ? admins.filter((x) => x.user_id === id) : admins)
  }
  return ok({})
}

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  admins = [{ user_id: OWNER, role: 'sahip', email: 'sahip@ornek.com' }, { user_id: STAFF, role: 'personel', email: 'personel@ornek.com' }]
  calls = []
  existing = {}
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

const req = (action, token, body) => new Request(`https://site.test/api/yonetim/${action}`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: body ? JSON.stringify(body) : undefined,
})

describe('yetki', () => {
  it('personel sahip işlemlerini yapamaz (iade, yedek, kullanıcı)', async () => {
    for (const a of ['iade', 'yedek-al', 'kullanicilar', 'kullanici-ekle', 'yayinla', 'test-bildirim']) {
      expect((await adminAction(req(a, 'staff', {}))).status).toBe(403)
    }
  })

  it('sahip kullanıcıları listeler; istekler sahibin e-postasıyla işaretlenir', async () => {
    const res = await adminAction(req('kullanicilar', 'owner'))
    expect(res.status).toBe(200)
    expect((await res.json()).users).toHaveLength(2)
    const list = calls.find((c) => c.url.includes('/rest/v1/admins?select='))
    expect(list.headers['x-actor']).toBe('sahip@ornek.com')
  })

  it('giriş yapmamışa 401', async () => {
    expect((await adminAction(req('kargo', 'yok', {}))).status).toBe(401)
  })
})

describe('kullanıcı yönetimi', () => {
  it('yeni çalışana geçici şifreyle hesap açar ve personel yapar', async () => {
    const r = await addUser(' Yeni@Ornek.com ', 'personel')
    expect(r.ok).toBe(true)
    expect(r.password).toMatch(/^[A-Za-z2-9]{14}$/)
    const created = JSON.parse(calls.find((c) => c.url.endsWith('/auth/v1/admin/users')).body)
    expect(created).toMatchObject({ email: 'yeni@ornek.com', email_confirm: true, user_metadata: { gecici_sifre: true } })
    expect(admins.at(-1)).toMatchObject({ role: 'personel', email: 'yeni@ornek.com' })
  })

  it('hesabı olan kişinin şifresine dokunmaz', async () => {
    existing['eski@ornek.com'] = '44444444-4444-4444-4444-444444444444'
    const r = await addUser('eski@ornek.com', 'personel')
    expect(r).toMatchObject({ ok: true, password: null })
    expect(calls.some((c) => c.url.endsWith('/auth/v1/admin/users'))).toBe(false)
  })

  it('geçersiz e-posta, yetki ve tekrar eklemeyi reddeder', async () => {
    expect((await addUser('yanlis', 'personel')).ok).toBe(false)
    expect((await addUser('a@b.co', 'patron')).ok).toBe(false)
    existing['personel@ornek.com'] = STAFF
    expect((await addUser('personel@ornek.com', 'personel')).error).toMatch(/zaten/)
  })

  it('kendi yetkisini değiştiremez, son sahip düşürülemez/silinemez', async () => {
    expect((await setRole(OWNER, OWNER, 'personel')).ok).toBe(false)
    expect((await removeUser(OWNER, OWNER)).ok).toBe(false)
    admins.push({ user_id: '55555555-5555-5555-5555-555555555555', role: 'personel', email: 'x@y.co' })
    // Personel olan biri, tek sahibi düşüremez (sunucu zaten personeli engeller; bu ek katman)
    expect((await setRole(STAFF, OWNER, 'personel')).error).toMatch(/En az bir sahip/)
    expect((await removeUser(STAFF, OWNER)).error).toMatch(/En az bir sahip/)
  })

  it('personeli kaldırınca önce yetki satırı, sonra hesap silinir', async () => {
    const r = await removeUser(OWNER, STAFF)
    expect(r).toMatchObject({ ok: true, accountDeleted: true })
    const order = calls.filter((c) => c.method === 'DELETE').map((c) => (c.url.includes('/rest/v1/admins') ? 'yetki' : 'hesap'))
    expect(order).toEqual(['yetki', 'hesap'])
    expect(admins.some((a) => a.user_id === STAFF)).toBe(false)
  })

  it('geçici şifre karışan harf içermez', () => {
    for (let i = 0; i < 50; i++) expect(tempPassword()).not.toMatch(/[0O1lI]/)
  })
})
