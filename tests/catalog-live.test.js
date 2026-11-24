import { describe, expect, it } from 'vitest'
import { SHIPPING, catalog, findItem } from '../src/data/catalog.js'
import { cleanBuyer, clientIp, priceOrder, sameSiteJson } from '../server/catalog-live.js'

const first = catalog.find((p) => p.stock !== 'out')
const v = first.variants[0]

describe('priceOrder — fiyat her zaman sunucuda hesaplanır', () => {
  it('kalemleri katalog fiyatıyla toplar, tarayıcının fiyatını yok sayar', async () => {
    const o = await priceOrder([{ id: first.id, variant: v.id, qty: 2, price: 1 }])
    expect(o.subtotal).toBe(v.price * 2)
    expect(o.lines[0].variant.price).toBe(findItem(first.id, v.id).variant.price)
  })

  it('ücretsiz kargo sınırının altında kargo ekler, üstünde eklemez', async () => {
    const cheap = await priceOrder([{ id: first.id, variant: v.id, qty: 1 }])
    expect(cheap.shipping).toBe(v.price >= SHIPPING.freeOver ? 0 : SHIPPING.fee)
    const many = Math.ceil(SHIPPING.freeOver / v.price)
    const big = await priceOrder([{ id: first.id, variant: v.id, qty: many }])
    expect(big.shipping).toBe(0)
    expect(big.total).toBe(big.subtotal)
  })

  it.each([
    [[], 'boş sepet'],
    [[{ id: 'yok-boyle-urun', variant: 'x', qty: 1 }], 'bilinmeyen ürün'],
    [[{ id: first.id, variant: 'yok', qty: 1 }], 'bilinmeyen boyut'],
    [[{ id: first.id, variant: v.id, qty: 0 }], 'sıfır adet'],
    [[{ id: first.id, variant: v.id, qty: 100 }], '99 üstü adet'],
    [[{ id: first.id, variant: v.id, qty: 1.5 }], 'kesirli adet'],
    ['sepet', 'dizi olmayan girdi'],
  ])('geçersiz sepeti reddeder: %#', async (items) => {
    expect(await priceOrder(items)).toBeNull()
  })
})

describe('cleanBuyer — müşteri bilgisi doğrulama', () => {
  const ok = { name: 'Ali Veli', phone: '0555 111 22 33', email: 'a@b.co', address: 'Test Mahallesi 1. Sokak No 2', city: 'Gaziantep', district: 'Şahinbey' }
  it('geçerli bilgiyi kabul eder ve telefonu yalnızca rakama indirir', () => {
    const { buyer, errors } = cleanBuyer(ok, { needEmail: true })
    expect(errors).toEqual([])
    expect(buyer.phone).toBe('05551112233')
  })
  it('eksik alanları listeler', () => {
    const { errors } = cleanBuyer({ name: 'A', phone: '12', email: 'x', address: 'kısa' }, { needEmail: true })
    expect(errors).toEqual(expect.arrayContaining(['name', 'phone', 'email', 'address', 'city', 'district']))
  })
  it('çok uzun metni keser', () => {
    const { buyer } = cleanBuyer({ ...ok, note: 'x'.repeat(5000) })
    expect(buyer.note.length).toBe(500)
  })
})

describe('clientIp — yalnızca platformun verdiği IP', () => {
  const req = (h = {}) => new Request('http://localhost/api/x', { headers: h })
  it('platform bağlamındaki IP önceliklidir; istemci başlığı yok sayılır', () => {
    expect(clientIp(req({ 'x-nf-client-connection-ip': '6.6.6.6' }), { ip: '1.2.3.4' })).toBe('1.2.3.4')
  })
  it('IPv6 adresini /64 ağına indirger', () => {
    expect(clientIp(req(), { ip: '2001:db8:1:2:3:4:5:6' })).toBe('2001:db8:1:2::/64')
  })
})

describe('sameSiteJson — CSRF koruması', () => {
  const req = (h) => new Request('http://localhost:5173/api/siparis', { method: 'POST', headers: h, body: '{}' })
  it('JSON olmayan içerik türünü 415 ile reddeder', () => {
    expect(sameSiteJson(req({ 'content-type': 'text/plain' })).status).toBe(415)
  })
  it('başka siteden gelen isteği 403 ile reddeder', () => {
    expect(sameSiteJson(req({ 'content-type': 'application/json', origin: 'https://kotu.example' })).status).toBe(403)
  })
  it('aynı siteden JSON isteğe izin verir', () => {
    expect(sameSiteJson(req({ 'content-type': 'application/json', origin: 'http://localhost:5173' }))).toBeNull()
  })
})
