/* Yönetici paneli için sunucu işleri (giriş yapmış admin gerekir):
     POST /api/yonetim/yayinla        siteyi yeni fiyatlarla yeniden yayınla (Netlify build hook)
     POST /api/yonetim/test-bildirim  bildirim numaralarına deneme mesajı
     POST /api/yonetim/haftalik       haftalık raporu şimdi gönder
     POST /api/yonetim/yedek-al | yedekler | yedek-indir   veritabanı yedeği (gizli depo)
     POST /api/yonetim/kargo          kargoya ver: { orderId, carrier, code } → durum kargoda + takip bağlantısı
     POST /api/yonetim/iade           kart siparişini iyzico ile iptal / iade et ({ orderId, amount? })
   Ortam: NETLIFY_BUILD_HOOK (Netlify → Site configuration → Build hooks; GİZLİ). */
import { buildReport, money } from '../src/admin/report.js'
import { clientIp, json } from './catalog-live.js'
import { db, dbEnabled, requireAdmin } from './db.js'
import { refundOrder } from './refund.js'
import { markShipped } from './shipping.js'
import { backupNow, listBackups, signedBackupUrl } from './maintenance.js'
import { TEMPLATES, broadcast, notifyEnabled } from './whatsapp.js'

const env = (k) => (typeof process !== 'undefined' ? process.env[k] : undefined)

const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', timeZone: 'Europe/Istanbul' })

/* Son 7 gün (bugün hariç, İstanbul saatiyle). */
export function lastWeekRange(now = new Date()) {
  const trNow = new Date(now.getTime() + 3 * 3600 * 1000)
  const end = new Date(Date.UTC(trNow.getUTCFullYear(), trNow.getUTCMonth(), trNow.getUTCDate(), -3))
  const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000)
  return { from: start.toISOString(), to: end.toISOString(), label: `${dateFmt.format(start)} – ${dateFmt.format(new Date(end.getTime() - 1))}` }
}

/* Şablon "haftalik_rapor" — 7 değişken, sırası KURULUM-YONETIM.md ile aynı. */
export async function sendWeeklyReport() {
  if (!dbEnabled()) return { skipped: 'veritabanı ayarı yok' }
  if (!notifyEnabled()) return { skipped: 'bildirim ayarı yok' }
  const enabled = await db.setting('weekly_report')
  if (enabled === false) return { skipped: 'panelden kapalı' }
  const range = lastWeekRange()
  const [orders, costs] = await Promise.all([db.ordersBetween(range.from, range.to), db.costs()])
  const { byItem, totals } = buildReport(orders, costs)
  const top = byItem.slice(0, 3).map((r) => `${r.name} ${r.label} (${r.qty})`).join(', ') || 'satış yok'
  const params = [
    range.label,
    String(totals.orders),
    money(totals.revenue),
    money(totals.commission),
    money(totals.cost + totals.extra),
    money(totals.net),
    top,
  ]
  const text = [
    `📊 Er Pervari Bal haftalık özet (${params[0]})`,
    `Sipariş: ${params[1]}`,
    `Ciro: ${params[2]}`,
    `Banka / iyzico kesintisi: ${params[3]}`,
    `Maliyet ve giderler: ${params[4]}`,
    `Net kazanç: ${params[5]}`,
    `En çok satanlar: ${params[6]}`,
  ].join('\n')
  return broadcast(TEMPLATES.weekly, params, text)
}

export async function adminAction(request, ctx = {}) {
  if (request.method !== 'POST') return json(405, { error: 'method' })
  const user = await requireAdmin(request)
  if (!user) return json(401, { error: 'auth' })
  const url = new URL(request.url)
  const action = url.searchParams.get('action') || url.pathname.split('/').pop()

  try {
    if (action === 'yayinla') {
      const hook = env('NETLIFY_BUILD_HOOK')
      if (!hook) return json(501, { error: 'NETLIFY_BUILD_HOOK tanımlı değil' })
      const res = await fetch(hook, { method: 'POST' })
      return json(res.ok ? 200 : 502, { ok: res.ok })
    }
    if (action === 'test-bildirim') {
      const r = await broadcast(
        TEMPLATES.order,
        ['DENEME · panel', 'Gaziantep / Şahinbey', '1× Süzme bal 1 kg', money(0)],
        '✅ Er Pervari Bal: deneme bildirimi. Sipariş bildirimleri bu numaraya gelecek.',
      )
      return json(200, r)
    }
    if (action === 'haftalik') return json(200, await sendWeeklyReport())
    if (action === 'yedek-al') return json(200, await backupNow())
    if (action === 'yedekler') return json(200, { files: await listBackups() })
    if (action === 'yedek-indir') {
      let body = {}
      try { body = await request.json() } catch { return json(400, { error: 'json' }) }
      return json(200, { url: await signedBackupUrl(body.name) })
    }
    if (action === 'kargo') {
      let body = {}
      try { body = await request.json() } catch { return json(400, { error: 'json' }) }
      const r = await markShipped(body.orderId, body.carrier, body.code)
      return json(r.ok ? 200 : 400, r.ok ? r : { error: r.error })
    }
    if (action === 'iade') {
      let body = {}
      try { body = await request.json() } catch { return json(400, { error: 'json' }) }
      const r = await refundOrder(body.orderId, body.amount, { ip: clientIp(request, ctx) })
      return json(r.ok ? 200 : 400, r.ok ? r : { error: r.error })
    }
  } catch (e) {
    console.error('yonetim', action, e.message)
    return json(502, { error: e.message })
  }
  return json(404, { error: 'action' })
}
