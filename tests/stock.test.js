import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { catalog } from '../src/data/catalog.js'
import { recordWhatsAppOrder } from '../server/orders.js'
import { startPayment } from '../server/payment.js'

/* Veritabanı stok tetikleyicisi siparişi reddederse (son ürünü başkası almış),
   sunucu 409 "stock" döner ve ödeme hiç başlamaz. Supabase sahte (mock). */
const p = catalog.find((x) => x.stock !== 'out')
const v = p.variants[0]
const buyer = { name: 'Test Müşteri', phone: '05551112233', email: 'test@example.com', address: 'Test Mahallesi 1. Sokak No 2', city: 'Gaziantep', district: 'Şahinbey' }
const post = (url, body) => new Request(`http://localhost:5173${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
let iyzicoCalled

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  vi.stubEnv('IYZICO_API_KEY', 'k')
  iyzicoCalled = false
  vi.stubGlobal('fetch', async (url, opts = {}) => {
    const u = String(url)
    if (u.includes('iyzipay.com')) { iyzicoCalled = true; return new Response('{}') }
    if (u.includes('/rest/v1/orders') && opts.method === 'POST') {
      return new Response(JSON.stringify({ code: 'P0001', message: `stok_yetersiz: ${p.id} ${v.id}` }), { status: 400 })
    }
    return new Response('[]') // ürünler (boş → katalog) ve IP sınırı sorgusu
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('stok tükendiğinde', () => {
  it('kartlı ödeme 409 stock döner ve iyzico\'ya hiç gidilmez', async () => {
    const r = await startPayment(post('/api/odeme-baslat', { consent: true, items: [{ id: p.id, variant: v.id, qty: 1 }], buyer }))
    expect(r.status).toBe(409)
    expect((await r.json()).error).toBe('stock')
    expect(iyzicoCalled).toBe(false)
  })
  it('WhatsApp siparişi 409 stock döner', async () => {
    const r = await recordWhatsAppOrder(post('/api/siparis', { id: 'EPWSTOK12345678', consent: true, items: [{ id: p.id, variant: v.id, qty: 1 }], buyer }))
    expect(r.status).toBe(409)
    expect((await r.json()).error).toBe('stock')
  })
})
