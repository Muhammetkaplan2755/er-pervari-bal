import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildReport, monthRange } from '../src/admin/report.js'
import { lastWeekRange } from '../server/admin.js'
import { broadcast, normalizeNumber, notifyOrder } from '../server/whatsapp.js'

describe('buildReport — aylık rapor hesabı', () => {
  const item = (pid, vid, qty, total) => ({ product_id: pid, variant_id: vid, name: pid, label: vid, qty, total })
  const orders = [
    { status: 'odendi', channel: 'kart', total: 1850, subtotal: 1700, shipping: 150, commission: 52.3, extra_cost: 0, items: [item('suzme', '1kg', 2, 1700)] },
    { status: 'onaylandi', channel: 'whatsapp', total: 600, subtotal: 450, shipping: 150, commission: 0, extra_cost: 120, items: [item('suzme', '500g', 1, 450)] },
    { status: 'beklemede', channel: 'whatsapp', total: 999, subtotal: 999, shipping: 0, items: [item('x', 'y', 1, 999)] },
    { status: 'iptal', channel: 'kart', total: 500, subtotal: 500, shipping: 0, items: [item('x', 'y', 1, 500)] },
  ]
  const r = buildReport(orders, [{ product_id: 'suzme', variant_id: '1kg', cost: 500 }])

  it('yalnızca satış sayılan durumları toplar', () => {
    expect(r.totals.orders).toBe(2)
    expect(r.totals.revenue).toBe(2450)
  })
  it('net kazanç = ciro − kesinti − ek gider − maliyet', () => {
    expect(r.totals.net).toBe(1277.7) // 2450 − 52,3 − 120 − 1000, kuruşa yuvarlanmış
  })
  it('maliyeti girilmemiş ürünü uyarı listesine koyar', () => {
    expect(r.missingCost).toEqual(['suzme 500g'])
  })
  it('ay sınırları İstanbul saatiyle hesaplanır', () => {
    expect(monthRange(2026, 11)).toEqual({ from: '2026-10-31T21:00:00.000Z', to: '2026-11-30T21:00:00.000Z' })
  })
  it('haftalık rapor geçen 7 günü kapsar (bugün hariç)', () => {
    const w = lastWeekRange(new Date('2026-11-30T06:00:00Z'))
    expect(w.from).toBe('2026-11-22T21:00:00.000Z')
    expect(w.to).toBe('2026-11-29T21:00:00.000Z')
  })
})

describe('WhatsApp bildirimi — KVKK: müşteri kişisel verisi gönderilmez', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const order = { id: 'EP1', payment_method: 'kart', channel: 'kart', total: 1850, customer: { name: 'Ayşe Yılmaz', phone: '05551112233', address: 'Gizli Sokak 5', city: 'Gaziantep', district: 'Şahinbey' }, items: [{ qty: 2, name: 'Süzme bal', label: '1 kg' }] }

  it('numaraları 905xxxxxxxxx biçimine getirir, geçersizi atar', () => {
    expect(normalizeNumber('0555 111 22 33')).toBe('905551112233')
    expect(normalizeNumber('5551112233')).toBe('905551112233')
    expect(normalizeNumber('12345')).toBeNull()
  })
  it('ayar yoksa göndermez', async () => {
    expect((await broadcast('x', [], 'y')).sent).toBe(0)
  })
  it('CallMeBot mesajında ad, telefon ve adres yok', async () => {
    vi.stubEnv('CALLMEBOT', '905550000000:abc')
    const calls = []
    vi.stubGlobal('fetch', async (u) => { calls.push(decodeURIComponent(String(u))); return new Response('Message queued') })
    const r = await notifyOrder(order)
    expect(r.sent).toBe(1)
    expect(calls[0]).not.toMatch(/Ayşe|05551112233|Gizli Sokak/)
    expect(calls[0]).toContain('EP1')
  })
  it('Meta şablon değişkenlerinde ad ve telefon yok', async () => {
    vi.stubEnv('WHATSAPP_TOKEN', 't')
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', '1')
    vi.stubEnv('WHATSAPP_NOTIFY', '905550000000')
    let body
    vi.stubGlobal('fetch', async (_u, o) => { body = o.body; return new Response('{}') })
    await notifyOrder(order)
    expect(body).not.toMatch(/Ayşe|05551112233|Gizli Sokak/)
  })
})
