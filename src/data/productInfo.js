/* Ürün sayfası içeriği: fotoğraflar, uzun açıklama, bilgi satırları.
   images: public/images içindeki fotoğraf adları (ilk fotoğraf ana görsel olur).
   feedPhoto: true ise ilk fotoğraf ürünün kendisini gösteriyor demektir; Google ve Meta
   kataloglarına yalnızca bunlar gönderilir. Dükkan/raf fotoğrafı ürün görseli sayılmaz.
   Yeni ürün fotoğrafı ekleyince: public/images/AD.jpg → WebP üret → src/components/photo.js'e ekle.
   (TEYİT) Menşei ve ambalaj bilgilerini dükkanın gerçek bilgisiyle kontrol edin. */

const KEEP_HONEY = {
  tr: 'Oda sıcaklığında, ağzı kapalı, güneş almayan yerde. Buzdolabına koymayın.',
  en: 'Room temperature, lid closed, out of the sun. Do not refrigerate.',
  ar: 'في درجة حرارة الغرفة، مغلقًا، بعيدًا عن الشمس. لا تضعه في الثلاجة.',
}
const GLASS = { tr: 'Cam kavanoz', en: 'Glass jar', ar: 'برطمان زجاجي' }
const PERVARI = { tr: 'Pervari, Siirt', en: 'Pervari, Siirt', ar: 'بيرواري، سيرت' }

/* Alerjen bilgisi (Türk Gıda Kodeksi Etiketleme Yönetmeliği, uzaktan satışta satın almadan önce
   gösterilmeli). Yalnızca ürünün kendi içeriğinden çıkan, kesin bilgiler yazıldı.
   (TEYİT) Çapraz bulaşma uyarısı ancak üretim ortamı biliniyorsa eklenmeli. */
const SESAME = { tr: 'Susam içerir.', en: 'Contains sesame.', ar: 'يحتوي على السمسم.' }
const PISTACHIO = { tr: 'Sert kabuklu meyve içerir (Antep fıstığı).', en: 'Contains tree nuts (pistachio).', ar: 'يحتوي على مكسرات (فستق حلبي).' }
const POLLEN = { tr: 'Arı ürünlerine alerjisi olanlar tüketmeden önce hekime danışmalıdır.', en: 'People allergic to bee products should consult a doctor first.', ar: 'على من لديه حساسية من منتجات النحل استشارة الطبيب أولًا.' }
const BOX_BREAKFAST = { tr: 'Susam (tahin) ve sert kabuklu meyve (Antep fıstığı) içerir.', en: 'Contains sesame (tahini) and tree nuts (pistachio).', ar: 'يحتوي على السمسم (الطحينة) والمكسرات (الفستق).' }

