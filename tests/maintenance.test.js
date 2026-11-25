import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { anonymizeStale, backupNow, signedBackupUrl } from '../server/maintenance.js'
import { alertOwner, notifyOrder } from '../server/whatsapp.js'

/* Sahte Supabase + Telegram: gerçek ağa çıkılmaz. */
const NOW = new Date('2026-11-25T00:00:00Z')
let calls
let stale
let files

function fakeFetch(url, opts = {}) {
  const u = String(url)
  calls.push({ url: u, method: opts.method ?? 'GET', body: opts.body })
  if (u.includes('/rest/v1/orders') && opts.method === 'PATCH') return Promise.resolve(new Response('[{}]'))
  if (u.includes('/rest/v1/orders') && u.includes('status=in.')) return Promise.resolve(new Response(JSON.stringify(stale)))
  if (u.includes('/rest/v1/')) return Promise.resolve(new Response('[{"id":1},{"id":2}]'))
  if (u.includes('/storage/v1/object/list/')) return Promise.resolve(new Response(JSON.stringify(files)))
  if (u.includes('/storage/v1/object/sign/')) return Promise.resolve(new Response('{"signedURL":"/object/sign/yedekler/x.json?token=t"}'))
  if (u.includes('/storage/v1/')) return Promise.resolve(new Response('{}'))
  if (u.includes('api.telegram.org')) return Promise.resolve(new Response('{"ok":true}'))
  return Promise.resolve(new Response('{}'))
}

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_test_key')
  calls = []
  stale = []
  files = []
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('KVKK saklama süresi', () => {
  it('eski tamamlanmamış siparişin kişi bilgisini siler, il/ilçeyi bırakır', async () => {
    stale = [{ id: 'EP1', customer: { name: 'Ali', phone: '0555', address: 'Sokak 1', email: 'a@b.c', city: 'Gaziantep', district: 'Şahinbey' } }]
    const r = await anonymizeStale(NOW)
    expect(r).toEqual({ anonymized: 1, days: 30 })
    const patch = JSON.parse(calls.find((c) => c.method === 'PATCH').body)
    expect(patch.customer).toEqual({ anonymized: true, city: 'Gaziantep', district: 'Şahinbey' })
    expect(patch.ip).toBeNull()
    expect(JSON.stringify(patch)).not.toMatch(/Ali|0555|Sokak|a@b\.c/)
  })

  it('yalnızca tamamlanmamış durumları ve süresi dolanları sorar', async () => {
    await anonymizeStale(NOW)
    const q = decodeURIComponent(calls[0].url)
    expect(q).toMatch(/status=in\.\(/)
    expect(q).not.toMatch(/odendi|kargolandi|teslim_edildi/)
    expect(q).toContain(`lt.${new Date(NOW - 30 * 864e5).toISOString()}`)
  })

  it('saklama süresi 7 günden kısa ayarlanamaz', async () => {
    vi.stubEnv('RETENTION_DAYS', '1')
    expect((await anonymizeStale(NOW)).days).toBe(7)
  })
})

describe('yedek', () => {
  it('tüm tabloları gizli depoya yükler ve 8 yedekten eskisini siler', async () => {
    files = Array.from({ length: 10 }, (_, i) => ({ name: `2026-11-${String(25 - i).padStart(2, '0')}-02-00-00.json` }))
    const r = await backupNow(NOW)
    expect(r.name).toBe('2026-11-25-00-00-00.json')
    expect(r.counts.orders).toBe(2)
    const up = calls.find((c) => c.url.endsWith(`/object/yedekler/${r.name}`))
    expect(Object.keys(JSON.parse(up.body).tables)).toEqual(['products', 'variant_costs', 'inventory', 'orders', 'settings', 'admins'])
    const del = calls.find((c) => c.method === 'DELETE')
    expect(JSON.parse(del.body).prefixes).toEqual(['2026-11-17-02-00-00.json', '2026-11-16-02-00-00.json'])
    expect(r.removed).toBe(2)
  })

  it('indirme bağlantısı yalnızca yedek adı biçiminde üretilir', async () => {
    await expect(signedBackupUrl('../orders.json')).rejects.toThrow('geçersiz')
    expect(await signedBackupUrl('2026-11-25-00-00-00.json')).toBe('https://test.supabase.co/storage/v1/object/sign/yedekler/x.json?token=t')
  })
})

describe('Telegram bildirimi', () => {
  const order = { id: 'EP9', payment_method: 'kart', channel: 'kart', total: 1200, items: [{ qty: 1, name: 'Süzme', label: '1 kg' }], customer: { name: 'Ayşe Yılmaz', phone: '05551112233', address: 'Gizli Sokak 5', city: 'İzmir', district: 'Bornova' } }

  it('ayar yoksa hiçbir şey göndermez', async () => {
    expect((await notifyOrder(order)).sent).toBe(0)
    expect(calls.some((c) => c.url.includes('telegram'))).toBe(false)
  })

  it('sipariş bildirimi her sohbete gider, müşteri kişi bilgisi içermez', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-bot-token')
    vi.stubEnv('TELEGRAM_CHAT_IDS', '11111111, -22222222')
    const r = await notifyOrder(order)
    expect(r.telegram).toBe(2)
    const sent = calls.filter((c) => c.url.includes('api.telegram.org')).map((c) => JSON.parse(c.body))
    expect(sent.map((s) => s.chat_id)).toEqual(['11111111', '-22222222'])
    expect(sent[0].text).toContain('EP9')
    expect(sent[0].text).toContain('İzmir / Bornova')
    expect(sent[0].text).not.toMatch(/Ayşe|0555|Gizli Sokak/)
  })

  it('kritik uyarı Telegram ile gider', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-bot-token')
    vi.stubEnv('TELEGRAM_CHAT_IDS', '11111111')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await alertOwner('test uyarı')).sent).toBe(1)
  })
})
