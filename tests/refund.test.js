import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildReport } from '../src/admin/report.js'
import { refundOrder } from '../server/refund.js'

/* Sahte Supabase + iyzico. İade gerçek ağa çıkmaz. */
const TODAY = new Date('2026-11-25T12:00:00Z')
let order
let calls
let iyz

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  vi.stubEnv('IYZICO_API_KEY', 'k')
  vi.stubEnv('IYZICO_SECRET_KEY', 's')
  calls = []
  iyz = { '/payment/cancel': { status: 'success' }, '/v2/payment/refund': { status: 'success' } }
  order = { id: 'EP7', channel: 'kart', status: 'odendi', total: 600, refunded: 0, provider_payment_id: '999', created_at: '2026-11-25T08:00:00Z', admin_note: '' }
  vi.stubGlobal('fetch', async (url, opts = {}) => {
    const u = String(url)
    if (u.includes('iyzipay.com')) {
      const path = new URL(u).pathname
      calls.push({ path, body: JSON.parse(opts.body) })
      return new Response(JSON.stringify(iyz[path]))
    }
    if (opts.method === 'PATCH') { Object.assign(order, JSON.parse(opts.body)); return new Response(JSON.stringify([order])) }
    return new Response(JSON.stringify([order]))
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('refundOrder — panelden kart iadesi', () => {
  it('aynı gün tam iadede önce iptal kullanır ve durumu "iade" yapar', async () => {
    const r = await refundOrder('EP7', undefined, { now: TODAY })
    expect(r.ok).toBe(true)
    expect(r.method).toBe('cancel')
    expect(calls.map((c) => c.path)).toEqual(['/payment/cancel'])
    expect(order.status).toBe('iade')
    expect(order.refunded).toBe(600)
  })
  it('iptal reddedilirse tutarla iade (v2) yapar', async () => {
    iyz['/payment/cancel'] = { status: 'failure', errorMessage: 'iptal süresi geçti' }
    const r = await refundOrder('EP7', 600, { now: TODAY })
    expect(r.method).toBe('refund')
    expect(calls[1]).toMatchObject({ path: '/v2/payment/refund', body: { paymentId: '999', price: '600', currency: 'TRY' } })
  })
  it('kısmi iadede durum değişmez, iade edilen tutar birikir', async () => {
    const r = await refundOrder('EP7', 150, { now: TODAY })
    expect(r.method).toBe('refund')
    expect(order.status).toBe('odendi')
    expect(order.refunded).toBe(150)
    expect(order.admin_note).toMatch(/İade 150 TL/)
  })
  it('kalan tutardan fazlasını reddeder', async () => {
    order.refunded = 500
    const r = await refundOrder('EP7', 200, { now: TODAY })
    expect(r.ok).toBe(false)
    expect(calls).toHaveLength(0)
  })
  it('kartla ödenmemiş ya da ödenmemiş siparişi reddeder', async () => {
    order.channel = 'whatsapp'
    expect((await refundOrder('EP7', 100, { now: TODAY })).ok).toBe(false)
    order.channel = 'kart'
    order.status = 'odeme_bekliyor'
    expect((await refundOrder('EP7', 100, { now: TODAY })).ok).toBe(false)
    expect(calls).toHaveLength(0)
  })
  it('iyzico iadeyi reddederse kaydı değiştirmez', async () => {
    iyz['/v2/payment/refund'] = { status: 'failure', errorMessage: 'yetersiz bakiye' }
    const r = await refundOrder('EP7', 100, { now: new Date('2026-11-28T12:00:00Z') })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/yetersiz bakiye/)
    expect(order.refunded).toBe(0)
  })
})

describe('rapor kısmi iadeyi cirodan düşer', () => {
  it('ciro = toplam − iade edilen', () => {
    const r = buildReport([{ status: 'odendi', channel: 'kart', total: 600, refunded: 150, subtotal: 450, shipping: 150, items: [] }])
    expect(r.totals.revenue).toBe(450)
  })
})
