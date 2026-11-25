/* Deneme modu (yalnızca geliştirme): /yonetim?demo
   Paneli hesap kurmadan, bellekte duran ÖRNEK verilerle açar. Sayfa yenilenince
   değişiklikler kaybolur. Siparişler uydurma değil, açıkça "DEMO" işaretlidir ve
   canlı siteye hiç girmez (api.js bu dosyayı yalnızca import.meta.env.DEV iken seçer). */
import { products as seedProducts } from '../data/products.js'

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => structuredClone(v)

export function makeDemo() {
const db = {
  products: seedProducts.map((p, i) => ({ ...clone(p), sort: i * 10, active: true, images: [] })),
  costs: [
    { product_id: 'suzme', variant_id: '500g', cost: 250 },
    { product_id: 'suzme', variant_id: '1kg', cost: 480 },
  ],
  settings: { notify_numbers: ['905550000001'], weekly_report: true },
  inventory: [{ product_id: 'suzme', variant_id: '1kg', qty: 12, low_at: 3 }, { product_id: 'polen', variant_id: '250g', qty: 2, low_at: 3 }],
  orders: [],
  users: [{ user_id: 'demo', role: 'sahip', email: 'demo@ornek.com', created_at: '2026-11-20T09:00:00Z' }],
  audit: [
    { id: 2, at: '2026-11-24T14:05:00Z', actor: 'demo@ornek.com', tbl: 'products', row_id: 'suzme', action: 'update', changes: { active: [true, false] } },
    { id: 1, at: '2026-11-24T10:00:00Z', actor: 'sistem', tbl: 'orders', row_id: 'DEMO0002', action: 'update', changes: { status: ['odeme_bekliyor', 'odendi'], ip: 'değişti' } },
  ],
}
let auditId = 10
const log = (tbl, rowId, action, changes) => db.audit.unshift({ id: ++auditId, at: new Date().toISOString(), actor: 'demo@ornek.com', tbl, row_id: rowId, action, changes })

/* Bu ayın içine dağılmış örnek siparişler. */
;(function seedOrders() {
  const now = Date.now()
  const day = 24 * 3600 * 1000
  const mk = (n, daysAgo, channel, status, method, lines, extra = 0) => {
    const items = lines.map(([pid, vid, qty]) => {
      const p = db.products.find((x) => x.id === pid)
      const v = p.variants.find((x) => x.id === vid)
      const tr = (o) => (o && typeof o === 'object' ? o.tr : o)
      return { product_id: pid, variant_id: vid, name: tr(p.name), label: tr(v.label), qty, unit_price: v.price, total: v.price * qty }
    })
    const subtotal = items.reduce((s, i) => s + i.total, 0)
    const shipping = subtotal >= 2500 ? 0 : 150
    const total = subtotal + shipping
    return {
      id: `DEMO${String(n).padStart(4, '0')}`,
      created_at: new Date(now - daysAgo * day).toISOString(),
      channel,
      status,
      payment_method: method,
      customer: { name: `Demo Müşteri ${n}`, phone: '05550000000', email: channel === 'kart' ? 'demo@example.com' : '', address: 'Demo Mahallesi 1. Sokak No 1', city: 'Gaziantep', district: 'Şahinbey', note: n === 2 ? 'Kapıyı çalmayın, arayın.' : '' },
      items,
      subtotal,
      shipping,
      total,
      commission: channel === 'kart' ? Math.round(total * 0.0299 * 100) / 100 : 0,
      payout: channel === 'kart' ? Math.round(total * 0.9701 * 100) / 100 : null,
      extra_cost: extra,
      tracking_code: '',
      admin_note: '',
    }
  }
  db.orders = [
    mk(1, 0, 'whatsapp', 'beklemede', 'havale', [['karakovan', '1kg', 1]]),
    mk(2, 1, 'kart', 'odendi', 'kart', [['suzme', '1kg', 2]]),
    mk(3, 3, 'whatsapp', 'onaylandi', 'kapida', [['suzme', '500g', 1], ['tahin', '300g', 2]], 40),
    mk(4, 5, 'kart', 'kargolandi', 'kart', [['kutu-kahvalti', 'kutu', 1]]),
    mk(5, 6, 'kart', 'basarisiz', 'kart', [['polen', '250g', 1]]),
    mk(6, 9, 'whatsapp', 'iptal', 'havale', [['fistik', '1kg', 1]]),
  ]
})()

let session = null
let mfaFactors = []
let mfaPassed = false
const listeners = new Set()
const emit = (event) => listeners.forEach((fn) => fn(session, event))

return {
  auth: {
    session: async () => session,
    onChange: (fn) => { listeners.add(fn); return { unsubscribe: () => listeners.delete(fn) } },
    signIn: async (email) => { await wait(); session = { access_token: 'demo', user: { id: 'demo', email: email || 'demo@ornek.com' } }; emit('SIGNED_IN') },
    signOut: async () => { session = null; mfaPassed = false; emit('SIGNED_OUT') },
    resetPassword: async () => wait(),
    updatePassword: async () => wait(),
    // /yonetim?demo=personel → personel görünümü
    role: async () => (new URLSearchParams(location.search).get('demo') === 'personel' ? 'personel' : 'sahip'),
    // Deneme: kod "123456" kabul edilir.
    mfa: {
      level: async () => (mfaFactors.length && !mfaPassed ? { currentLevel: 'aal1', nextLevel: 'aal2' } : { currentLevel: mfaFactors.length ? 'aal2' : 'aal1', nextLevel: mfaFactors.length ? 'aal2' : 'aal1' }),
      factors: async () => mfaFactors.filter((f) => f.status === 'verified'),
      enroll: async () => {
        const f = { id: `f${mfaFactors.length + 1}`, status: 'unverified', friendly_name: 'Yönetim (deneme)' }
        mfaFactors.push(f)
        return { id: f.id, totp: { secret: 'DEMODEMODEMODEMO', qr_code: '' } }
      },
      verify: async (factorId, code) => {
        await wait()
        if (code !== '123456') throw new Error('Kod yanlış (deneme modunda 123456)')
        const f = mfaFactors.find((x) => x.id === factorId)
        if (f) f.status = 'verified'
        mfaPassed = true
      },
      unenroll: async (factorId) => { mfaFactors = mfaFactors.filter((f) => f.id !== factorId) },
    },
  },
  products: {
    list: async () => { await wait(); return clone(db.products).sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id)) },
    save: async (p) => {
      await wait()
      const i = db.products.findIndex((x) => x.id === p.id)
      const row = { images: [], ...(i >= 0 ? db.products[i] : {}), ...clone(p) }
      if (i >= 0) db.products[i] = row
      else db.products.push(row)
      return clone(row)
    },
  },
  costs: {
    list: async () => clone(db.costs),
    saveMany: async (rows) => {
      for (const r of rows) {
        const i = db.costs.findIndex((c) => c.product_id === r.product_id && c.variant_id === r.variant_id)
        if (i >= 0) db.costs[i] = r
        else db.costs.push(r)
      }
    },
  },
  inventory: {
    list: async () => clone(db.inventory),
    save: async (rows) => {
      for (const r of rows) {
        const i = db.inventory.findIndex((x) => x.product_id === r.product_id && x.variant_id === r.variant_id)
        if (i >= 0) db.inventory[i] = { ...db.inventory[i], ...r }
        else db.inventory.push({ low_at: 3, ...r })
      }
    },
    remove: async (pid, vids) => { db.inventory = db.inventory.filter((x) => !(x.product_id === pid && vids.includes(x.variant_id))) },
  },
  orders: {
    between: async (from, to) => { await wait(); return clone(db.orders.filter((o) => o.created_at >= from && o.created_at < to)) },
    update: async (id, patch) => {
      await wait()
      const o = db.orders.find((x) => x.id === id)
      const changes = Object.fromEntries(Object.entries(patch).filter(([k, v]) => o[k] !== v).map(([k, v]) => [k, [o[k] ?? null, v]]))
      if (Object.keys(changes).length) log('orders', id, 'update', changes)
      Object.assign(o, patch)
      return clone(o)
    },
  },
  audit: {
    list: async (limit = 100) => { await wait(); return clone(db.audit.slice(0, limit)) },
  },
  settings: {
    get: async () => clone(db.settings),
    set: async (key, value) => { db.settings[key] = clone(value) },
  },
  images: {
    upload: async (_id, file) => { await wait(300); return URL.createObjectURL(file) },
    remove: async () => wait(),
  },
  serverAction: async (action, body) => {
    await wait(400)
    if (action === 'yayinla') return { ok: true }
    if (action === 'yedekler') return { files: [{ name: '2026-11-23-02-00-00.json' }] }
    if (action === 'yedek-al') return { counts: { orders: db.orders.length, products: db.products.length } }
    if (action === 'yedek-indir') return { url: 'about:blank' }
    if (action === 'kullanicilar') return { users: clone(db.users), me: 'demo' }
    if (action === 'kullanici-ekle') {
      if (db.users.some((u) => u.email === body.email)) throw new Error('Bu kişi zaten panel kullanıcısı.')
      const u = { user_id: `u${db.users.length + 1}`, role: body.role, email: body.email, created_at: new Date().toISOString() }
      db.users.push(u)
      log('admins', u.user_id, 'insert', { email: u.email, role: u.role })
      return { ok: true, user: clone(u), password: 'DenemeGecici23' }
    }
    if (action === 'kullanici-rol') {
      const u = db.users.find((x) => x.user_id === body.userId)
      log('admins', u.user_id, 'update', { role: [u.role, body.role] })
      u.role = body.role
      return { ok: true, user: clone(u) }
    }
    if (action === 'kullanici-sil') {
      db.users = db.users.filter((x) => x.user_id !== body.userId)
      log('admins', body.userId, 'delete', {})
      return { ok: true }
    }
    if (action === 'kargo') {
      const o = db.orders.find((x) => x.id === body.orderId)
      Object.assign(o, { status: 'kargolandi', carrier: body.carrier, tracking_code: String(body.code).replace(/\s+/g, '') })
      return { ok: true, order: clone(o), mail: { sent: false } }
    }
    if (action === 'iade') {
      const o = db.orders.find((x) => x.id === body.orderId)
      const amount = body.amount ?? Number(o.total) - (o.refunded || 0)
      o.refunded = (o.refunded || 0) + Number(amount)
      if (o.refunded >= o.total) o.status = 'iade'
      o.admin_note = [o.admin_note, `İade ${amount} TL (deneme)`].filter(Boolean).join(' · ')
      return { ok: true, method: 'refund', amount, order: clone(o) }
    }
    return { sent: db.settings.notify_numbers.length, total: db.settings.notify_numbers.length, demo: true }
  },
}
}
