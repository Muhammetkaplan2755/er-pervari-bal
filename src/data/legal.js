/* ──────────────────────────────────────────────────────────────
   Yasal sayfalar — TASLAK. Yayından ve kartla satışa başlamadan önce
   bir avukat / mali müşavir kontrol etmeli.
   [TEYİT: …] yazan her yer gerçek bilgiyle değiştirilmeli (SELLER aşağıda).
   Dayanak: 6502 sayılı Tüketicinin Korunması Hakkında Kanun, Mesafeli
   Sözleşmeler Yönetmeliği (RG 27.11.2014), 6698 sayılı KVKK.
   Metinler yalnızca Türkçe; diğer dillerde "yalnızca Türkçe" notu çıkar.
   ────────────────────────────────────────────────────────────── */

export const SELLER = {
  brand: 'Er Pervari Bal',
  title: '[TEYİT: şirket / şahıs işletmesi unvanı]',
  address: 'Bakırcılar Çarşısı No: 32A, Gaziantep',
  phone: '0553 663 58 64 [TEYİT: gerçek numara]',
  email: '[TEYİT: e-posta adresi]',
  taxOffice: '[TEYİT: vergi dairesi]',
  taxNo: '[TEYİT: vergi / T.C. kimlik no]',
  mersis: '[TEYİT: MERSİS no, varsa]',
  shipWithin: '[TEYİT: örn. 1–3 iş günü]',
}

export const LEGAL_UPDATED = '2026-11-23'

const S = SELLER

const sellerList = [
  `Unvan: ${S.title}`,
  `Marka: ${S.brand}`,
  `Adres: ${S.address}`,
  `Telefon: ${S.phone}`,
  `E-posta: ${S.email}`,
  `Vergi dairesi / no: ${S.taxOffice} / ${S.taxNo}`,
  `MERSİS: ${S.mersis}`,
]

const caymaSections = [
  {
    h: 'Cayma hakkı',
    p: [
      'Alıcı, malı teslim aldığı günden itibaren 14 (on dört) gün içinde hiçbir gerekçe göstermeden ve cezai şart ödemeden sözleşmeden cayabilir.',
      `Cayma bildirimi bu süre içinde ${S.email} adresine e-posta ile, ${S.phone} numarasına WhatsApp mesajıyla ya da yazılı olarak ${S.address} adresine yapılabilir. Bildirimde ad soyad, sipariş numarası ve iade edilecek ürün yazılmalıdır.`,
    ],
  },
  {
    h: 'Cayma hakkı kullanılamayan ürünler',
    p: ['Mesafeli Sözleşmeler Yönetmeliği madde 15 gereği aşağıdaki durumlarda cayma hakkı kullanılamaz:'],
    list: [
      'Tesliminden sonra kapağı, bandı, mührü veya koruyucu ambalajı açılmış; iadesi sağlık ve hijyen açısından uygun olmayan gıda ürünleri (bal, petek bal, polen, tahin, pekmez, kuruyemiş dahil).',
      'Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler.',
      'Alıcının isteğiyle kişiye özel hazırlanan ürünler (örneğin özel hazırlanmış hediye kutuları).',
    ],
    after: 'Ambalajı açılmamış, mührü bozulmamış ürünlerde 14 günlük cayma hakkı geçerlidir.',
  },
  {
    h: 'İade süreci ve geri ödeme',
    list: [
      'Alıcı, cayma bildiriminden itibaren 10 gün içinde ürünü satıcıya geri gönderir.',
      'Satıcı iade için bir kargo firması belirtmişse iade kargo ücreti alıcıdan istenmez.',
      'Satıcı, cayma bildiriminin kendisine ulaştığı tarihten itibaren en geç 14 gün içinde, teslimat masrafları dahil tüm ödemeyi alıcının ödeme yaptığı yöntemle (kartla ödemelerde aynı karta) iade eder. Kartın bankasına bağlı olarak tutarın hesaba yansıması birkaç gün sürebilir.',
    ],
  },
  {
    h: 'Hasarlı veya hatalı ürün',
    p: [
      'Kargo paketi hasarlı geldiyse kargo görevlisine tutanak tutturun ve bize fotoğrafla bildirin. Hatalı, eksik veya ayıplı ürünlerde 6502 sayılı Kanun madde 11’deki seçimlik haklarınız (bedel iadesi, ücretsiz değişim, onarım veya indirim) saklıdır; bu durumda kargo ücretini satıcı karşılar.',
    ],
  },
]

const disputeSection = {
  h: 'Uyuşmazlık',
  p: [
    'Şikâyet ve itirazlarınız için Ticaret Bakanlığınca her yıl ilan edilen parasal sınırlar içinde, yerleşim yerinizdeki veya işlemi yaptığınız yerdeki Tüketici Hakem Heyetine ya da Tüketici Mahkemesine başvurabilirsiniz. Başvuru e-Devlet üzerinden TÜBİS ile de yapılabilir.',
  ],
}

