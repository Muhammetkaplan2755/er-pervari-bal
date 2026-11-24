# Er Pervari Bal · tasarım raporu

## Yön

Taste-skill üç yön dağıttı. **Split-stage** düzenini seçtim. Bakırcılar Çarşısı’ndaki 32A kapısında alıcı peteğe bakarken satıcı peteği anlatabilir. Sayfada bu ilişkiyi, masaüstünde okuyucunun yanında kalan gerçek petek fotoğrafı ve karşısındaki kısa açıklamalar kuruyor. Telefonda önce petek, ardından açıklama geliyor. Kapanışta aynı düzen dükkân cephesi ve adresle geri dönüyor. Girişteki 32A levhası doğrudan bu adrese gidiyor.

**Pinned-poster** çok sayıda farklı kareye ve uzun bir ikinci sabit sahneye dayanıyordu. Mevcut film bu görevi zaten üstleniyor. **Page-is-the-object** tüm sayfayı basılı bir nesneye dönüştürecekti. Dükkânın gerçek etiket ya da ambalaj tasarımı henüz elimizde yok. Envanter ve bölüm argümanları `.taste-skill/yon.md`, tam dağıtım `.taste-skill/direction.json` içinde.

## Yazı ve renk

Başlıklarda dik Instrument Serif 400, gövdede Inter Variable kullanıldı. Kurulu Fontsource paketleri sırasıyla `@fontsource/instrument-serif` 5.2.8 ve `@fontsource-variable/inter` 5.2.8. Başlık yüzünün Latin ve Latin Extended dosyaları yerelden geliyor. Arapçada mevcut `@fontsource/ibm-plex-sans-arabic` 5.2.9 yükleniyor. Yeni paket kurulmadı. Dağıtılan Besley ve Libre Franklin ikilisi iki yeni aile gerektirecekti.

Bakırın patinasından alınan koyu yeşil #163e38 kapı levhasını ve adres yüzeyini birleştiriyor. Mağaza zemini #e8eeea, gövde #344d45, ikincil metin #485d54, bağlantı vurgusu #853d22. Bal amberi #ffcf5c sipariş ve yol tarifi gibi eylemlerde kalıyor. Sinematik girişte balın kendi rengi fotoğraftan geliyor.

## Uygulama dosyaları

| Dosya | Değişiklik |
|---|---|
| src/styles/globals.css | Yerel dik serif, mağaza renkleri, başlık hizası, düğmeler ve kaydırınca görünür olmayı beklemeyen içerik. |
| src/components/Hero.jsx | İki satırlı düz başlık ve dükkâna giden 32A levhası. Yinelenen bilgi kartları kaldırıldı. |
| src/components/Hero.css | Girişin tipografisi, levha, açıklama kontrastı ve fotoğrafın ilk boyaması. |
| src/i18n/strings.js | Giriş açıklaması üç dilde yayla ile çarşıdaki tezgâhı bağlıyor. |
| src/components/Navbar.css | Üst menüde bulanıklık yerine opak renkler. |
| src/components/Karakovan.jsx | Numaralı bento kutuları yerine petek, açıklamalar, saklama ve karşılaştırma. |
| src/components/Karakovan.css | Sabit fotoğraf ile akan metin, mobilde tek sütun. |
| src/components/Products.jsx | Vitrin başlığı üzerindeki tekrar kaldırıldı. |
| src/components/Products.css | Kare ürün görselleri, düz çizim zemini ve telefonda iki sütun. |
| src/components/Quiz.jsx | Seçicinin başlığında düz metin. |
| src/components/Quiz.css | Ayrı renk alanı içinde başlık ve çalışan seçim formu. |
| src/components/Shop.jsx | Sipariş başlığı sadeleştirildi, ürün adları kategori başlığının alt düzeyine alındı. |
| src/components/Shop.css | Ürün, boy, fiyat ve ekleme eylemi aynı listede hizalandı. |
| src/components/Faq.jsx | SSS başlığında yinelenen etiket ve italik kaldırıldı. |
| src/components/Visit.jsx | Dükkân başlığında etiket ve italik kaldırıldı. |
| src/components/Sections.css | SSS iki sütuna ayrıldı, adres opak patina zeminine taşındı, altbilgi renklendirildi. |
| src/pages/Page.jsx | İç sayfa başlıklarının iki parçası tek yazı üslubuyla birleşiyor. |

