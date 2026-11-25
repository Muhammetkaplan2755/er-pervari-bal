/* Satış raporu — yönetici paneli (tarayıcı) ve haftalık WhatsApp raporu
   (sunucu) aynı hesabı kullanır. Saf fonksiyonlar; ağ ya da React yok. */

/* Satış sayılan durumlar. Bekleyen, iptal, başarısız ve iade edilenler hariç. */
export const SOLD = new Set(['odendi', 'onaylandi', 'kargolandi', 'teslim_edildi'])

export const STATUS_LABEL = {
  odeme_bekliyor: 'Ödeme bekliyor',
  odendi: 'Ödendi',
  basarisiz: 'Ödeme başarısız',
  beklemede: 'WhatsApp — onay bekliyor',
  onaylandi: 'Onaylandı',
  iptal: 'İptal',
  kargolandi: 'Kargoda',
  teslim_edildi: 'Teslim edildi',
  iade: 'İade',
}

const num = (v) => Number(v) || 0
const round = (n) => Math.round(n * 100) / 100

/* İstanbul saatiyle ay sınırları (Türkiye UTC+3, yaz saati yok). */
export function monthRange(year, month /* 1-12 */) {
  const from = new Date(Date.UTC(year, month - 1, 1, -3))
  const to = new Date(Date.UTC(year, month, 1, -3))
  return { from: from.toISOString(), to: to.toISOString() }
}

/**
 * orders: veritabanındaki sipariş satırları
 * costs:  [{product_id, variant_id, cost}]
 * Dönen: { byItem: [...], totals: {...}, missingCost: [...] }
 */
export function buildReport(orders, costs = []) {
  const costOf = new Map(costs.map((c) => [`${c.product_id}:${c.variant_id}`, num(c.cost)]))
  const items = new Map()
  const missing = new Set()
  const t = { orders: 0, revenue: 0, products: 0, shipping: 0, commission: 0, extra: 0, cost: 0, card: 0, whatsapp: 0 }

  for (const o of orders) {
    if (!SOLD.has(o.status)) continue
    t.orders += 1
    t[o.channel === 'kart' ? 'card' : 'whatsapp'] += 1
    // Kısmi iade cirodan düşülür (tam iade zaten 'iade' durumundadır ve sayılmaz).
    t.revenue += num(o.total) - num(o.refunded)
    t.products += num(o.subtotal)
    t.shipping += num(o.shipping)
    t.commission += num(o.commission)
    t.extra += num(o.extra_cost)
    for (const it of o.items ?? []) {
      const key = `${it.product_id}:${it.variant_id}`
      const row = items.get(key) ?? { key, product_id: it.product_id, variant_id: it.variant_id, name: it.name, label: it.label, qty: 0, revenue: 0, cost: 0 }
      row.qty += num(it.qty)
      row.revenue += num(it.total)
      if (costOf.has(key)) {
        row.cost += costOf.get(key) * num(it.qty)
      } else {
        missing.add(`${it.name} ${it.label}`.trim())
      }
      items.set(key, row)
    }
  }

  const byItem = [...items.values()]
    .map((r) => ({ ...r, revenue: round(r.revenue), cost: round(r.cost), profit: round(r.revenue - r.cost) }))
    .sort((a, b) => b.revenue - a.revenue)
  t.cost = byItem.reduce((s, r) => s + r.cost, 0)
  for (const k of Object.keys(t)) t[k] = round(t[k])
  // Net kazanç: tahsil edilen − iyzico kesintisi − elle girilen giderler − ürün maliyeti
  t.net = round(t.revenue - t.commission - t.extra - t.cost)
  return { byItem, totals: t, missingCost: [...missing] }
}

const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })
export const money = (n) => tl.format(num(n))