export const legalDocs = [
  {
    slug: 'mesafeli-satis-sozlesmesi',
    title: 'Mesafeli satış sözleşmesi',
    description: 'Er Pervari Bal internet siparişleri için mesafeli satış sözleşmesi.',
    sections: [
      { h: '1. Taraflar', p: ['SATICI:'], list: sellerList, after: 'ALICI: Sipariş sırasında adı, adresi ve iletişim bilgileri girilen kişi.' },
      {
        h: '2. Konu',
        p: [
          'Bu sözleşme, alıcının satıcıya ait internet sitesinden elektronik ortamda sipariş verdiği ürünlerin satışı ve teslimi ile ilgili tarafların hak ve yükümlülüklerini 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine göre düzenler.',
        ],
      },
      {
        h: '3. Ürün, fiyat ve ödeme',
        list: [
          'Ürünlerin adı, miktarı, boyutu, vergiler dahil satış fiyatı ve kargo ücreti sipariş özetinde ve ödeme sayfasında gösterilir.',
          'Fiyatlara KDV dahildir. Kargo ücreti, ücretsiz kargo sınırı altındaki siparişlerde ayrıca gösterilir.',
          'Kartla ödemeler lisanslı ödeme kuruluşu iyzico (iyzi Ödeme ve Elektronik Para Hizmetleri A.Ş.) altyapısıyla, 3D Secure doğrulamasıyla alınır. Kart bilgileri satıcının sistemlerinde saklanmaz.',
          'Havale / EFT ve kapıda ödeme seçenekleri sunuluyorsa koşulları sipariş sırasında bildirilir.',
        ],
      },
      {
        h: '4. Teslimat',
        list: [
          `Ürünler ödemenin onaylanmasından sonra ${S.shipWithin} içinde kargoya verilir; her durumda sipariş tarihinden itibaren yasal süre olan 30 günü geçmez.`,
          'Teslimat, alıcının sipariş sırasında bildirdiği adrese yapılır. Kargo takip numarası alıcıya iletilir.',
          'Ön siparişli ürünlerde tahmini gönderim tarihi sipariş sırasında belirtilir.',
          'Satıcı, ürünün tedarik edilemediğini anlarsa durumu 3 gün içinde alıcıya bildirir ve ödenen tutarı en geç 14 gün içinde iade eder.',
        ],
      },
      ...caymaSections,
      {
        h: 'Genel hükümler',
        list: [
          'Alıcı, ödeme öncesinde ön bilgilendirme formunu ve bu sözleşmeyi okuduğunu ve elektronik ortamda onayladığını kabul eder.',
          'Sözleşme, alıcının ödemeyi onayladığı anda kurulur. Sözleşme metni satıcı tarafından saklanır ve talep edilirse alıcıya e-posta ile gönderilir.',
        ],
      },
      disputeSection,
    ],
  },
  {
    slug: 'on-bilgilendirme-formu',
    title: 'Ön bilgilendirme formu',
    description: 'Sipariş öncesi tüketiciye verilmesi gereken bilgiler.',
    sections: [
      { h: 'Satıcı bilgileri', list: sellerList },
      {
        h: 'Ürünün temel nitelikleri ve fiyatı',
        p: [
          'Siparişinizdeki ürünlerin adı, boyutu, adedi, KDV dahil fiyatı, kargo ücreti ve toplam tutar ödeme adımındaki sipariş özetinde yazılıdır. Bu tutarlar dışında bir ücret alınmaz.',
        ],
      },
      {
        h: 'Ödeme ve teslimat',
        list: [
          'Kartla ödeme iyzico altyapısıyla, 3D Secure doğrulamasıyla yapılır.',
          `Ürünler ödeme onayından sonra ${S.shipWithin} içinde kargoya verilir; teslim süresi en fazla 30 gündür.`,
          'Teslimat, sipariş sırasında verdiğiniz adrese yapılır.',
        ],
      },
      ...caymaSections,
      disputeSection,
    ],
  },
  {
    slug: 'iade-ve-cayma',
    title: 'İade ve cayma koşulları',
    description: 'Er Pervari Bal ürünlerinde iade, değişim ve cayma hakkı.',
    sections: caymaSections,
  },
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK aydınlatma metni',
    description: 'Kişisel verilerin işlenmesine ilişkin aydınlatma metni.',
    sections: [
      {
        h: 'Veri sorumlusu',
        p: [`6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu: ${S.title} (${S.brand}), ${S.address}.`],
      },
      {
        h: 'İşlenen kişisel veriler',
        list: [
          'Kimlik: ad, soyad.',
          'İletişim: telefon, e-posta, teslimat adresi.',
          'Müşteri işlem: sipariş içeriği, tutarı, tarihi, sipariş notu.',
          'İşlem güvenliği: ödeme sırasında IP adresi.',
          'Kart bilgileri satıcı tarafından alınmaz ve saklanmaz; doğrudan ödeme kuruluşu iyzico tarafından işlenir.',
        ],
      },
      {
        h: 'İşleme amaçları ve hukuki sebep',
        list: [
          'Siparişin alınması, ödemenin tahsili, ürünün kargoya verilmesi ve teslimi (KVKK md. 5/2-c, sözleşmenin kurulması ve ifası).',
          'Fatura düzenlenmesi, muhasebe ve yasal saklama yükümlülükleri (md. 5/2-ç, hukuki yükümlülük).',
          'İade, şikâyet ve uyuşmazlık süreçlerinin yürütülmesi (md. 5/2-e, hakkın tesisi ve korunması).',
        ],
      },
      {
        h: 'Aktarılan taraflar',
        list: [
          'Kargo firması (teslimat için ad, telefon, adres).',
          'Ödeme kuruluşu iyzico (kartla ödemede).',
          'Mali müşavir ve e-fatura / e-arşiv hizmet sağlayıcısı (fatura için).',
          'Talep halinde yetkili kamu kurumları.',
          'WhatsApp ile sipariş verirseniz mesajınız WhatsApp (Meta) altyapısı üzerinden iletilir.',
        ],
      },
      {
        h: 'Hizmet sağlayıcılar ve yurt dışına aktarım',
        p: ['Siteyi ve sipariş kayıtlarını aşağıdaki hizmet sağlayıcılar aracılığıyla işletiyoruz. Bunların sunucuları Türkiye dışında olabilir; aktarım KVKK md. 9 ve ilgili yönetmelikteki güvencelere göre yapılır. [TEYİT: standart sözleşme / Kurum bildirimi durumu avukatla netleştirilmeli]'],
        list: [
          'Netlify (site barındırma ve sipariş işlemleri) — ABD.',
          'Supabase (sipariş kayıtları ve yönetici paneli) — [TEYİT: proje bölgesi, örn. AB / Frankfurt].',
          'Sipariş bildirimi (WhatsApp): mesaja yalnızca sipariş numarası, ürünler, tutar ve il/ilçe yazılır; adınız, telefonunuz ve adresiniz gönderilmez.',
          'iyzico (kartla ödeme) — Türkiye.',
        ],
      },
      {
        h: 'Saklama süresi',
        p: [
          'Sipariş ve fatura kayıtları ilgili mevzuatın öngördüğü süre boyunca (Vergi Usul Kanunu ve Türk Ticaret Kanunu gereği genel olarak 10 yıl) saklanır, süre bitince silinir veya anonim hale getirilir.',
          'Tamamlanmayan siparişlerin (ödemesi yapılmayan ya da WhatsApp mesajı gönderilmeyen) kayıtları [TEYİT: örn. 30 gün] sonra silinir.',
        ],
      },
      {
        h: 'Haklarınız (KVKK md. 11)',
        p: [
          'Kişisel verinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, aktarıldığı tarafları öğrenme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.',
          `Başvurularınızı ${S.email} adresine e-posta ile veya ${S.address} adresine yazılı olarak iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz yanıtlanır.`,
        ],
      },
    ],
  },
  {
    slug: 'gizlilik-ve-cerez',
    title: 'Gizlilik ve çerez politikası',
    description: 'Sitede hangi bilgilerin tarayıcınızda tutulduğu.',
    sections: [
      {
        h: 'Tarayıcınızda tutulanlar',
        p: ['Site reklam veya izleme çerezi kullanmaz. Yalnızca sitenin çalışması için tarayıcınızın yerel depolamasında şu iki bilgi tutulur:'],
        list: [
          'Sepetinizdeki ürünler (sayfayı kapatıp açtığınızda sepet kaybolmasın diye).',
          'Seçtiğiniz dil.',
        ],
        after: 'Bu bilgiler sunucumuza gönderilmez; tarayıcı ayarlarınızdan site verilerini silerek kaldırabilirsiniz.',
      },
      {
        h: 'Üçüncü taraf hizmetler',
        list: [
          'Arapça dil seçildiğinde yazı tipi Google Fonts’tan yüklenir; bu sırada IP adresiniz Google’a iletilir.',
          'Kartla ödeme sayfası iyzico tarafından sunulur ve iyzico’nun gizlilik politikasına tabidir.',
          'Harita ve Instagram bağlantıları ilgili sitelerde açılır.',
        ],
      },
      {
        h: 'Değişiklikler',
        p: ['Ölçümleme (ör. ziyaretçi istatistiği) eklenirse bu sayfa güncellenir ve gerekli durumlarda onayınız istenir.'],
      },
    ],
  },
]

export const legalBySlug = (slug) => legalDocs.find((d) => d.slug === slug)