## Doğrulama

- `npm run build` başarılı. 27 sayfa ve 404 üretildi. Var olan alan adı ve satıcı künyesi eksikleri build sırasında uyarı verdi. `npx oxlint src` çıkış kodu 0.
- Üretim önizlemesinde ana sayfa, Tahin ve Yasal metinler açıldı. Üçünde de tek ana başlık görüldü ve tarayıcı çalışma zamanı istisnası yakalanmadı.
- TR, EN ve AR dil düğmeleri tarayıcıda denendi. 375 ve 1440 pikselde üç dilde de belge genişliği ekranla eşitti. Arapça geçişinde belge rtl oldu, başlık IBM Plex Sans Arabic ile çizildi. Azaltılmış hareket açıkken de adres ve ürün bilgilerine erişilebildi.
- İlk ölçümde mobil açıklamanın küçüklüğü ve yatay kayan raf görüldü. Yazı büyütüldü, raf iki sütuna alındı. Son incelemede mağaza içeriğini bekleten giriş efekti kaldırıldı. Görseller `.taste-skill/ilk/` ve `.taste-skill/after/` altında. Son klasörde 1440, 768 ve 375 piksel için ilk ekran ve kaydırma kareleri, ayrıca Arapça giriş ve karakovan görüntüleri var.
- Orijinal sürümün inspect denemesi Chrome Page.enable zaman aşımında kaldı. Düzenleme sonrası geçici test tarayıcısıyla ölçüm yapıldı. İlk görsel ölçüm 12 FAIL ve 12 WARN, son ölçüm 7 FAIL ve 8 WARN. Tüm kaynakta taste lint önce 66 FAIL / 47 WARN, sonra 49 FAIL / 35 WARN verdi. Impeccable bileşen taraması boş bulgu dizisi döndürdü.
- Taste bulguları arasında film sayacı, sabitlenen metin, bal geçişinin renkleri, fiyat listesinin ayraçları, kutu sınırları ve yinelenen ürün kontrolleri bulunuyor. Kaynak taraması yönetici panelini de içeriyor. Tam sonuçlar `.taste-skill/inspect-son.txt`, `.taste-skill/after/report.json` ve `.taste-skill/lint-son.txt` içinde. Tasarım denetimi temiz değil. Tüm etkileşim durumları için WCAG AA sertifikasyonu ve karşılaştırmalı LCP ölçümü yapılmadı.

## Sahibine çekim listesi

| Konu | Açı ve oran |
|---|---|
| Polen, tahin, pekmez, Antep fıstığı | Her ürünü gerçek satış ambalajıyla ayrı çekin. Etiket karşıdan okunabilsin. 4:5 dikey çekin, kare kırpma için boşluk bırakın. |
| Kahvaltı, karakovan ve bayram kutuları | Her gerçek kutuyu açık hâlde tepeden 1:1, kapalı hâlde 45 dereceden 4:5 çekin. İçerikler satıştaki kutuyla aynı olsun. |
| Karakovan ve çerçeve | İkisini aynı ışıkta ayrı ayrı karşıdan 4:5 çekin. Petek kenarını ve çerçeveyi kadraja alın. Ek olarak kesiti yandan 1:1 çekin. |
| Süzme ve krem bal | Satış kavanozunu karşıdan 4:5, kaşıkta kıvamı yandan 1:1 çekin. |
| Dükkân ve raf | Kapı numarasıyla cepheyi karşıdan, rafı tezgâh hizasından 16:9 çekin. Film için uzun kenarı en az 1920 piksel tutun. |

Fotoğraflar geldiğinde ürüne ait birincil görseli yönetim panelinde eşleştirin. Mobil kare kırpmasını ve ürün detayını kontrol edin. Yerel dosya akışı kullanılırsa 640 ve 1220 piksel WebP türevlerini, ürün eşlemesini ve feed uygunluğunu güncelleyin. Gerçek fotoğraf gelene kadar çizimler etiketli kalıyor. Açık arşiv görseli seçilmedi.

