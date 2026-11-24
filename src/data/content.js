/* Section content in three languages. */

export const counter = [
  { tr: 'Süzme bal', en: 'Strained honey', ar: 'عسل مصفّى' },
  { tr: 'Karakovan petek', en: 'Karakovan comb', ar: 'شمع كاراكوفان' },
  { tr: 'Krem bal', en: 'Creamed honey', ar: 'عسل كريمي' },
  { tr: 'Polen', en: 'Pollen', ar: 'حبوب اللقاح' },
  { tr: 'Tahin ve pekmez', en: 'Tahini and molasses', ar: 'طحينة ودبس' },
  { tr: 'Antep fıstığı', en: 'Antep pistachios', ar: 'فستق عنتاب' },
]

/* Karakovan vs. frame hive — the one comparison a customer actually asks about at the counter. */
export const compare = [
  {
    topic: { tr: 'Petek mumu', en: 'Comb wax', ar: 'شمع القرص' },
    karakovan: { tr: 'Mumun tamamını arı kendisi örer; kovana hazır temel petek konmaz.', en: 'The bees make all of the wax; no foundation sheet goes into the hive.', ar: 'ينتج النحل الشمع كله؛ لا يوضع أساس شمعي جاهز في الخلية.' },
    cerceve: { tr: 'Arı, fabrikada basılmış temel petek levhasının üzerine örer.', en: 'The bees build on a factory-pressed foundation sheet.', ar: 'يبني النحل فوق صفيحة أساس مصنوعة في المصنع.' },
  },
  {
    topic: { tr: 'Hasat', en: 'Harvest', ar: 'الحصاد' },
    karakovan: { tr: 'Genellikle yılda bir kez, yaz sonu ile sonbahar arasında.', en: 'Usually once a year, between late summer and autumn.', ar: 'عادة مرة في السنة، بين أواخر الصيف والخريف.' },
    cerceve: { tr: 'Sezon içinde birden fazla kez alınabilir.', en: 'Can be taken several times in a season.', ar: 'يمكن قطفه عدة مرات في الموسم.' },
  },
  {
    topic: { tr: 'Görünüş', en: 'Look', ar: 'الشكل' },
    karakovan: { tr: 'Kalın, düzensiz, kenarları yuvarlak petek; çerçeve izi yoktur.', en: 'Thick, irregular comb with rounded edges and no frame marks.', ar: 'قرص سميك غير منتظم بحواف مستديرة وبلا أثر إطار.' },
    cerceve: { tr: 'Düz, eşit hücreli, dört kenarı tahta çerçeveyle sınırlı.', en: 'Flat, even cells, bordered on four sides by a wooden frame.', ar: 'مستوٍ بخلايا متساوية، يحده إطار خشبي من الجهات الأربع.' },
  },
  {
    topic: { tr: 'Fiyat', en: 'Price', ar: 'السعر' },
    karakovan: { tr: 'Arı mumu da kendisi ürettiği için verim düşük, fiyat daha yüksek.', en: 'Lower yield because the bees also make the wax, so it costs more.', ar: 'إنتاج أقل لأن النحل يصنع الشمع أيضًا، لذا سعره أعلى.' },
    cerceve: { tr: 'Verim daha yüksek, fiyat daha uygun.', en: 'Higher yield, friendlier price.', ar: 'إنتاج أعلى وسعر أنسب.' },
  },
]

export const traits = [
  {
    title: { tr: 'Mumuyla yenir', en: 'Eaten with the wax', ar: 'يؤكل مع شمعه' },
    body: { tr: 'Petek, balıyla birlikte çiğnenir. Mumu fabrikadan değil, tamamen arının kendisinden gelir.', en: 'The comb is chewed together with the honey. Its wax comes entirely from the bees, not a factory.', ar: 'يُمضغ القرص مع العسل. شمعه من النحل بالكامل وليس من مصنع.' },
  },
  {
    title: { tr: 'Rengi ve tadı yaylaya göre değişir', en: 'Colour and taste follow the highland', ar: 'اللون والطعم يتبعان المرتفعات' },
    body: { tr: 'Açık sarıdan koyu kehribara kadar her ton görülür. Tat, kovanın kurulduğu yerdeki çiçeklerden gelir.', en: 'Anything from pale yellow to dark amber. The taste comes from the flowers around the hive.', ar: 'من الأصفر الفاتح إلى الكهرماني الداكن. الطعم يأتي من الأزهار حول الخلية.' },
  },
  {
    title: { tr: 'Hücrelerde polen görülebilir', en: 'Pollen can show in the cells', ar: 'قد تظهر حبوب اللقاح في الخلايا' },
    body: { tr: 'Kesitte koyu ya da renkli görünen hücreler genellikle polen ve propolis kalıntısıdır.', en: 'Dark or coloured cells in a cut are usually pollen and propolis.', ar: 'الخلايا الداكنة أو الملونة في المقطع غالبًا حبوب لقاح وعكبر.' },
  },
  {
    title: { tr: 'Kristalleşmesi doğaldır', en: 'Crystallising is natural', ar: 'التبلور أمر طبيعي' },
    body: { tr: 'Bal zamanla şekerlenebilir. Kavanozu 40 °C altı ılık suya koyun; kaynar su ve mikrodalga kullanmayın.', en: 'Honey can crystallise over time. Stand the jar in warm water below 40 °C; no boiling water or microwave.', ar: 'قد يتبلور العسل مع الوقت. ضع البرطمان في ماء دافئ أقل من 40 °م؛ لا ماء مغلي ولا ميكروويف.' },
  },
]

