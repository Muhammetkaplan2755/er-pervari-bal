import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleIyzicoWebhook, reconcilePayments } from '../server/reconcile.js'

/* Sahte Supabase + iyzico: gerçek ağa çıkılmaz. Sipariş tablosu bellekte tutulur. */
const NOW = new Date('2026-11-24T12:00:00Z')
const ago = (min) => new Date(NOW - min * 60000).toISOString()
let orders
let iyzicoReply
let patches

function fakeFetch(url, opts = {}) {
  const u = String(url)
  if (u.includes('iyzipay.com')) return Promise.resolve(new Response(JSON.stringify(iyzicoReply(JSON.parse(opts.body).token))))
  if (u.includes('/rest/v1/orders')) {
    const q = new URL(u)
    if (opts.method === 'PATCH') {
      const id = q.searchParams.get('id').replace('eq.', '')
      const need = q.searchParams.get('status')?.replace('eq.', '')
      const o = orders.find((x) => x.id === id)
      if (!o || (need && o.status !== need)) return Promise.resolve(new Response('[]'))
      Object.assign(o, JSON.parse(opts.body))
      patches.push({ id, ...JSON.parse(opts.body) })
      return Promise.resolve(new Response(JSON.stringify([o])))
    }
    if (q.searchParams.get('status') === 'eq.odeme_bekliyor') {
      const lt = q.searchParams.getAll('created_at').find((x) => x.startsWith('lt.')).slice(3)
      const gt = q.searchParams.getAll('created_at').find((x) => x.startsWith('gt.')).slice(3)
      return Promise.resolve(new Response(JSON.stringify(orders.filter((o) => o.status === 'odeme_bekliyor' && o.created_at < lt && o.created_at > gt))))
    }
    const id = q.searchParams.get('id')?.replace('eq.', '')
    return Promise.resolve(new Response(JSON.stringify(orders.filter((o) => o.id === id))))
  }
  return Promise.resolve(new Response('{}'))
}

const paid = (id, total) => ({ status: 'success', paymentStatus: 'SUCCESS', basketId: id, conversationId: id, paidPrice: `${total}.0`, price: `${total}.0`, currency: 'TRY', paymentId: `P-${id}`, fraudStatus: 1, iyziCommissionRateAmount: '10', iyziCommissionFee: '0.25', itemTransactions: [{ merchantPayoutAmount: `${total - 10.25}` }] })

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  vi.stubEnv('IYZICO_API_KEY', 'k')
  vi.stubEnv('IYZICO_SECRET_KEY', 's')
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
  patches = []
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('reconcilePayments — dönüşü gelmeyen ödemeler', () => {
  it('ödenmiş ama tarayıcısı dönmemiş siparişi "ödendi" yapar, kesintiyi kaydeder', async () => {
    orders = [{ id: 'EP1', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(20), provider_token: 'tok-1' }]
    iyzicoReply = () => paid('EP1', 600)
    const r = await reconcilePayments(NOW)
    expect(r.paid).toBe(1)
    expect(orders[0].status).toBe('odendi')
    expect(orders[0].commission).toBe(10.25)
  })

  it('3D doğrulaması süren yeni ödemeye dokunmaz', async () => {
    orders = [{ id: 'EP2', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(20), provider_token: 'tok-2' }]
    iyzicoReply = () => ({ status: 'success', paymentStatus: 'INIT_THREEDS', basketId: 'EP2' })
    const r = await reconcilePayments(NOW)
    expect(r.waiting).toBe(1)
    expect(patches).toHaveLength(0)
  })

  it('1 saati geçmiş, ödenmemiş siparişi "başarısız" yapar', async () => {
    orders = [{ id: 'EP3', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(90), provider_token: 'tok-3' }]
    iyzicoReply = () => ({ status: 'failure', errorMessage: 'Ödeme tamamlanmadı' })
    await reconcilePayments(NOW)
    expect(orders[0].status).toBe('basarisiz')
  })

  it('tutar uyuşmazsa "ödendi" yapmaz, kontrol notu düşer', async () => {
    orders = [{ id: 'EP4', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(20), provider_token: 'tok-4' }]
    iyzicoReply = () => paid('EP4', 1)
    await reconcilePayments(NOW)
    expect(orders[0].status).toBe('odeme_bekliyor')
    expect(orders[0].admin_note).toMatch(/KONTROL EDİN/)
  })

  it('10 dakikadan yeni siparişi henüz sormaz', async () => {
    orders = [{ id: 'EP5', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(3), provider_token: 'tok-5' }]
    iyzicoReply = () => paid('EP5', 600)
    expect((await reconcilePayments(NOW)).checked).toBe(0)
  })
})

describe('iyzico bildirimi (webhook)', () => {
  const req = (body) => new Request('http://localhost/api/iyzico-bildirim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

  it('geçersiz token\'ı reddeder', async () => {
    expect((await handleIyzicoWebhook(req({ token: '<script>' }))).status).toBe(400)
  })
  it('bildirimdeki "başarılı" yazısına değil, iyzico sorgusuna güvenir', async () => {
    orders = [{ id: 'EP6', status: 'odeme_bekliyor', channel: 'kart', total: 600, created_at: ago(1), provider_token: 'tok-6-abcdef12' }]
    iyzicoReply = () => ({ status: 'success', paymentStatus: 'FAILURE', basketId: 'EP6' })
    const r = await handleIyzicoWebhook(req({ token: 'tok-6-abcdef12', status: 'SUCCESS', paymentConversationId: 'EP6' }))
    expect(r.status).toBe(200)
    expect(orders[0].status).not.toBe('odendi')
  })
})