## İkinci tur

Üretim önizlemesinde 1440, 768 ve 375 pikselde yapılan son **inspect ölçümü 0 FAIL / 3 WARN** verdi. Önceki turun sonucu 7 FAIL / 8 WARN idi. Aynı genişliklerde yatay taşma sıfır. Ölçülen metinler için düşük kontrast bulgusu çıkmadı. Denetim metni `.taste-skill/inspect2.txt`, ölçümler ve ekran görüntüleri `.taste-skill/after2/` altında.

| Bulgu | Yapılan değişiklik ve doğrulama |
|---|---|
| Hairline, outlined-box, icon-cards | Sipariş bölümünün üç kategorisindeki 5, 3 ve 3 ürün satırını denetçi, çizgi ve ekleme ikonu yüzünden kart olarak okuyordu. Satırlar arası ayrımı boşluk sağlıyor. Ürün adı detay bağlantısı, fiyat ve ekleme ayrı sütunlar. Karakovan karşılaştırmasının hücreleri ve form alanları işlevsel sınırlarını koruyor. |
| Eyebrow, numbering, mixed-font-headline | Filmde sayaç ve üst etiketler kaldırıldı. Çarşı adı ve 32A üç dilde son sahnenin davetine alındı. Bal seçicisinde ilerleme bilgisi seçeneklerin altına taşındı. Soru başlığı tek yüzle okunuyor. |
| Gradient, covered-text, long-pin | Film fotoğrafları siyah zemin üzerinde nötr biçimde karartıldı. Yazıların üstündeki gren kaldırıldı. Bir sonraki sahne eski yazının alanına girerken eski başlık kapanıyor. 375 ve 1440 pikselde dört sahne ile aralarındaki geçişler örneklendi. Okuma anlarında üç ayrı noktada doğrudan başlığın kendisine erişildi. Tablet fiyat satırı da yüzen WhatsApp bağlantısından uzaklaştırıldı. |
| Size-count, off-centre | Altı ortak tipografi adımı var. Masaüstünde 14, 17, 21, 32, 52 ve 89 piksel ölçüldü. Karakovan açıklaması 17 piksel. 1440 pikselde iki dış kenar da 37 piksel, 375 pikselde ikisi de 18 piksel. |
| Dev-server | Son ölçüm 5181 portunda üretim dosyalarından alındı. Build 27 sayfa ve 404 üretti. Oxlint temiz geçti. Build, önceden eksik olan satıcı bilgileri ve alan adı için uyarı verdi. |

**Kalan üç inspect uyarısı.** `pinned-over-picture`, sahibinin istediği sinematik anlatımda başlığın kendi fotoğrafı üzerinde durmasını ölçüyor. Fotoğrafın üzerini örten başka bir başlık görülmedi. `no-footage` gerçek video bulunmadığı için, `font-not-dealt` yerel Instrument Serif ve Inter seçimi sürdüğü için kaldı.

**Kaynak denetimi.** Yönetici paneli hariç 67 kaynak dosyasında taste lint **0 FAIL / 2 WARN** verdi. Biri radyo alanının tıklanabilir etiket sınırı, diğeri tüm dosyalardaki uzun tireleri toplayan metin ölçütü. Tüm `src` taraması **6 FAIL / 9 WARN** verdi. Altı FAIL'in tamamı kapsam dışındaki yönetici panelinde. İki taramanın çıktısı `.taste-skill/lint2-magaza.txt` ve `.taste-skill/lint2.txt` içinde.

**Dil ve hareket.** Dil düğmelerinden TR, EN ve AR seçildi. Azaltılmış hareket açıkken 375 ve 1440 pikselde Arapça RTL, yerel IBM Plex Sans Arabic ve ekranla eşit belge genişliği doğrulandı. Tarayıcı çalışma zamanı hatası yakalanmadı. Arapça giriş ve karakovan kareleri ile dil ve film kontrol kayıtları son görüntülerle aynı klasörde.

## Task A — Honey pour

