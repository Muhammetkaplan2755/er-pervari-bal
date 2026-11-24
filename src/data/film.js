/* The homepage "film": four pinned scenes between the hero and the counter.
   Every line here restates something already true elsewhere on the site
   (karakovan comparison, product notes, address) — no new claims. */

export const film = [
  {
    id: 'petek',
    img: 'petek',
    pos: '50% 50%',
    eyebrow: { tr: 'Karakovan', en: 'Karakovan', ar: 'كاراكوفان' },
    title: { tr: 'Mumunu arı kendisi örer.', en: 'The bees make every bit of the wax.', ar: 'النحل يصنع الشمع كله بنفسه.' },
    body: {
      tr: 'Hazır temel petek yok. Kalın, düzensiz, kenarları yuvarlak; mumuyla birlikte yenir.',
      en: 'No foundation sheet. Thick, irregular, rounded at the edges, and eaten wax and all.',
      ar: 'بلا أساس شمعي جاهز. سميك وغير منتظم وحوافه مستديرة، ويؤكل مع شمعه.',
    },
  },
  {
    id: 'suzme',
    img: 'suzme',
    pos: '42% 38%',
    eyebrow: { tr: 'Süzme bal', en: 'Strained honey', ar: 'عسل مصفّى' },
    title: { tr: 'Kaşıktan ip gibi akar.', en: 'It falls from the spoon in a thread.', ar: 'ينساب من الملعقة كالخيط.' },
    body: {
      tr: 'Kavanozda akışkan ve berrak. Zamanla şekerlenmesi doğaldır.',
      en: 'Runny and clear in the jar. Crystallising over time is natural.',
      ar: 'سائل وصافٍ في البرطمان، وتبلوره مع الوقت أمر طبيعي.',
    },
  },
  {
    id: 'raflar',
    img: 'raflar',
    pos: '50% 30%',
    eyebrow: { tr: 'Tezgah', en: 'The counter', ar: 'البسطة' },
    title: { tr: 'Petekten kavanoza, hepsi rafta.', en: 'From comb to jar, all on the shelf.', ar: 'من القرص إلى البرطمان، كله على الرف.' },
    body: {
      tr: 'Süzme ve krem bal, polen, tahin, pekmez ve Antep fıstığı.',
      en: 'Strained and creamed honey, pollen, tahini, grape molasses and Antep pistachios.',
      ar: 'عسل مصفّى وكريمي، حبوب لقاح، طحينة، دبس وفستق عنتاب.',
    },
  },
  {
    id: 'dukkan',
    img: 'dukkan',
    pos: '50% 38%',
    eyebrow: { tr: 'Bakırcılar Çarşısı · No 32A', en: 'Coppersmiths’ Bazaar · No 32A', ar: 'سوق النحاسين · رقم 32A' },
    title: { tr: 'Gelin, tadına bakın.', en: 'Come and taste it.', ar: 'تعالوا وتذوقوا.' },
    body: {
      tr: "Gaziantep'teki dükkanımıza uğrayın ya da WhatsApp'tan sipariş verin; Türkiye'nin her yerine kargo.",
      en: 'Drop by the shop in Gaziantep or order on WhatsApp, shipped across Türkiye.',
      ar: 'زوروا متجرنا في غازي عنتاب أو اطلبوا عبر واتساب، والشحن إلى كل تركيا.',
    },
  },
]

export const filmUi = {
  label: { tr: 'Petekten kavanoza', en: 'From comb to jar', ar: 'من القرص إلى البرطمان' },
  visit: { tr: 'Dükkanın yeri', en: 'Find the shop', ar: 'موقع المتجر' },
}
