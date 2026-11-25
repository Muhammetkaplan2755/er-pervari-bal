import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shippingEmailHtml } from '../server/mailer.js'
import { markShipped, trackingUrl } from '../server/shipping.js'

let order
let patched

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  patched = null
  order = { id: 'EP8', status: 'odendi', channel: 'kart', customer: { name: 'Ali', email: 'ali@example.com' } }
  vi.stubGlobal('fetch', async (_url, opts = {}) => {
    if (opts.method === 'PATCH') { patched = JSON.parse(opts.body); Object.assign(order, patched); return new Response(JSON.stringify([order])) }
    return new Response(JSON.stringify([order]))
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('markShipped — kargoya verme', () => {
  it('siparişi "kargoda" yapar ve firmanın takip bağlantısını üretir', async () => {
    const r = await markShipped('EP8', 'aras', ' 1234 5678 ')
    expect(r.ok).toBe(true)
    expect(patched).toEqual({ status: 'kargolandi', carrier: 'aras', tracking_code: '12345678' })
    expect(r.url).toBe(trackingUrl('aras', '12345678'))
    expect(r.url).toContain('12345678')
  })
  it('e-posta ayarı yoksa yine kargoya verir (e-posta atlanır)', async () => {
    const r = await markShipped('EP8', 'ptt', 'AB12345')
    expect(r.ok).toBe(true)
    expect(r.mail.sent).toBe(false)
  })
  it.each([
    ['bilinmeyen firma', 'dhl-x', '12345678'],
    ['geçersiz takip no', 'aras', '12'],
    ['zararlı karakter', 'aras', '1234<script>'],
  ])('reddeder: %s', async (_n, carrier, code) => {
    expect((await markShipped('EP8', carrier, code)).ok).toBe(false)
    expect(patched).toBeNull()
  })
  it('ödenmemiş / iptal siparişi kargoya vermez', async () => {
    order.status = 'iptal'
    expect((await markShipped('EP8', 'aras', '12345678')).ok).toBe(false)
  })
})

describe('kargo e-postası', () => {
  it('takip bağlantısını ve numarayı içerir, girdiyi kaçışlar', () => {
    const html = shippingEmailHtml({ id: 'EP8' }, { url: 'https://kargo.example/?q=1&x=2', carrier: 'Aras <Kargo>', code: '123' })
    expect(html).toContain('Takip no: <strong>123</strong>')
    expect(html).toContain('href="https://kargo.example/?q=1&amp;x=2"')
    expect(html).not.toContain('<Kargo>')
  })
})