Karakovan karşılaştırmasından ürünlere geçerken sabit bir çelik kaşığın ucundan bal dökülüyor. Akış aşağı inerken inceliyor, temas noktasında dönerek katlanıyor ve dış halkalar havuza gömülüyor. Kaşığın kenarındaki ikinci damla aralıklarla büyüyüp düşüyor.

- `src/components/HoneyPour.jsx` sunucuda da çizilen sabit SVG’yi, görünürlük eşiğini, veri tasarrufu ve hareket tercihlerini yönetiyor. `HoneyPour.css` kadrajı ve gölgeyi tanımlıyor. `Karakovan.jsx` bileşeni tek noktada çağırıyor.
- `src/components/honeyPourScene.js` kaşığı dönel yüzeylerden, bal şeridini GPU üzerinde bükülen 220 boyuna bölümlü bir silindirden üretiyor. Bakış açısına bağlı amber rengi, parlak yüzey kaplaması ve RoomEnvironment yansıması balın kenarlarını aydınlatıyor. Havuz yüzeyinin normalleri radyal olarak dalgalanıyor. Damla dahil altı çizim çağrısı ve 18 binin altında üçgen kullanılıyor.
- Sahne sayfa yüklendikten sonra, bölüme yaklaşılınca ve tarayıcı boşta kaldığında ayrı paket olarak yükleniyor. Piksel oranı en fazla 1,5. Ekran dışına çıkınca ve sekme gizlenince çizim duruyor.
- Üretim önizlemesinde 1440 × 900, DPR 1, AMD Radeon entegre GPU ve ANGLE/D3D11 ile sahne görünürken beş saniyelik requestAnimationFrame ölçümü **481 kare, ortalama 96,2 fps** verdi.
- 768 pikselde canlı sahne, 375 pikselde sabit çizim görüldü. Azaltılmış hareket, Save-Data ve WebGL kapalı senaryoları sabit çizime geçti. Arapça RTL dahil incelenen genişliklerde yatay taşma veya JavaScript çalışma zamanı hatası görülmedi.
- `npm run build` 27 sayfa ve 404 çıktısını üretti. `npx oxlint src` temiz geçti. Derleme mevcut satıcı bilgisi ve SITE_URL uyarılarını verdi.
- [Masaüstü 1](.taste-skill/honeypour/desktop-1.jpg) · [Masaüstü 2](.taste-skill/honeypour/desktop-2.jpg) · [Masaüstü 3](.taste-skill/honeypour/desktop-3.jpg) · [Tablet](.taste-skill/honeypour/tablet-1.jpg) · [Mobil](.taste-skill/honeypour/mobile-1.jpg) · [Arapça](.taste-skill/honeypour/arabic-1.jpg) · [Azaltılmış hareket](.taste-skill/honeypour/reduced-1.jpg) · [Veri tasarrufu](.taste-skill/honeypour/savedata-1.jpg) · [WebGL kapalı](.taste-skill/honeypour/no-webgl-1.jpg)

## Task B — Cinematic motion