export const productInfo = {
  suzme: {
    images: ['suzme', 'raflar'],
    feedPhoto: true,
    desc: {
      tr: 'Pervari yaylasının çiçek balı, peteğinden süzülüp cam kavanoza dolduruluyor. Akışkan ve berrak; çaya, yoğurda, kahvaltıya. Zamanla şekerlenmesi doğaldır, ılık suda yeniden akışkanlaşır.',
      en: 'Blossom honey from the Pervari highlands, strained from the comb into glass jars. Runny and clear: for tea, yoghurt and breakfast. It may crystallise over time, which is natural; warm water makes it runny again.',
      ar: 'عسل أزهار من مرتفعات بيرواري، يُصفّى من الشمع ويُعبّأ في برطمانات زجاجية. سائل وصافٍ: للشاي واللبن والفطور. قد يتبلور مع الوقت وهذا طبيعي، ويعود سائلًا في الماء الدافئ.',
    },
    facts: [['origin', PERVARI], ['pack', GLASS], ['keep', KEEP_HONEY]],
  },
  karakovan: {
    images: ['petek', 'dukkan'],
    feedPhoto: true,
    desc: {
      tr: 'Hazır temel petek kullanılmadan, arının kendi ördüğü mumla oluşan doğal petek. Kalın ve düzensiz kesitli; balıyla birlikte mumu da çiğnenerek yenir. Hasat genellikle yılda bir kez yapılır.',
      en: 'Natural comb built entirely by the bees, without a foundation sheet. Thick and irregular in cross-section; you chew the wax together with the honey. Usually harvested once a year.',
      ar: 'شمع طبيعي يبنيه النحل بالكامل دون أساس جاهز. سميك وغير منتظم المقطع؛ يُمضغ الشمع مع العسل. يُقطف عادة مرة في السنة.',
    },
    facts: [['origin', PERVARI], ['pack', { tr: 'Kesilip kapalı kutuda', en: 'Cut and packed in a sealed box', ar: 'مقطّع في علبة مغلقة' }], ['keep', KEEP_HONEY]],
  },
  cerceve: {
    images: ['raflar'],
    feedPhoto: true,
    desc: {
      tr: 'Arının temel petek üzerine ördüğü, düzgün hücreli çerçeve petek. Kesilmiş parça ya da tam çerçeve olarak; karakovana göre daha hafif tat, daha uygun fiyat.',
      en: 'Frame comb with even cells, built by the bees on a foundation sheet. As cut pieces or a whole frame; lighter in taste and friendlier in price than karakovan.',
      ar: 'شمع بالإطار بخلايا منتظمة يبنيه النحل على أساس شمعي. قطع أو إطار كامل؛ أخف طعمًا وأنسب سعرًا من كاراكوفان.',
    },
    facts: [['origin', PERVARI], ['pack', { tr: 'Streçli çerçeve ya da kutu', en: 'Wrapped frame or box', ar: 'إطار مغلّف أو علبة' }], ['keep', KEEP_HONEY]],
  },
  krem: {
    images: ['krem-bal'],
    feedPhoto: true,
    desc: {
      tr: 'Kontrollü kristalleştirilmiş bal: kaşıkla kesilen, ekmeğe sürülünce damlamayan ipeksi kıvam. Kahvaltının en pratik balı.',
      en: 'Honey crystallised under control into a silky texture you cut with a spoon and spread without dripping. The easiest honey for breakfast.',
      ar: 'عسل متبلور بشكل مضبوط بقوام حريري يُقطع بالملعقة ويُدهن دون أن يسيل. أسهل عسل للفطور.',
    },
    facts: [['pack', GLASS], ['keep', KEEP_HONEY]],
  },
  polen: {
    images: [],
    feedPhoto: false,
    desc: {
      tr: 'Kurutulmuş arı poleni. Yoğurda, kahvaltılık gevreğe ya da bir kaşık balın üstüne serpilir.',
      en: 'Dried bee pollen. Sprinkle over yoghurt, cereal or a spoonful of honey.',
      ar: 'حبوب لقاح مجففة. تُرشّ على اللبن أو حبوب الفطور أو ملعقة عسل.',
    },
    facts: [['pack', GLASS], ['keep', { tr: 'Serin ve kuru yerde, ağzı kapalı.', en: 'Cool, dry place, lid closed.', ar: 'في مكان بارد وجاف، مغلقًا.' }], ['allergen', POLLEN]],
  },
  tahin: {
    images: [], // dükkan fotoğrafı ürünü göstermiyor; ürün fotoğrafı çekilince ekleyin
    feedPhoto: false,
    desc: {
      tr: 'Susamdan çekilmiş tahin. Pekmez ya da balla karıştırıp kahvaltıda ekmekle.',
      en: 'Sesame tahini. Mix with grape molasses or honey and eat with bread at breakfast.',
      ar: 'طحينة السمسم. تُخلط مع الدبس أو العسل وتؤكل مع الخبز في الفطور.',
    },
    facts: [['pack', GLASS], ['keep', { tr: 'Oda sıcaklığında; yağ ayrışırsa karıştırın.', en: 'Room temperature; stir if the oil separates.', ar: 'في درجة حرارة الغرفة؛ حرّكها إذا انفصل الزيت.' }], ['allergen', SESAME]],
  },
  pekmez: {
    images: [], // dükkan fotoğrafı ürünü göstermiyor; ürün fotoğrafı çekilince ekleyin
    feedPhoto: false,
    desc: {
      tr: 'Üzüm pekmezi. Tahinle karıştırıp ya da tek başına, kış kahvaltılarının klasiği.',
      en: 'Grape molasses. On its own or mixed with tahini, a winter breakfast classic.',
      ar: 'دبس العنب. وحده أو مخلوطًا بالطحينة، كلاسيكية فطور الشتاء.',
    },
    facts: [['pack', GLASS], ['keep', { tr: 'Oda sıcaklığında, ağzı kapalı.', en: 'Room temperature, lid closed.', ar: 'في درجة حرارة الغرفة، مغلقًا.' }]],
  },
  fistik: {
    images: [],
    feedPhoto: false,
    desc: {
      tr: "Antep'in kendi fıstığı, kabuklu ve kavrulmuş. Çerez olarak ya da dövülüp tatlıya, içeceğe.",
      en: 'Antep’s own pistachios, in shell and roasted. As a snack, or crushed into desserts and drinks.',
      ar: 'فستق عنتاب الأصلي، بقشره ومحمّص. كتسالي أو مدقوقًا في الحلويات والمشروبات.',
    },
    facts: [['origin', { tr: 'Gaziantep', en: 'Gaziantep', ar: 'غازي عنتاب' }], ['keep', { tr: 'Serin ve kuru yerde, ağzı kapalı.', en: 'Cool, dry place, sealed.', ar: 'في مكان بارد وجاف، مغلقًا.' }], ['allergen', PISTACHIO]],
  },
  'kutu-kahvalti': {
    images: [],
    feedPhoto: false,
    desc: {
      tr: 'Kahvaltı sofrası için hazır kutu: süzme bal, tahin, pekmez ve Antep fıstığı bir arada. Hediye için de uygun.',
      en: 'A ready box for the breakfast table: strained honey, tahini, grape molasses and Antep pistachios together. Good as a gift too.',
      ar: 'علبة جاهزة لمائدة الفطور: عسل مصفّى وطحينة ودبس وفستق عنتاب معًا. مناسبة كهدية أيضًا.',
    },
    facts: [['contents', { tr: 'Süzme bal 500 g, tahin 300 g, pekmez 700 g, Antep fıstığı 500 g', en: 'Strained honey 500 g, tahini 300 g, grape molasses 700 g, Antep pistachios 500 g', ar: 'عسل مصفّى 500 غ، طحينة 300 غ، دبس 700 غ، فستق عنتاب 500 غ' }], ['allergen', BOX_BREAKFAST]],
  },
  'kutu-karakovan': {
    images: ['petek'],
    feedPhoto: false,
    desc: {
      tr: 'Karakovan petek ve krem bal, ahşap kutuda. Bal sevenlere hediye.',
      en: 'Karakovan comb and creamed honey in a wooden box. A gift for honey lovers.',
      ar: 'شمع كاراكوفان وعسل كريمي في علبة خشبية. هدية لمحبي العسل.',
    },
    facts: [['contents', { tr: 'Karakovan petek 1 kg, krem bal 250 g', en: 'Karakovan comb 1 kg, creamed honey 250 g', ar: 'شمع كاراكوفان 1 كغ، عسل كريمي 250 غ' }]],
  },
  'kutu-bayram': {
    images: [],
    feedPhoto: false,
    desc: {
      tr: 'Bayram ziyaretleri, düğün ve nişan ikramı için: krem bal, süzme bal ve Antep fıstığı. Adetli siparişte kurumsal formu kullanın.',
      en: 'For holiday visits, weddings and engagements: creamed honey, strained honey and Antep pistachios. For larger quantities, use the bulk order form.',
      ar: 'لزيارات العيد والأعراس والخطوبة: عسل كريمي وعسل مصفّى وفستق عنتاب. للكميات الكبيرة استخدم نموذج الطلب بالجملة.',
    },
    facts: [['contents', { tr: 'Krem bal 250 g, süzme bal 500 g, Antep fıstığı 500 g', en: 'Creamed honey 250 g, strained honey 500 g, Antep pistachios 500 g', ar: 'عسل كريمي 250 غ، عسل مصفّى 500 غ، فستق عنتاب 500 غ' }], ['allergen', PISTACHIO]],
  },
}

/* Google/Meta "availability" values for each stock state. */
export const AVAILABILITY = {
  in: { feed: 'in_stock', schema: 'https://schema.org/InStock' },
  low: { feed: 'in_stock', schema: 'https://schema.org/LimitedAvailability' },
  out: { feed: 'out_of_stock', schema: 'https://schema.org/OutOfStock' },
  preorder: { feed: 'preorder', schema: 'https://schema.org/PreOrder' },
}
