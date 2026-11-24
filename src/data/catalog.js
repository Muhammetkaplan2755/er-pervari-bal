/* ──────────────────────────────────────────────────────────────
   Satış ayarları — fiyatlar, stok, kargo ve WhatsApp numarası BURADAN değişir.
   DİKKAT: Fiyatlar ve WhatsApp numarası geçici (örnek) değerlerdir.
   Yayına almadan önce gerçek değerlerle değiştirin.
   ────────────────────────────────────────────────────────────── */

import { products } from './products.js'

/* Uluslararası biçimde, başında + ve boşluk olmadan: 0553 663 58 64 → 905536635864 */
export const WHATSAPP_NUMBER = '905536635864'
export const WHATSAPP_DISPLAY = '0553 663 58 64'

export const SHIPPING = {
  fee: 150, // ₺
  freeOver: 2500, // ₺ — bu tutar ve üzeri siparişte kargo ücretsiz
}

/* Kargo firmaları ve takip sayfası adresleri. {kod} takip numarasıyla değiştirilir.
   (TEYİT) Çalıştığınız firmayı bırakın, adresleri bir takip numarasıyla deneyin. */
export const CARRIERS = [
  { id: 'yurtici', name: 'Yurtiçi Kargo', url: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={kod}' },
  { id: 'aras', name: 'Aras Kargo', url: 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code={kod}' },
  { id: 'ptt', name: 'PTT Kargo', url: 'https://gonderitakip.ptt.gov.tr/Track/Verify?q={kod}' },
]

/* WhatsApp mesajı dükkana Türkçe gider; ekranda müşterinin dili gösterilir. */
export const PAYMENT_METHODS = [
  { id: 'havale', tr: 'Havale / EFT', en: 'Bank transfer', ar: 'تحويل بنكي' },
  { id: 'kapida', tr: 'Kapıda ödeme', en: 'Pay on delivery', ar: 'الدفع عند الاستلام' },
]

export const SUBSCRIPTION = [
  { id: 'yok', tr: 'Tek seferlik', en: 'One time', ar: 'مرة واحدة' },
  { id: 'ay', tr: 'Her ay tekrarla', en: 'Repeat monthly', ar: 'كرّر كل شهر' },
  { id: 'iki-ay', tr: '2 ayda bir tekrarla', en: 'Every 2 months', ar: 'كل شهرين' },
]

export const CATEGORIES = [
  { id: 'bal', tr: 'Bal ve petek', en: 'Honey and comb', ar: 'العسل والشمع' },
  { id: 'kahvalti', tr: 'Kahvaltılık', en: 'For breakfast', ar: 'للفطور' },
  { id: 'kutu', tr: 'Hediye kutuları', en: 'Gift boxes', ar: 'علب الهدايا' },
]

/* Ürünler src/data/products.js'te (panel kuruluysa veritabanından üretilir). */
export const catalog = products

const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
export const formatTL = (n) => tl.format(n)

/* Turkish text for the shop's WhatsApp message, whatever language the customer reads. */
export const trText = (v) => (v && typeof v === 'object' ? v.tr : v)

export function findItem(productId, variantId) {
  const product = catalog.find((p) => p.id === productId)
  const variant = product?.variants.find((v) => v.id === variantId)
  return product && variant ? { product, variant } : null
}

export function shippingFor(subtotal) {
  if (subtotal === 0) return 0
  return subtotal >= SHIPPING.freeOver ? 0 : SHIPPING.fee
}
