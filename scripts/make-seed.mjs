/* Mevcut ürün listesini (src/data/products.js) Supabase'e aktarmak için
   supabase/seed.sql üretir. Çalıştır: node scripts/make-seed.mjs
   Sonra Supabase → SQL Editor'a yapıştır. Var olan ürünlerin üzerine yazmaz. */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { products } from '../src/data/products.js'

const q = (v) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
const rows = products.map((p, i) =>
  `  ('${p.id}', '${p.category}', '${p.stock}', ${q(p.name)}, ${q(p.note ?? {})}, ${q(p.variants)}, ${i * 10})`)

const sql = `-- OTOMATİK ÜRETİLDİ: node scripts/make-seed.mjs
-- Mevcut ürünleri veritabanına aktarır (schema.sql'den sonra çalıştırın).
insert into public.products (id, category, stock, name, note, variants, sort) values
${rows.join(',\n')}
on conflict (id) do nothing;
`
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'seed.sql')
writeFileSync(out, sql)
console.log(`seed.sql: ${products.length} ürün`)
