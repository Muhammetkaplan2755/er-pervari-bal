/* Günlük / hasat günlüğü. En yeni kayıt en üstte.
   Gerçek hasat notlarıyla değiştirin; "date" alanı isteğe bağlıdır (örnek: '2026-09').
   Yeni fotoğraf eklerken: public/images/AD.jpg koyun, WebP sürümlerini üretin ve src/components/photo.js'e ekleyin. */
export const journal = [
  {
    img: 'petek',
    title: { tr: 'Karakovan petekler tezgahta', en: 'Karakovan combs on the counter', ar: 'أقراص كاراكوفان على البسطة' },
    body: {
      tr: 'Kubbeli sepetlerde karakovan petekler. Her dilim farklı görünüyor: koyu hücreler polen, açık renkli olanlar taze mum.',
      en: 'Karakovan combs under the domed covers. Every slice looks different: the dark cells are pollen, the pale ones fresh wax.',
      ar: 'أقراص كاراكوفان تحت الأغطية المقببة. كل شريحة مختلفة: الخلايا الداكنة حبوب لقاح، والفاتحة شمع طازج.',
    },
  },
  {
    img: 'raflar',
    title: { tr: 'Altıgen raflar ve çerçeveler', en: 'Hexagon shelves and frames', ar: 'الرفوف السداسية والإطارات' },
    body: {
      tr: 'Duvarda süzme bal kavanozları ve streçlenmiş çerçeve petekler. Çerçeveyi isteyene tam, isteyene kesilmiş olarak veriyoruz.',
      en: 'Jars of strained honey and wrapped frame combs on the wall. Frames go whole or cut, as you prefer.',
      ar: 'برطمانات العسل المصفّى وإطارات الشمع المغلفة على الجدار. نبيع الإطار كاملًا أو مقطّعًا حسب الرغبة.',
    },
  },
  {
    img: 'krem-bal',
    title: { tr: 'Krem balın kıvamı', en: 'The texture of creamed honey', ar: 'قوام العسل الكريمي' },
    body: {
      tr: 'Kaşıkla çekince kopmadan uzayan, ekmeğe sürülünce damlamayan kıvam. Kristalleşme kontrollü yapılınca bal böyle ipeksi kalır.',
      en: 'It stretches from the spoon without breaking and spreads without dripping. Controlled crystallisation keeps it silky.',
      ar: 'يمتد من الملعقة دون أن ينقطع ويُدهن دون أن يسيل. التبلور المضبوط يبقيه ناعمًا كالحرير.',
    },
  },
]
