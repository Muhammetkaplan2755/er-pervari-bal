import { photo } from './photo.js'

/* Ürün fotoğrafları iki kaynaktan gelir:
   - panelden yüklenenler: product.images (Supabase Storage, tam adres)
   - sitedeki hazır fotoğraflar: productInfo[id].images (public/images içindeki ad)
   Panelden yüklenen varsa o kullanılır ve gerçek ürün fotoğrafı sayılır. */
export const isUrl = (s) => /^(https?:|blob:)/.test(s)

export function photosOf(product, info) {
  if (product?.images?.length) return { list: product.images, real: true }
  return { list: info?.images ?? [], real: Boolean(info?.feedPhoto) }
}

export const imgAttrs = (img) => (isUrl(img) ? { src: img } : photo(img))
export const imagePath = (img) => (isUrl(img) ? img : `/images/${img}.jpg`)
