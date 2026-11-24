/* Parti (lot) kayıtları — kavanozdaki QR kod şu adrese gider: https://ALAN-ADI/#/parti/KOD
   Her yeni dolumda bir kayıt ekleyin. Analiz raporu varsa PDF'i public/raporlar/ klasörüne koyun.
   Kodlar büyük harfle yazılır ve büyük/küçük harf duyarsız aranır.

   Örnek kayıt (yorum satırından çıkarıp gerçek bilgilerle doldurun):
   {
     code: 'KK2026-01',
     product: { tr: 'Karakovan petek bal', en: 'Karakovan comb honey', ar: 'عسل شمع كاراكوفان' },
     harvest: { tr: 'Eylül 2026', en: 'September 2026', ar: 'سبتمبر 2026' },
     region: { tr: 'Pervari, Siirt', en: 'Pervari, Siirt', ar: 'بيرواري، سيرت' },
     filled: '2026-10-05',
     report: '/raporlar/KK2026-01.pdf', // yoksa bu satırı silin
   },
*/
export const batches = []

export const findBatch = (code) => batches.find((b) => b.code.toUpperCase() === code.trim().toUpperCase())
