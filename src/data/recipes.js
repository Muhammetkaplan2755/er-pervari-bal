/* Tarifler. "buy" alanı, "Malzemeleri sipariş et" düğmesinin sepete ekleyeceği ürünlerdir. */
export const recipes = [
  {
    id: 'icecek',
    img: 'icecek',
    pos: '50% 40%',
    minutes: 10,
    serves: 2,
    buy: [['suzme', '500g'], ['fistik', '500g']],
    title: { tr: 'Ballı fıstıklı içecek', en: 'Honey pistachio shake', ar: 'مشروب العسل بالفستق' },
    intro: {
      tr: 'Dükkanda hazırladığımız içeceğin evde yapılan hali.',
      en: 'The home version of the shake we make in the shop.',
      ar: 'نسخة منزلية من المشروب الذي نحضّره في المتجر.',
    },
    ingredients: {
      tr: ['2 su bardağı soğuk süt', '1 olgun muz', '2 yemek kaşığı süzme bal (kenar için biraz daha)', '4 yemek kaşığı dövülmüş Antep fıstığı', '3–4 çilek'],
      en: ['2 cups cold milk', '1 ripe banana', '2 tbsp strained honey (plus a little for the rim)', '4 tbsp crushed Antep pistachios', '3–4 strawberries'],
      ar: ['كوبان من الحليب البارد', 'موزة ناضجة', 'ملعقتان كبيرتان من العسل المصفّى (وقليل للحافة)', '4 ملاعق كبيرة من فستق عنتاب المدقوق', '3–4 حبات فراولة'],
    },
    steps: {
      tr: ['Bardakların ağzını balla sıvayın, dövülmüş fıstığa bastırın.', 'Süt, muz, bal ve iki çileği blenderda pürüzsüz olana kadar çekin.', 'Bardaklara paylaştırın, üzerine fıstık serpin, birer çilekle süsleyin.'],
      en: ['Brush the glass rims with honey and press them into the crushed pistachios.', 'Blend the milk, banana, honey and two strawberries until smooth.', 'Pour into the glasses, sprinkle with pistachios and top each with a strawberry.'],
      ar: ['ادهن حواف الأكواب بالعسل واغمسها في الفستق المدقوق.', 'اخلط الحليب والموز والعسل وحبتي فراولة في الخلاط حتى يصبح ناعمًا.', 'وزّعه في الأكواب، ورشّ الفستق، وزيّن كل كوب بحبة فراولة.'],
    },
  },
  {
    id: 'tahin',
    minutes: 5,
    serves: 2,
    buy: [['tahin', '300g'], ['pekmez', '700g']],
    title: { tr: 'Tahin pekmez', en: 'Tahini with molasses', ar: 'طحينة بالدبس' },
    intro: {
      tr: 'Kış kahvaltılarının klasiği; pekmez yerine bal da olur.',
      en: 'A winter breakfast classic; honey works instead of molasses too.',
      ar: 'كلاسيكية فطور الشتاء؛ ويمكن استخدام العسل بدل الدبس.',
    },
    ingredients: {
      tr: ['3 yemek kaşığı tahin', '2 yemek kaşığı pekmez ya da süzme bal', 'Sıcak ekmek'],
      en: ['3 tbsp tahini', '2 tbsp grape molasses or strained honey', 'Warm bread'],
      ar: ['3 ملاعق كبيرة من الطحينة', 'ملعقتان كبيرتان من الدبس أو العسل المصفّى', 'خبز دافئ'],
    },
    steps: {
      tr: ['Tahini kaseye alın, üzerine pekmezi ya da balı dökün.', 'Kıvamı koyulaşana kadar kaşıkla karıştırın.', 'Sıcak ekmekle servis edin.'],
      en: ['Put the tahini in a bowl and pour the molasses or honey over it.', 'Stir with a spoon until it thickens.', 'Serve with warm bread.'],
      ar: ['ضع الطحينة في وعاء واسكب فوقها الدبس أو العسل.', 'حرّك بالملعقة حتى يتماسك القوام.', 'قدّمه مع خبز دافئ.'],
    },
  },
  {
    id: 'tabak',
    img: 'petek',
    pos: '50% 50%',
    minutes: 5,
    serves: 2,
    buy: [['karakovan', '500g']],
    title: { tr: 'Petekli kahvaltı tabağı', en: 'Comb honey breakfast plate', ar: 'طبق فطور بشمع العسل' },
    intro: {
      tr: 'Peteğin en sade hali: tereyağı ya da kaymakla, sıcak ekmeğin üstünde.',
      en: 'Comb at its simplest: with butter or clotted cream on warm bread.',
      ar: 'الشمع في أبسط صوره: مع الزبدة أو القشطة على خبز دافئ.',
    },
    ingredients: {
      tr: ['Bir dilim karakovan petek', 'Tereyağı ya da kaymak', 'Sıcak ekmek', 'Bir avuç Antep fıstığı'],
      en: ['A slice of karakovan comb', 'Butter or clotted cream', 'Warm bread', 'A handful of Antep pistachios'],
      ar: ['شريحة من شمع كاراكوفان', 'زبدة أو قشطة', 'خبز دافئ', 'حفنة من فستق عنتاب'],
    },
    steps: {
      tr: ['Peteği bıçakla tabağa kesin; balı akmaya bırakın.', 'Ekmeğe tereyağı ya da kaymak sürün, üstüne bir parça petek koyun.', 'Mumu balla birlikte çiğneyin; fıstıkla birlikte servis edin.'],
      en: ['Cut the comb onto a plate and let the honey run.', 'Spread butter or cream on the bread and lay a piece of comb on top.', 'Chew the wax with the honey; serve with pistachios.'],
      ar: ['اقطع الشمع في طبق ودع العسل يسيل.', 'ادهن الخبز بالزبدة أو القشطة وضع فوقه قطعة من الشمع.', 'امضغ الشمع مع العسل؛ وقدّمه مع الفستق.'],
    },
  },
  {
    id: 'yogurt',
    minutes: 3,
    serves: 1,
    buy: [['krem', '250g'], ['polen', '250g']],
    title: { tr: 'Ballı polenli yoğurt', en: 'Yoghurt with honey and pollen', ar: 'لبن بالعسل وحبوب اللقاح' },
    intro: {
      tr: 'Üç dakikalık bir ara öğün.',
      en: 'A three-minute snack.',
      ar: 'وجبة خفيفة في ثلاث دقائق.',
    },
    ingredients: {
      tr: ['1 kase süzme yoğurt', '1 yemek kaşığı krem bal ya da süzme bal', '1 tatlı kaşığı polen', '1 yemek kaşığı dövülmüş Antep fıstığı'],
      en: ['1 bowl strained yoghurt', '1 tbsp creamed or strained honey', '1 tsp bee pollen', '1 tbsp crushed Antep pistachios'],
      ar: ['وعاء من اللبن المصفّى', 'ملعقة كبيرة من العسل الكريمي أو المصفّى', 'ملعقة صغيرة من حبوب اللقاح', 'ملعقة كبيرة من فستق عنتاب المدقوق'],
    },
    steps: {
      tr: ['Yoğurdu kaseye alın.', 'Üzerine balı gezdirin, polen ve fıstığı serpin.'],
      en: ['Spoon the yoghurt into a bowl.', 'Drizzle with honey and scatter the pollen and pistachios on top.'],
      ar: ['ضع اللبن في وعاء.', 'رشّ العسل فوقه، ثم حبوب اللقاح والفستق.'],
    },
  },
]
