import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { catalog } from '../src/data/catalog.js'
import { finishPayment, signatureOk, startPayment } from '../server/payment.js'
import { recordWhatsAppOrder } from '../server/orders.js'

const p = catalog.find((x) => x.stock !== 'out')
const v = p.variants[0]
const buyer = { name: 'Test Müşteri', phone: '05551112233', email: 'test@example.com', address: 'Test Mahallesi 1. Sokak No 2', city: 'Gaziantep', district: 'Şahinbey' }
const post = (url, body, headers = { 'content-type': 'application/json' }) =>
  new Request(`http://localhost:5173${url}`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) })

describe('startPayment — ödeme başlatma kapıları (iyzico\'ya gitmeden)', () => {
  it('GET isteğini 405 ile reddeder', async () => {
    expect((await startPayment(new Request('http://localhost/api/odeme-baslat'))).status).toBe(405)
  })
  it('JSON olmayan isteği 415 ile reddeder', async () => {
    expect((await startPayment(post('/api/odeme-baslat', '{}', { 'content-type': 'text/plain' }))).status).toBe(415)
  })
  it('sözleşme onayı yoksa 400 döner', async () => {
    const r = await startPayment(post('/api/odeme-baslat', { consent: false, items: [{ id: p.id, variant: v.id, qty: 1 }], buyer }))
    expect(r.status).toBe(400)
    expect((await r.json()).error).toBe('consent')
  })
  it('ekranda görülen tutar sunucununkinden farklıysa 409 price_changed döner', async () => {
    const r = await startPayment(post('/api/odeme-baslat', { consent: true, expectedTotal: 1, items: [{ id: p.id, variant: v.id, qty: 1 }], buyer }))
    expect(r.status).toBe(409)
    expect((await r.json()).error).toBe('price_changed')
  })
  it('e-postasız alıcıyı reddeder', async () => {
    const r = await startPayment(post('/api/odeme-baslat', { consent: true, items: [{ id: p.id, variant: v.id, qty: 1 }], buyer: { ...buyer, email: '' } }))
    expect((await r.json()).fields).toContain('email')
  })
})

describe('finishPayment — ödeme sonucu', () => {
  it('token yoksa hata sayfasına yönlendirir', async () => {
    const r = await finishPayment(post('/api/odeme-sonuc', '', { 'content-type': 'application/x-www-form-urlencoded' }))
    expect(r.status).toBe(303)
    expect(r.headers.get('location')).toContain('durum=hata')
  })
  it('GET ile token kabul etmez (token adres çubuğuna düşmesin)', async () => {
    const r = await finishPayment(new Request('http://localhost/api/odeme-sonuc?token=abc'))
    expect(r.headers.get('location')).toContain('durum=hata')
  })
})

describe('signatureOk — iyzico yanıt imzası', () => {
  const base = { paymentStatus: 'SUCCESS', paymentId: '123', currency: 'TRY', basketId: 'EP1', conversationId: 'EP1', paidPrice: '600.0', price: '600.0' }
  const sign = (r, token) => createHmac('sha256', 'test-secret').update([r.paymentStatus, r.paymentId, r.currency, r.basketId, r.conversationId, '600', '600', token].join(':')).digest('hex')
  it('doğru imzayı kabul eder (ondalık sıfırlar atılarak)', () => {
    expect(signatureOk({ ...base, signature: sign(base, 'tok') }, 'tok')).toBe(true)
  })
  it('değiştirilmiş tutarı reddeder', () => {
    expect(signatureOk({ ...base, paidPrice: '1.0', signature: sign(base, 'tok') }, 'tok')).toBe(false)
  })
  it('imza alanı yoksa (eski hesap ayarı) geçirir', () => {
    expect(signatureOk(base, 'tok')).toBe(true)
  })
})

describe('recordWhatsAppOrder', () => {
  it('panel (veritabanı) kurulu değilse kaydı atlar ve 202 döner', async () => {
    const r = await recordWhatsAppOrder(post('/api/siparis', { id: 'EPWTEST12345678', consent: true }))
    expect(r.status).toBe(202)
  })
})
