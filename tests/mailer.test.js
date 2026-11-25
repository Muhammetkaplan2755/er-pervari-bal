import { afterEach, describe, expect, it, vi } from 'vitest'
import { orderEmailHtml, sendOrderEmail } from '../server/mailer.js'

const order = {
  id: 'EP9',
  total: 1850,
  shipping: 0,
  consent_at: '2026-11-25T09:00:00Z',
  customer: { name: 'Ayşe <b>Yılmaz</b>', email: 'ayse@example.com', address: 'Test Mah. 1. Sk. No 2', city: 'Gaziantep', district: 'Şahinbey' },
  items: [{ qty: 2, name: 'Süzme bal', label: '1 kg', total: 1700 }],
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('orderEmailHtml — onay e-postası içeriği', () => {
  const html = orderEmailHtml(order)
  it('sipariş no, ürünler ve toplamı içerir', () => {
    expect(html).toContain('EP9')
    expect(html).toContain('2 × Süzme bal 1 kg')
    expect(html).toMatch(/1\.850/)
  })
  it('ön bilgilendirme ve mesafeli satış sözleşmesinin tam metnini içerir', () => {
    expect(html).toContain('Ön bilgilendirme formu')
    expect(html).toContain('Mesafeli satış sözleşmesi')
    expect(html).toContain('Cayma hakkı')
  })
  it('müşteri girdisini HTML olarak çalıştırmaz (kaçışlı)', () => {
    expect(html).not.toContain('<b>Yılmaz</b>')
    expect(html).toContain('&lt;b&gt;Yılmaz')
  })
})

describe('sendOrderEmail', () => {
  it('ayar yoksa göndermez, hata da fırlatmaz', async () => {
    expect(await sendOrderEmail(order)).toMatchObject({ sent: false })
  })
  it('ayar varsa Brevo\'ya müşteri adresiyle gönderir', async () => {
    vi.stubEnv('BREVO_API_KEY', 'test')
    vi.stubEnv('MAIL_FROM', 'siparis@example.com')
    let sent
    vi.stubGlobal('fetch', async (url, opts) => { sent = { url: String(url), body: JSON.parse(opts.body) }; return new Response('{}', { status: 201 }) })
    expect(await sendOrderEmail(order)).toEqual({ sent: true })
    expect(sent.url).toContain('api.brevo.com')
    expect(sent.body.to[0].email).toBe('ayse@example.com')
    expect(sent.body.subject).toContain('EP9')
  })
  it('Brevo hata verirse sipariş akışını bozmaz', async () => {
    vi.stubEnv('BREVO_API_KEY', 'test')
    vi.stubEnv('MAIL_FROM', 'siparis@example.com')
    vi.stubGlobal('fetch', async () => new Response('bad', { status: 401 }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await sendOrderEmail(order)).sent).toBe(false)
  })
})