export const featured = [
  {
    img: 'suzme',
    pos: '55% 30%',
    name: { tr: 'Süzme bal', en: 'Strained honey', ar: 'عسل مصفّى' },
    note: { tr: 'Kavanozda, akışkan ve berrak. Kaşıktan ip gibi akar.', en: 'Runny and clear in the jar. It falls from the spoon in a thread.', ar: 'سائل وصافٍ في البرطمان، ينساب من الملعقة كالخيط.' },
    alt: { tr: 'Cam kaşıktan altıgen desenli kavanoza akan süzme bal', en: 'Strained honey running from a glass dipper into a ribbed jar', ar: 'عسل مصفّى ينساب من ملعقة زجاجية إلى برطمان مضلّع' },
  },
  {
    img: 'krem-bal',
    pos: '55% 45%',
    name: { tr: 'Krem bal', en: 'Creamed honey', ar: 'عسل كريمي' },
    note: { tr: 'Kontrollü kristalleştirilmiş, kaşıkla kesilen kıvamda. Ekmeğe sürülür, damlamaz.', en: 'Crystallised under control until you can cut it with a spoon. Spreads on bread without dripping.', ar: 'متبلور بشكل مضبوط حتى يُقطع بالملعقة. يُدهن على الخبز دون أن يسيل.' },
    alt: { tr: 'Ahşap kaşıkla kavanozdan çekilen koyu kıvamlı krem bal', en: 'Thick creamed honey pulled from a jar with a wooden spoon', ar: 'عسل كريمي سميك يُسحب من البرطمان بملعقة خشبية' },
  },
  {
    img: 'icecek',
    pos: '50% 62%',
    name: { tr: 'Ballı fıstıklı içecek', en: 'Honey pistachio shake', ar: 'مشروب العسل بالفستق' },
    note: { tr: 'Bal, Antep fıstığı ve meyveyle dükkanda hazırlanır, kenarı fıstıkla kaplanır.', en: 'Made in the shop with honey, Antep pistachios and fruit, the rim coated in pistachio.', ar: 'يُحضَّر في المتجر بالعسل وفستق عنتاب والفاكهة، وحافته مغطاة بالفستق.' },
    alt: { tr: 'Kenarları Antep fıstığıyla kaplı iki bardak içecek, yanında petek bal, muz ve çilek', en: 'Two pistachio-rimmed shakes with comb honey, banana and strawberries', ar: 'كوبان بحافة من الفستق مع شمع عسل وموز وفراولة' },
  },
  {
    img: 'dukkan',
    pos: '50% 74%',
    name: { tr: 'Tahin, pekmez ve Antep fıstığı', en: 'Tahini, molasses and Antep pistachios', ar: 'طحينة ودبس وفستق عنتاب' },
    note: { tr: "Kahvaltı sofrasında balın yanına yakışanlar; fıstık Antep'in kendi fıstığı.", en: 'What belongs next to honey on the breakfast table; the pistachios are Antep’s own.', ar: 'ما يليق بجانب العسل على مائدة الفطور؛ والفستق من عنتاب نفسها.' },
    alt: { tr: 'Dükkan önündeki tezgahta tahin ve pekmez kavanozları ile Antep fıstığı', en: 'Tahini and molasses jars with Antep pistachios on the counter outside the shop', ar: 'برطمانات طحينة ودبس مع فستق عنتاب على البسطة أمام المتجر' },
  },
]

export const more = [
  { tr: 'Çerçeve petek', en: 'Frame comb', ar: 'شمع بالإطار' },
  { tr: 'Karakovan petek', en: 'Karakovan comb', ar: 'شمع كاراكوفان' },
  { tr: 'Çiçek balı (teneke)', en: 'Blossom honey (tin)', ar: 'عسل الأزهار (علبة معدنية)' },
  { tr: 'Polen', en: 'Pollen', ar: 'حبوب اللقاح' },
]
