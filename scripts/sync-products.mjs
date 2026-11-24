/* Build'in ilk adımı: yönetici panelinde (Supabase) kaydedilen ürünleri
   src/data/products.js'e yazar; sayfalar, ürün feed'leri ve Google için
   üretilen HTML bu listeden çıkar. Panel ortam değişkenleri yoksa
   hiçbir şey yapmaz ve dosyadaki liste kullanılır.
   Gerekli: VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY (herkese açık anahtar;
   yalnızca aktif ürünler okunabilir). */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.log('sync-products: Supabase ayarı yok, src/data/products.js olduğu gibi kullanılıyor.')
  process.exit(0)
}

const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/products?select=id,category,stock,name,note,variants,images&active=eq.true&order=sort.asc,id.asc`, {
  // Yeni anahtarlar (sb_publishable_…) JWT değildir: yalnızca apikey başlığıyla gider.
  headers: key.startsWith('sb_') ? { apikey: key } : { apikey: key, authorization: `Bearer ${key}` },
})
if (!res.ok) {
  console.error(`sync-products: Supabase okunamadı (${res.status}). Build durduruldu; eski fiyatlarla yayına çıkmamak için.`)
  process.exit(1)
}
const rows = await res.json()
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('sync-products: veritabanında aktif ürün yok. Build durduruldu.')
  process.exit(1)
}

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'products.js')
writeFileSync(file, `/* OTOMATİK ÜRETİLDİ — scripts/sync-products.mjs, ${new Date().toISOString()}.
   Ürünleri yönetici panelinden değiştirin; bu dosya her build'de yeniden yazılır. */
export const products = ${JSON.stringify(rows, null, 2)}
`)
console.log(`sync-products: ${rows.length} ürün veritabanından alındı.`)
