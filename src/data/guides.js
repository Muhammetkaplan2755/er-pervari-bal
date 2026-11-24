/* Rehber yazıları (SEO). Yalnızca Türkçe: Türkçe aramaları hedefler; EN/AR okurlara
   arayüzde "yalnızca Türkçe" notu gösterilir.
   Kurallar: sağlık iddiası yok ("şifa", "bağışıklık" vb.), uydurma sayı/kaynak yok,
   sitedeki SSS ve karşılaştırma tablosuyla çelişen bilgi yok. Yeni yazı eklerken
   aynı yapıyı izleyin; prerender sayfayı, Article verisini ve sitemap kaydını kendisi üretir. */

export const guides = [
  {
    slug: 'karakovan-bali-nasil-anlasilir',
    title: 'Karakovan balı nasıl anlaşılır?',
    description:
      'Karakovan balı ile çerçeve petek arasındaki fark, karakovan peteğin görünüşü, hasadı ve fiyatı. Satın alırken nelere bakılır, neyi göz kararıyla anlamak mümkün değildir?',
    date: '2026-11-14',
    img: 'petek',
    imgPos: '50% 55%',
    imgAlt: 'Ahşap sepette yan yana dizilmiş, düzensiz kesitli karakovan petekler',
    lede:
      'Karakovan, balın değil kovanın adıdır: arının peteğini sıfırdan ördüğü geleneksel kovan. Bu yüzden karakovan balını tanımanın yolu önce peteğe, sonra da balın nereden geldiğine bakmaktan geçer.',
    sections: [
      {
        h: 'Karakovan nedir?',
        p: [
          'Karakovan; oyulmuş kütük, sepet ya da ahşap sandık gibi geleneksel bir kovandır. Çerçeveli modern kovanlardan farkı, içine fabrikada basılmış hazır temel petek konmamasıdır. Arı, peteğin mumunu da tamamen kendisi örer.',
          'Ortaya çıkan petek, arının kovanın şekline göre ördüğü doğal bir yapıdır. Bal da bu peteğin içinde olgunlaşır ve genellikle petekle birlikte satılır.',
        ],
      },
      {
        h: 'Karakovan peteği nasıl görünür?',
        p: ['Karakovan peteği çerçeve peteğe göre kolayca ayırt edilebilecek birkaç özelliğe sahiptir:'],
        list: [
          'Kalın ve düzensizdir; dilimlerin kesiti birbirinden farklı görünür.',
          'Kenarları yuvarlaktır ve üzerinde düz bir çerçeve izi bulunmaz.',
          'Kesitte koyu ya da renkli görünen hücreler genellikle polen ve propolis kalıntısıdır.',
          'Rengi ve tadı kovanın kurulduğu yerdeki çiçeklere göre açık sarıdan koyu kehribara kadar değişir.',
        ],
      },
      {
        h: 'Çerçeve petekten farkı',
        p: [
          'Çerçeve kovanda arı, fabrikada basılmış temel petek levhasının üzerine örer. Bu yüzden çerçeve petek düz, hücreleri eşit ve dört kenarı tahta çerçeveyle sınırlıdır. Çerçeve kovanda bal sezon içinde birden fazla kez alınabilirken karakovanda hasat genellikle yılda bir kez, yaz sonu ile sonbahar arasında yapılır.',
          'Arı mumu da kendisi ürettiği için karakovanda kovan başına çıkan bal daha azdır. Emek ve verim farkı fiyata yansır; karakovan petek bu nedenle çerçeve petekten pahalıdır.',
        ],
      },
      {
        h: 'Göz kararıyla anlaşılamayanlar',
        p: [
          'Peteğin görünüşü kovan tipini anlatır ama balın saflığını kanıtlamaz. Bir balın katkılı olup olmadığı, şeker şurubu ile beslenmiş arılardan gelip gelmediği ya da hangi çiçeklerden toplandığı dışarıdan bakarak kesin olarak anlaşılamaz; bunlar ancak laboratuvar analiziyle ortaya çıkar.',
          'Bu yüzden en sağlam yol, balın nereden geldiğini anlatabilen bir yerden almaktır. Satıcıya kovanların nerede olduğunu, hasadın ne zaman yapıldığını ve varsa analiz raporunu sorabilirsiniz.',
        ],
      },
      {
        h: 'Satın alırken kısa kontrol listesi',
        list: [
          'Petek düzensiz, kalın ve çerçeve izi olmadan mı?',
          'Satıcı balın hangi bölgeden ve hangi hasattan geldiğini söyleyebiliyor mu?',
          'Kavanoz ya da kutunun üzerinde parti numarası ve üretici bilgisi var mı?',
          'Varsa analiz raporunu görebiliyor musunuz?',
        ],
      },
    ],
  },
  {
    slug: 'sahte-bal-nasil-anlasilir',
    title: 'Sahte bal nasıl anlaşılır? Evde yapılan testler ne kadar güvenilir?',
    description:
      'Su bardağı, kibrit ve parmak testleri neden güvenilir değil? Şekerlenme sahtelik belirtisi mi? Balın katkılı olup olmadığını gerçekten gösteren laboratuvar analizleri ve satın alırken dikkat edilecekler.',
    date: '2026-11-14',
    img: 'suzme',
    imgPos: '38% 64%', // keep the hand, jar and honey stream in the wide crop
    imgAlt: 'Cam kaşıktan altıgen desenli kavanoza akan süzme bal',
    lede:
      'İnternette sahte balı anlamak için pek çok ev testi dolaşıyor. Bu testlerin ortak sorunu şu: gerçek bal testi geçemeyebilir, katkılı bal ise geçebilir. Kesin cevap laboratuvardan gelir.',
    sections: [
      {
        h: 'Yaygın ev testleri ve neden yanıltıcı oldukları',
        p: ['En çok anlatılan testler ve sınırları:'],
        list: [
          'Su bardağı testi (bal suda hemen dağılmazsa gerçektir): Balın suda dağılma hızı kıvamına, nemine ve sıcaklığına bağlıdır. Koyu kıvamlı bir şurup da dibe çökebilir.',
          'Kibrit ya da yanma testi: Sonucu balın nem oranı ve kibritin kendisi belirler; saflık hakkında güvenilir bilgi vermez.',
          'Parmak, kâğıt havlu ve ip gibi akma testleri: Akışkanlık balın türüne ve sıcaklığa göre değişir. Kıvamı yoğun bir şurup aynı görüntüyü verebilir.',
          'Sirke, iyot ve benzeri karışım testleri: Bilimsel olarak bir ölçüt sunmazlar; sonuçlarını yorumlamak mümkün değildir.',
        ],
      },
      {
        h: 'Şekerlenme sahtelik belirtisi değildir',
        p: [
          'Bal şekerlendi diye sahte değildir. Şekerlenme (kristalleşme), balın içindeki şekerlerin doğal davranışıdır ve çoğu gerçek bal zamanla kristalleşir. Hızı balın şeker yapısına, saklandığı sıcaklığa ve içindeki polen gibi parçacıklara göre değişir.',
          'Tersi de geçerlidir: hiç şekerlenmemesi tek başına balın sahte olduğunu göstermez. Bazı bal türleri uzun süre akışkan kalabilir.',
        ],
      },
      {
        h: 'Balın gerçekten katkılı olup olmadığı nasıl anlaşılır?',
        p: [
          'Kesin sonuç yalnızca yetkili bir gıda laboratuvarındaki analizlerle alınır. Bal analizlerinde bakılan başlıca ölçütler şunlardır:',
        ],
        list: [
          'Şeker profili: fruktoz, glukoz ve sakaroz miktarları.',
          'C4 şekeri (izotop analizi): mısır ve şeker kamışı kaynaklı şurup katkısını ortaya çıkarmak için kullanılır.',
          'Nem oranı: yüksek nem, balın bozulmaya (mayalanmaya) yatkın olduğunu gösterir.',
          'HMF ve diastaz: balın ısıl işlem görüp görmediği ve tazeliği hakkında bilgi verir.',
          'Polen analizi: balın hangi bitkilerden ve hangi bölgeden geldiğine dair ipucu verir.',
        ],
        after:
          'Türkiye\'de balın taşıması gereken ölçütler Türk Gıda Kodeksi Bal Tebliği ile belirlenir. Bir analiz raporunu okurken sonuçların bu ölçütlere uygun olup olmadığına bakılır.',
      },
      {
        h: 'Satın alırken dikkat edilecekler',
        list: [
          'Balın nereden geldiğini, kovanların nerede olduğunu ve hasat zamanını anlatabilen bir satıcıdan alın.',
          'Etikette üretici bilgisi ve parti numarası olup olmadığına bakın.',
          'Varsa analiz raporunu isteyin; raporun hangi laboratuvardan ve hangi partiye ait olduğunu kontrol edin.',
          'Piyasanın çok altındaki fiyatlara şüpheyle yaklaşın: gerçek balın üretim maliyeti bellidir.',
        ],
      },
    ],
  },
  {
    slug: 'bal-sekerlenince-bozulur-mu',
    title: 'Bal şekerlenince bozulur mu? Şekerlenen bal nasıl eski haline gelir?',
    description:
      'Balın şekerlenmesi neden olur, bozulduğu anlamına gelir mi? Şekerlenen bal ılık suda nasıl akışkan hale getirilir, bal nasıl saklanır ve gerçekten bozulmuş bal nasıl anlaşılır?',
    date: '2026-11-14',
    img: 'krem-bal',
    imgPos: '60% 55%',
    imgAlt: 'Ahşap kaşıkla kavanozdan çekilen koyu kıvamlı krem bal',
    lede:
      'Kavanozdaki balın donuklaşıp kristal kristal olması çoğu kişiyi tedirgin eder. Oysa bu, balın içindeki şekerlerin doğal davranışıdır; bal bozulmuş değildir.',
    sections: [
      {
        h: 'Bal neden şekerlenir?',
        p: [
          'Bal, suda çözünebileceğinden fazla şeker taşıyan yoğun bir karışımdır. Zamanla bu şekerlerin bir kısmı, özellikle glukoz, kristal hâline geçer. Çoğu gerçek bal er ya da geç kristalleşir.',
          'Kristalleşmenin hızı balın türüne göre değişir. Serin ortamda (yaklaşık 10–15 °C) ve içinde polen gibi küçük parçacıklar bulunan ballarda daha çabuk olur. Bu yüzden buzdolabında saklanan bal daha çabuk şekerlenir.',
        ],
      },
      {
        h: 'Şekerlenen bal nasıl eski haline gelir?',
        list: [
          'Kavanozun kapağını hafifçe gevşetin.',
          'Kavanozu 40 °C\'nin altındaki ılık suya koyun; su seviyesi baldan biraz yüksek olsun.',
          'Ara ara karıştırarak bal akışkanlaşana kadar bekleyin, gerekirse suyu tazeleyin.',
          'Kaynar su, doğrudan ocak ateşi ve mikrodalga kullanmayın: yüksek ısı balın yapısını bozar.',
        ],
        after:
          'Bal yeniden şekerlenebilir; bu da normaldir. İhtiyacınız kadarını ayrı bir kaba alıp ısıtmak, kavanozun tamamını tekrar tekrar ısıtmaktan daha iyidir.',
      },
      {
        h: 'Krem bal: kontrollü şekerlenme',
        p: [
          'Krem bal, kristalleşmenin kontrollü yapılmasıyla elde edilir. Kristaller ince ve düzenli olduğu için bal, kaşıkla kesilen ve ekmeğe sürülünce damlamayan ipeksi bir kıvam kazanır. Yani şekerlenme her zaman istenmeyen bir durum değildir.',
        ],
      },
      {
        h: 'Bal nasıl saklanır?',
        list: [
          'Ağzı kapalı kapta, oda sıcaklığında ve güneş almayan bir yerde saklayın.',
          'Buzdolabına koymayın; balı daha çabuk şekerlendirir.',
          'Kavanoza ıslak kaşık sokmayın: dışarıdan giren su balın bozulmasına yol açabilir.',
        ],
      },
      {
        h: 'Bal ne zaman gerçekten bozulmuştur?',
        p: [
          'Şekerlenme bozulma değildir. Bozulmanın işaretleri farklıdır: yüzeyde köpüklenme, ekşi ya da alkolü andıran bir koku ve tat, belirgin şekilde sulanıp ayrışma. Bunlar genellikle balın nem alıp mayalandığını gösterir. Böyle bir balı tüketmeyin.',
          'Hatırlatma: Bir yaşından küçük bebeklere bal verilmemelidir; bu, petek bal ve krem bal için de geçerlidir.',
        ],
      },
    ],
  },
]

export const guideBySlug = (slug) => guides.find((g) => g.slug === slug)