Filmin petek ve damla pencereleri korunuyor. Süzme baldan raflara geçerken kısa bir amber alan iki fotoğrafı birleştiriyor. Raf fotoğrafı daha yavaş geri çekiliyor. Son sahne, 32A’nın kapısını çağrıştıran dikey bir aralıktan açılıyor. Fotoğrafa uygulanan ters ölçek cepheyi sabit tutuyor, ardından kamera kapıya yaklaşıyor. Ödüllü işlerin sunumlarında fotoğrafın hareket boyunca görsel referans olarak kalmasını ve görüntüler arasında sürekliliği inceledim. Uygulama mevcut dükkân fotoğraflarını kullanıyor. [Awwwards ürün sunumu](https://assets.awwwards.com/awards/gallery/2020/09/live-presentation-jonas-bruno.pdf) · [Awwwards geçiş sürekliliği incelemesi](https://www.awwwards.com/brainfood-mobile-performance-vol3.pdf)

Film başlıkları taban çizgisinden kelime kelime yükseliyor. Ekran okuyucu başlığın tamamını tek ad olarak alıyor. Arapça kelimeler bütün kalıyor, yatay hareket yön değiştiriyor. Açık mağaza bölümlerinde ekranın altında başlayan başlık ve açıklama kısa aralıkla yerleşiyor. Ürün fotoğrafının yakınlaşması klavye odağında da çalışıyor. Desteklenen tarayıcılarda rotalar arasında 220 ms geçiş var. Sayfa içi bağlantılar ve kaydırma yerel davranışı koruyor.

**Değişen dosyalar.** Film, erişilebilir başlıklar ve maskeler için `src/components/Film.jsx` ve `Film.css`, ilk ekran ve yazılımsal WebGL koşulu için `Hero.css` ve `HeroComb.jsx`, klavye odağı için `Products.css` değişti. Motorun ölçüm ve yazım sırası `src/motion/scroll.js`, ekran altı seçimi `src/motion/reveal.js`, mağaza ve rota hareketleri `src/styles/globals.css` ve `src/router.js` içinde. Yeni çalışma zamanı bağımlılığı yok. Aynı Node gzip ayarında ana paket 123.839 bayttan 125.556 bayta çıktı (+1.717 bayt). Bu fark eşzamanlı bal dökümü çalışmasını da kapsıyor.

**Hareket tercihi.** Sabitleme ve üst üste bindirme hydration sonrasında etkinleşiyor. JavaScript kapalıyken dört panel ve bağlantıları belge akışında, fotoğraflar noscript içinde. Kullanıcı film açıkken azaltılmış hareketi seçerse motor sahne kaydını kaldırıyor ve tüm metinler doğrudan okunabiliyor. Donanım hızlandırması bulunmadığında hero dükkân fotoğrafına dönüyor.

### Performans

5183 portunda her genişlik için yeni headless Chromium profili kullanıldı. LCP tarayıcının PerformanceObserver kaydıdır. Bloklama sütunu ilk içerik boyamasından test kaydırmasına kadar başlayan uzun görevlerin 50 ms üzerindeki sürelerinin toplamıdır. Lighthouse TBT farklı bir ölçüm penceresi kullanır. Lighthouse yerel önbellekte bulunamadı ve npm kayıt sunucusundan indirme EACCES verdi. Resmî TBT ve mobil Lighthouse puanı açık kalıyor.

| Görünüm | LCP önce → sonra | Bloklama önce → sonra | Film kaydırması önce → sonra | Kaydırmada 50 ms üstü görev |
|---|---:|---:|---:|---:|
| 1440 × 900 | 11.528 → 7.824 ms | 8.332 → 8 ms | 26 → 54 fps | 3 → 0 |
| 375 × 812 | 6.648 → 6.548 ms | 20 → 0 ms | 60 → 60 fps | 0 → 0 |

Yazılımsal çizimde masaüstü 60 fps hedefi açık. Fiziksel GPU ölçülmedi. Mobil LCP farkı tek ölçüm çiftinin değişkenliği içinde yorumlanmalı. [Önce](.taste-skill/cinematic/before.json) · [Sonra](.taste-skill/cinematic/after.json) · [Ölçüm betiği](.taste-skill/cinematic/measure.mjs)

**Doğrulama.** Üretim derlemesi 27 sayfa ve 404 üretti. Oxlint temiz. Inspect 1440, 768 ve 375 px genişliklerde 1 FAIL ve 3 WARN verdi. Tek FAIL paralel geliştirilen bal dökümü bölümündeki radyal zemindir. Uyarılar fotoğraf üzeri sabit başlık, gerçek video eksikliği ve seçili yerel yazı tipleriyle ilgili. Arapça mobil film, canlı hareket tercihi değişimi, JavaScript kapalı tablet görünümü, animasyonlu rota ve tarayıcının Geri işlemi doğrulandı. [Inspect çıktısı](.taste-skill/cinematic/inspect.txt) · [Masaüstü film şeridi](.taste-skill/cinematic/desktop-film-01.jpg) · [Arapça son sahne](.taste-skill/cinematic/ar-film-5.jpg) · [Azaltılmış hareket](.taste-skill/cinematic/ar-reduced.jpg)
