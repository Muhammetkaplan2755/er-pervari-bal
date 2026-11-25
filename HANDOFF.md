# Er Pervari Bal — web sitesi devir notu

Gaziantep Bakırcılar Çarşısı No: 32A'daki bal dükkanı **Er Pervari Bal (Eryılmaz Bal Dünyası)** için satış sitesi.
Instagram: @erpervari_bal. Kullanıcı Türkçe konuşuyor; açıklamaları Türkçe ver.

## Teknoloji
- Vite 8 + React 19, düz JavaScript (TypeScript yok), CSS dosyaları (Tailwind yok), animasyon kütüphanesi yok.
- Başlangıç stili "Fluxora" hero şablonundan uyarlandı: koyu bal zemini (#140800), amber vurgu (#f2a516 → #ffcf5c),
  Inter Tight + Inter, tek italik vurgu kelimesi Instrument Serif. Arapça için IBM Plex Sans Arabic (yalnızca AR seçilince yüklenir).
- Komutlar: `npm run dev` · `npm run build` (= `vite build && node scripts/prerender.mjs`) · `npx oxlint src scripts`
- Önizleme: `.claude/launch.json` → "bal-site" (5173). Production önizleme: `npx vite preview --port 4173`
  (vite preview'da prerender'lı ürün HTML'i yalnızca sonda `/` ile gelir: `/urun/suzme/`; Netlify/Vercel'de sorun değil).
- Git deposu değil.

## Dosya haritası
- `src/App.jsx` — Provider'lar (I18n, Cart), router, sayfa seçimi, anchor kaydırma.
- `src/router.js` — gerçek URL'ler: `/tarifler`, `/gunluk`, `/parti/KOD`, `/takip`, `/kurumsal`, `/urun/:id?boyut=`; ana sayfa anchor'ları `/#karakovan`, `/#siparis`, `/#hediye`, `/#sss`, `/#dukkan`, `/#secici`. Eski `#/sayfa` linkleri otomatik yeni adrese döner. Bilinmeyen → 404.
- `src/i18n/` — `strings.js` (TR/EN/AR yan yana, ~200 anahtar), `I18nContext.jsx` (`t()`, `pick()`, dil + `dir=rtl`).
- `src/meta.js` — sayfa başına `<title>`/description.
- `src/data/`
  - `catalog.js` — **fiyatlar, stok (in/low/out/preorder), varyantlar, kargo (₺150, ₺2.500 üzeri ücretsiz), ödeme yöntemleri, abonelik seçenekleri, kargo firmaları, WhatsApp numarası.** Fiyatlar ve numara GEÇİCİ.
  - `productInfo.js` — ürün sayfası açıklaması, fotoğraflar, bilgi satırları, `feedPhoto` (Google/Meta feed'e girer mi).
  - `content.js` (karakovan bölümü, ürün vitrinleri), `faq.js`, `recipes.js`, `journal.js`, `batches.js` (boş), `reviews.js` (boş → bölüm gizli), `site.js` (`SITE_URL` boş).
- `src/components/` — Navbar (dil seçici, sepet), Hero, Karakovan, Products, Quiz (bal seçici), Shop (fiyat listesi), CartDialog (native `<dialog>`, WhatsApp siparişi), Faq, Reviews, Visit (tıkla-yükle Google harita), Footer, `photo.js` (WebP srcset), `whatsapp.js`, `icons.jsx`.
- `src/pages/` — Product, Recipes, Journal, Batch, Tracking, Corporate, NotFound, Page (ortak çerçeve).
- `scripts/prerender.mjs` — build sonrası her sayfa/ürün için `dist/<yol>/index.html` (başlık, açıklama, canonical, Product + BreadcrumbList JSON-LD), `404.html`, `sitemap.xml`, `feeds/google-merchant.xml`, `feeds/meta-catalog.csv`.
- `public/` — `images/*.jpg` + `*-640.webp`/`*-1220.webp`, `robots.txt`, `llms.txt`, `_redirects` (Netlify), `favicon.svg`. Kökte `vercel.json`.
- Orijinal fotoğraf yedekleri: `C:\Users\USER\Desktop\balci-orijinal-fotolar\`.

## 3D petek (hero)
- `src/components/HeroComb.jsx` + `src/components/honeycombScene.js` (three.js 0.170, kodla üretilmiş petek; model dosyası yok).
- Yalnızca ≥1100px genişlik + hareket azaltma kapalı + WebGL varsa, sayfa `load` sonrası idle'da dinamik import. Mobilde three.js hiç inmez.
- three ayrı chunk (~130 kB gzip); ana paket +3 kB. `vite.config.js` chunk uyarı limiti 600.
- Hero'da sağda (`inset-inline-end`, AR'de sola geçer), CSS radial mask ile kenarı karanlığa erir. İmleç parallax + imleci izleyen parlama ışığı + damlayan bal. Ekran dışı/sekme gizliyken render durur; unmount'ta tüm GPU kaynakları dispose.
- Bal yüzeyi (menisküs) ve malzemeleri Codex (gpt-6.1-sol, high) ile iyileştirildi; ayar değerleri: menisküs yüksekliği `0.12`, bal clearcoatRoughness `0.055`, glint şiddeti `90`.
- Gerçek GPU kare hızı henüz ölçülmedi (Claude önizleme paneli gizliyken rAF ~1,5 fps'e kısılıyor; chrome-devtools profili başka Chrome tarafından kilitliydi).

## Sinematik ana sayfa (2026-11-14)
Kullanıcı Apple tarzı, kaydırmayla ilerleyen "görsel şölen" istedi (referans: Instagram'daki scroll-film site videosu). Görsel kaynağı: 3D petek + mevcut 6 fotoğraf (yapay zekâ videosu kullanılmadı).
- Motor: `src/motion/scroll.js` (bağımlılık yok; tek scroll dinleyici + rAF; `useScrollScene(ref, fn)` sabitlenen sarmalayıcının 0..1 ilerlemesini verir; fn `useCallback` ile sabit olmalı). Azaltılmış harekette sahneler hiç çalışmaz, CSS düz panellere döner.
- Hero (`Hero.jsx/.css`): `.hero-pin` 300svh, hero `sticky`. İlk ekran: yazılar bulanıklaşıp kaybolur, foto `scale` ile itilir, 3D kamera bir bal gözüne dalar (`heroState.js` → `honeycombScene.js`), `.hero__amber` bal rengi ekranı kaplar. İkinci ekran: film bunun üstüne biner.
- Film (`Film.jsx/.css`, metinler `src/data/film.js`, TR/EN/AR): 560svh (mobil 480svh), `margin-top: -200svh` ile hero'nun üstüne biner, açılana kadar saydam. Sahneler: petek (altıgen pencere), süzme (bal damlası dairesi), raflar (altıgen raflardan geri zoom), dükkan (perde + kapıya doğru dolly, Sipariş/Dükkanın yeri butonları). Zaman çizelgesi `Film.jsx` içindeki `T` dizisinde.
- Ürün rafı (`Products.jsx/.css`): sabitlenen bölümde dikey kaydırma kartları yatay kaydırır (RTL'de ters yön); son kart "Ayrıca" listesi + Sipariş butonu. Eski ızgara CSS'i Sections.css'ten silindi.
- Diğer bölümler: `src/motion/reveal.js` ile ilk görünüşte yukarı kayarak belirir; `.section-title` büyütüldü.
- Ölçüm: Playwright (parallax eklentisi) ile 1440×900'de 3D sahneyle ~107 fps (AMD entegre GPU). Mobilde 3D yüklenmez, film fotoğraf tabanlı.
- Fotoğraflar 1220px genişlikte; büyük ekranlarda tam ekran sahnelerde hafif yumuşaklık olabilir → sahibinden yüksek çözünürlüklü/yatay çekimler gelince 1920 WebP üret.

## Satış akışı
Sepet → teslimat formu → "WhatsApp ile sipariş ver" → `wa.me/905536635864` hazır mesaj. **Mesaj her dilde Türkçe gider**, müşterinin dili ve abonelik seçimi satır olarak eklenir. Kart ödeme yok (henüz).
Abonelik otomatik değil: dükkan elle takip eder.

## Bilinen eksikler / sahibinden beklenenler
1. Gerçek fiyatlar, gerçek WhatsApp numarası (`catalog.js`), alan adı (`site.js` → `SITE_URL`).
2. Ürün fotoğrafı yok: polen, tahin, pekmez, Antep fıstığı, 3 hediye kutusu → sayfada petek gözü yer tutucusu; feed'e girmiyorlar. Fotoğraf gelince: `public/images/AD.jpg` → WebP üret (Python PIL, 640/1220, q78) → `photo.js` boyut ekle → `productInfo.js` images + `feedPhoto: true`.
3. `(TEYİT)` işaretli içerik: kargo süresi/paketleme (faq.js, pd.shipTime), menşei/ambalaj (productInfo.js), kargo takip URL'leri (catalog.js CARRIERS), hediye kutusu içerikleri.
4. `batches.js` boş → kavanoz QR kodları "bulunamadı" der.
5. Yasal sayfalar yok: mesafeli satış, KVKK, iade, çerez. İYS (kampanya mesajı öncesi), ETBİS, gıda işletme kaydı.
6. Google İşletme Profili, Search Console, Merchant Center, Meta Commerce Manager kurulmadı.

## Yol haritası (araştırmadan; öncelik sırası)
- Kart/taksit ödeme: iyzico veya PayTR link ödeme ya da Shopier (komisyonlar ~%2–4; panelden doğrula).
- Analitik + KVKK çerez onayı (GA4 veya Plausible): sepete ekle → WhatsApp → sipariş hunisi.
- Tüm sayfalarda sabit WhatsApp butonu.
- Fiyatları Google Sheets'ten çekme (kod açmadan güncelleme).
- Blog/SEO yazıları ("karakovan balı nasıl anlaşılır").
- Pazar yerleri (Trendyol, Hepsiburada, Çiçeksepeti), WhatsApp Business kataloğu (meta-catalog.csv'den).
- Görsel/3D (yeni eklentilerle): Adobe ile ürün fotoğrafı arka plan temizleme/kırpma; CellCog ile 3D petek/kavanoz modeli → three.js ile hero'da 3D sahne (parallax-threejs ile hata ayıklama).

## Yeni kurulan eklentiler (bu oturumda, yeni oturumda aktif)
`design`, `website-design` (UXKIN), `audit-suite`, `adobe` (Adobe hesabı ister), `cellcog` (harici servis, ücretli olabilir), `parallax-threejs`.
Önceden kurulu: `frontend-design` (Anthropic), `chrome-devtools` MCP (Lighthouse/perf ölçümü için kullanıldı), caveman, impeccable, taste-skill.

## Bilinen ortam sorunu
- `dist/` build'de boşaltılmıyor: önceki oturumdan kalan `vite preview --port 4173` süreci klasörü tutuyor, Windows silmeleri sessizce askıda kalıyor. `dist/assets` eski `index-*.js` dosyalarıyla dolu (zararsız ama yayına da gider). Yayından önce o preview'u kapatıp `dist/`'i silip yeniden build al.

## Mağaza tasarımı (filmden sonrası, 2026-11-14)
Kullanıcı filmden sonraki bölümleri beğenmedi; Apple/Lenovo mağaza sayfası gibi istendi. Google'dan görsel ALINMADI (telif + başka satıcının ürününü gösterme riski); fotoğrafı olmayan ürünler için açıkça "Çizim" etiketli vektör illüstrasyonlar (`ProductArt.jsx`) kullanıldı. Pexels/Unsplash temsili görsel önerildi, kullanıcı henüz onaylamadı (indirme izni gerekir).
- Açık tema: `globals.css` → `.theme-light` (fildişi zemin, tokenlar tersine döner), `.store-intro/.store-eyebrow/.store-title/.store-lede/.store-link`, `.btn--ink` (koyu hap buton).
- Karakovan (`Karakovan.jsx/.css`): ortalanmış giriş + bento ızgara (petek fotosu, 4 bilgi kutusu, raflar fotosu, koyu "Saklama" kutusu) + gerçek `<table>` ile "Karakovan mı, çerçeve mi?" karşılaştırması.
- Ürün yelpazesi (`Products.jsx/.css`, eski yatay raf kaldırıldı): kategori sekmeleri (WAI-ARIA tabs, ok tuşları), ürün sütunları: görsel (feedPhoto varsa foto, yoksa çizim), ad, not, boyutlar, ilk boyut fiyatı, "Sepete ekle" + "Ürünü incele ›". Mobilde kaydırmalı satır.
- Sipariş (`Shop.*`) ve Bal seçici (`Quiz.*`): Codex (gpt-6.1-sol, high) tarafından mağaza stiline çevrildi (Claude diff'i inceledi): ürün kartları ızgarası, hap şeklinde boyut seçici, büyük fiyat, `btn--ink` sepete ekle, "Ürünü incele ›", kargo bilgi şeridi, alt ortada koyu "Sepeti gör" hapı; bal seçici tek büyük kart + seçenek kutuları + bölümlü ilerleme çubuğu. Sepet penceresi (CartDialog, Shop.css'i paylaşır) koyu kaldı.
- Not: "Ürün yelpazesi" (keşfet) ile "Sipariş" (satın al) aynı ürünleri iki kez gösteriyor (Apple'daki gibi). Kullanıcı tekrarı fazla bulursa yelpaze kartlarındaki "Sepete ekle" kaldırılıp yalnızca keşif bırakılabilir.
- SSS: ortalanmış akordeon; Dükkan: tam ekran dükkan fotosu üstünde cam kart; Footer: açık, sakin bant.
- `reveal.js`: `data-reveal-children` olan ızgaralar kutu kutu belirir.
- Ürün yelpazesi yalnızca vitrin (satın alma yalnızca #siparis'te).
- Ürün sayfası (`Product.*`, Codex gpt-6-astra): Apple ürün sayfası düzeni — solda galeri (foto yoksa "Çizim" etiketli `ProductArt`), sağda sticky satın alma kutusu, altta açıklama + "Ürün bilgisi" spec ızgarası; mobilde alt sabit satın alma çubuğu (`.pd__sticky`).
- Alt sayfalar (`Page.jsx`, `Pages.css`, Codex gpt-6-astra): tümü `theme-light`, ortalanmış store başlığı, açık formlar, koyu hap butonlar.
- Navbar: `.theme-light` bölüm üstündeyken `is-light` (açık cam), koyu bölümlerde koyu cam.
- `WhatsAppFab.jsx`: ilk ekrandan sonra sağ altta sabit WhatsApp butonu (Türkçe hazır selam), ürün sayfası mobilde satın alma çubuğunun üstüne çıkar.
- Karakovan bölümü filmin üstüne yuvarlak köşeli "sayfa" gibi biner (`.kk` margin-top -36px).
- Sonnet alt ajanları bu ortamda başlatılamıyor: context-mode eklentisi Agent isteğini değiştirdiği için auto mode onaylayamıyor. Paralel iş için Codex kullanıldı.

## Ana sayfa TBT gerilemesi — ölçüm ve düzeltme (2026-11-14)
- Sorun: mağaza tasarımından sonra Lighthouse mobil ana sayfa Performans 61, TBT 1.250 ms. Trace (CPU 4x, 412px): ana iş parçacığında zamanın çoğu **Layout** (~1,5–2,2 sn), JS değil; büyük layout'ları JS tetiklemiyor.
- Ölçüm araçları (scratchpad, Playwright MCP profili eski oturumca kilitli olduğu için bağımsız): `loaf.mjs` (long-animation-frame A/B, `VARIANTS` env ile CSS enjekte, 5 koşu ortanca), `trace.mjs` (CDP trace → olay türüne göre süre + layout'u tetikleyen JS satırı). Sistem Chrome'u `channel: 'chrome'` ile; npx önbelleğindeki playwright-core kullanıldı. Not: tek ölçümler ±1 sn sapıyor, karar için ortanca şart.
- Elenen şüpheliler: `text-wrap: balance`, web fontu, film görselleri, `.film__grain`, `.kk` gölgesi (anlamlı fark yok).
- Uygulanan (globals.css "Load-time performance"): `.lineup, .quiz, .faq, .visit, .footer` → `content-visibility: auto` (#siparis hariç: içindeki fixed sepet hapı; .kk hariç: yukarı gölgesi kırpılır); ≤860px'te tüm `backdrop-filter`'lar kapalı, yerine daha koyu düz zemin. Sonuç (ortanca engelleme): 3,73 sn → 2,30 sn, en uzun kare 1,18 → 0,86 sn. Lighthouse mobil (12.8.2): `/` Performans 61 → **81** (TBT 1.250 → 330 ms, LCP 3,4 sn), `/urun/suzme/` 91 (TBT 40 ms), `/kurumsal/` 90 (CLS 0,028); üçünde de Erişilebilirlik/BP/SEO 100.
- Kalan: hidrasyon + React işi (~600 ms, CPU 4x). Sonraki fikir: alt bölümleri tembel hidrasyon / `startTransition` ile bölmek.

## Hero → film geçiş akıcılığı (2026-11-15)
Kullanıcı petekten fotoğraflara geçişte düşük fps bildirdi. Düzeltmeler (hepsi compositor-only'e indirildi; trace'te geçiş boyunca Paint/RasterTask = 0):
- `honeycombScene.js`: dalış bitip `.hero__amber` tuvali kapatınca (`heroScroll.p ≥ 0.999`) son kare tutulur, render durur; `Hero.jsx` her scroll'da `heroScroll.wake()` çağırıp geri kaydırınca uyandırır.
- `Film.jsx/.css`: sahne = `.film__window` (STATİK clip-path, animasyon yalnız transform) > `.film__frame` (ters transform, foto sabit kalır) > img + shade. Altıgen ve damla için pencere kutusu şekli içeren kare (`box` = merkez + R), çerçeve geri ofsetlenir; açılış bitince geometri temizlenir. Perde = translate + ters translate. Önceden her karede tam ekran `clip-path` değişiyordu (repaint).
- Metin girişleri: `filter: blur` kaldırıldı (hero `.hero__inner` ve film yazıları) → yalnız opacity + translate3d.
- Film greni: `mix-blend-mode: overlay` kaldırıldı, opaklık 0,045.
- Film fotoğrafları armed olunca `img.decode()` ile önceden çözülür.
- Ölçüm araçları scratchpad'de: `fps.mjs` (bölge bazlı kare süresi), `paint.mjs` (geçişte paint/raster/GPU iş dökümü), `film-shots.mjs` (geçiş ortası ekran görüntüleri).

## Google görünürlük (2026-11-14)
- `GOOGLE-GORUNURLUK.md`: dükkan sahibi için adım adım rehber (İşletme Profili, kategori önerileri TEYİT, 750 karakterlik açıklama, fotoğraf listesi, haftalık gönderiler, WhatsApp'tan gerçek yorum isteme şablonu, alan adı + Search Console + Merchant Center/Meta katalog adımları).
- `index.html` Store JSON-LD: `hasMap`, `areaServed` (Türkiye), `currenciesAccepted` TRY, `paymentAccepted` eklendi. Çalışma saati/geo (TEYİT) bekliyor — uydurma yok.
- `public/llms.txt`: eski `#/` bağlantıları gerçek adreslere çevrildi, ürün sayfaları listelendi.
- **Bal rehberi (SEO yazıları):** `src/data/guides.js` (yalnızca Türkçe; sağlık iddiası yok, sitedeki SSS ile tutarlı), `src/pages/Guides.jsx` (`/rehber` liste, `/rehber/:slug` yazı, bilinmeyen slug → 404), stiller `Pages.css` sonunda. Yazılar: karakovan balı nasıl anlaşılır, sahte bal nasıl anlaşılır (ev testleri güvenilmez → laboratuvar), bal şekerlenince bozulur mu. Prerender her yazıya Article + BreadcrumbList JSON-LD, `og:type=article` yazar ve sitemap'e ekler (21 sayfa). Bağlantılar: footer "Bilgi", SSS altında "Bal rehberini okuyun", `llms.txt`. EN/AR okura "yalnızca Türkçe" notu. Kapak kırpması `imgPos`. Lighthouse mobil yazı sayfası: 82 / 100 / 100 / 100. Yeni yazı = guides.js'e bir kayıt eklemek.
- Yeni oturumda yüklü eklentiler: HarborRank SEO (skill'ler var, MCP `/mcp` ile yetkilendirme ister — canlı veri için alan adı + Search Console gerekir), Marketing (Anthropic), Social Media Skills.

## Performans (2026-11-14)
- **SSR prerender:** `npm run build` = `vite build` + `vite build --ssr src/entry-server.jsx --outDir dist-ssr` + `scripts/prerender.mjs`. Prerender her rotanın gövde HTML'ini `renderToString` ile `#root` içine yazar (TR, boş sepet). `src/main.jsx` ziyaret buna uyuyorsa `hydrateRoot`, uymuyorsa (kayıtlı EN/AR, dolu sepet, `?query`, eski `#/` link) `createRoot` ile baştan çizer → hidrasyon uyuşmazlığı yok.
- Render sırasında `window` kullanmayın: router sunucuda `setServerPath()` ile çalışır; tarayıcıya özgü başlangıç durumları (ör. `HeroComb` `wide`) `false` başlar, effect'te güncellenir.
- Hero fotoğrafı JS beklemeden CSS animasyonuyla belirir (`photo-in`); giriş animasyonları opacity 0.01'den başlar.
- Fontlar kendi sunucumuzdan (@fontsource): `Inter Variable` (gövde + başlık) ve `Instrument Serif` italik. Google Fonts kaldırıldı (Arapça font hâlâ yalnızca AR seçilince Google'dan).
- Film fotoğrafları ilk kaydırmada yüklenir (hero ile yarışmasın).
- Lighthouse mobil (Slow 4G simülasyonu): ana sayfa performans 66 → 78-80 (Inter Tight kaldırılmadan önceki ölçüm), ürün sayfası 81; erişilebilirlik/BP/SEO 100. Kalan: LCP'nin büyük kısmı "render delay" (font + JS). Sonraki adım: Inter'i yalnızca Latin+Türkçe karakterlere alt kümeleyip preload etmek.

## Kalite durumu (son ölçüm)
Lighthouse mobil: Erişilebilirlik 100, Best Practices 100, SEO 100 (ana sayfa ve ürün sayfası). LCP ~1,85 sn (Fast 4G + 4x CPU), CLS 0. Build ve oxlint temiz.
Caveman reviewer iki tur çalıştı; bulgular düzeltildi.

## Kartla ödeme + yasal sayfalar (2026-11-23) — TASLAK, canlıda KAPALI
- **Akış:** sepette "Kredi / banka kartı" → `POST /api/odeme-baslat` (`server/payment.js` tutarı `catalog.js`'ten yeniden hesaplar, iyzico Checkout Form başlatır) → müşteri iyzico'nun sayfasında 3D Secure ile öder → iyzico `/api/odeme-sonuc`'a döner → sonuç iyzico'dan sorgulanır → `/odeme?durum=basarili&no=EP…` (sepet boşalır) ya da `/odeme?durum=hata`. Kart bilgisi siteye hiç gelmez.
- **Aç/kapa:** `VITE_KART_ODEME=1` build sırasında. Yoksa sepet eskisi gibi yalnızca WhatsApp. `.env.development.local` yerelde açık tutar (yalnızca `npm run dev`); `.env.example` tüm değişkenleri anlatır.
- **Barındırma:** Netlify → `netlify/functions/odeme-*.mjs` + `public/_redirects` /api kuralları. Vercel → `api/odeme-*.js`. Geliştirme → `vite.config.js` içindeki `payment-api` eklentisi.
- **Test durumu:** doğrulama (onay, boş sepet, e-posta), sunucu fiyat hesabı, hata/başarı sayfaları denendi. iyzico'ya istek gidiyor; sahte anahtarla "api bilgileri bulunamadı" döndü. **2026-11-24 sandbox anahtarıyla uçtan uca denendi:** test kartı 5528 7900 0000 0008 ile 1.850 TL → `/odeme?durum=basarili`, sepet boşaldı; red kartı 4111 1111 1111 1129 → iyzico kendi sayfasında "Kart limiti yetersiz" deyip yeniden denetiyor. Sandbox sayfasında 3D Secure isteğe bağlı kutucuk; canlıda 3DS zorunluluğu iyzico hesap ayarından teyit edilmeli.
- **TEYİT:** `identityNumber` yer tutucu `11111111111` (mali müşavire sor); taksit kapalı (`enabledInstallments: [1]`); dükkân siparişi iyzico panelinden + iyzico e-postasından görür (ayrı bildirim yok). Sipariş notu kartlı ödemede iyzico'ya gitmiyor.
- **Yasal sayfalar:** `src/data/legal.js` → `/yasal` ve 5 metin (mesafeli satış, ön bilgilendirme, iade/cayma, KVKK, gizlilik/çerez). Altbilgide "Yasal" sütunu. `SELLER` içindeki `[TEYİT: …]` alanları (unvan, vergi no, e-posta, MERSİS, kargoya verme süresi) doldurulmalı; avukat/mali müşavir kontrolü şart. Kartlı ödemede onay kutusu ön bilgilendirme + sözleşmeye bağlanır.
- **Canlıya geçmeden:** gerçek fiyatlar, alan adı, iyzico canlı başvurusu onayı, ETBİS kaydı, e-arşiv fatura düzeni.

## Yönetici paneli + WhatsApp bildirimleri (2026-11-24) — KOD HAZIR, HESAPLAR KURULMADI
- **Kurulum rehberi:** `KURULUM-YONETIM.md` (Supabase, Meta WhatsApp şablonları, Netlify env, ilk kullanım).
- **Veri:** Supabase. Şema `supabase/schema.sql` (RLS: ziyaretçi yalnızca aktif ürün okur; sipariş/maliyet/ayar yalnızca `admins`). Mevcut ürünler `supabase/seed.sql` (üret: `node scripts/make-seed.mjs`).
- **Ürünler:** liste artık `src/data/products.js`; `catalog.js` buradan alır. Build ilk adımı `scripts/sync-products.mjs` VITE_SUPABASE_* varsa veritabanından bu dosyayı yeniden yazar (okuyamazsa build durur — eski fiyatla yayına çıkmamak için). Panel "Siteye yayınla" → `NETLIFY_BUILD_HOOK`. Ödeme ekranı fiyatı canlı veritabanından alır (`server/catalog-live.js`); tarayıcıdaki toplam farklıysa 409 `price_changed`.
- **Siparişler:** kart → `odeme_bekliyor` kaydı, iyzico sonucu `odendi` + komisyon (`iyziCommissionRateAmount + iyziCommissionFee`) + payout. WhatsApp → sepet `/api/siparis`'e arkadan yollar (`beklemede`, sipariş no mesaja eklenir; honeypot + IP başına 10 dk'da 3).
- **Bildirim:** `server/whatsapp.js`, Meta Cloud API şablonları `siparis_bildirimi` (6 değişken) ve `haftalik_rapor` (7). Numaralar panel Ayarlar'dan (`settings.notify_numbers`) + `WHATSAPP_NOTIFY`. Haftalık: `netlify/functions/haftalik-rapor.mjs` (pzt 06:00 UTC); Vercel için `api/haftalik-rapor.js` + `vercel.json` crons.
- **Panel:** `/yonetim` (lazy chunk, ana pakette Supabase yok), `src/admin/` (Admin.jsx, api.js, report.js — rapor hesabı sunucuyla ortak).
- **Test durumu:** rapor hesabı, haftalık tarih aralığı, WhatsApp istek gövdesi (sahte fetch ile), fiyat değişikliği koruması, panel "kurulmadı" ekranı, build/lint denendi. **Gerçek Supabase ve Meta hesabıyla HENÜZ denenmedi** (giriş, RLS, sipariş kaydı, mesaj teslimi).
- **Eklenenler (aynı gün, 2. tur):**
  - Ürün fotoğrafı yükleme: Supabase Storage `urunler` kovası; tarayıcıda 1600 px WebP'ye küçültülür. `products.images` dizisi. Sitede `src/components/productPhotos.js` panel fotoğrafını hazır fotoğrafa tercih eder; prerender og:image / JSON-LD / feed'ler de kullanır.
  - Panelde EN/AR ad ve açıklama alanları (boşsa site Türkçeye düşer).
  - Deneme modu: yalnızca `npm run dev`'de `/yonetim?demo` (`src/admin/demo.js`, `makeDemo()` sayesinde canlı pakete girmez — build'de "Demo Müşteri" 0 kez geçiyor, kontrol edildi).
  - `npm run kontrol` (`scripts/kontrol.mjs`): Supabase okuma/RLS/admin/depo, iyzico anahtar+imza, WhatsApp numara+şablon onayı (WHATSAPP_WABA_ID varsa), build hook. Yanlış iyzico anahtarıyla ✗ verdiği denendi.
  - Panelin dört sekmesi deneme modunda tarayıcıda denendi (masaüstü + 375 px, yatay taşma yok, konsol hatası yok).
- **Bilinen sınırlar:** ürün silme yok ("Sitede göster" kapatılır); boyut etiketlerinin EN/AR çevirisi panelde yok (mevcutlar korunur).
- **Geçici WhatsApp (2026-11-24):** Meta kurulana kadar `CALLMEBOT=905536635864:ANAHTAR` ile CallMeBot (server/whatsapp.js `whatsappMode()`; Meta anahtarı varsa Meta kazanır). Mesaj kısa: müşteri adı/telefon/adres gönderilmez. Sahte yanıtla denendi; gerçek anahtar bekleniyor. `.env.development.local`'a Supabase ve CALLMEBOT boş satırları eklendi.
- **Canlı Supabase (2026-11-24):** proje `azrwyjwzbfykcczcmhts`, kurulum.sql + izinler (yeni projelerde GRANT gerekiyor — schema.sql'e eklendi) çalıştı. `npm run kontrol` Supabase ✓. Uçtan uca: WhatsApp siparişi `beklemede`, kartlı sandbox ödeme `odendi` + komisyon 21,19 / payout 578,81 kaydı doğrulandı; iki test kaydı `iptal` + "SİSTEM TESTİ" notu. Sahip panele kendi hesabıyla girdi, siparişleri gördü. Kalan: CALLMEBOT anahtarı, gerçek fiyat/maliyet girişi, Netlify yayını.

## Hukuk + güvenlik turu (2026-11-24)
- **Raporlar (oturum notları klasörü):** `hukuk-raporu.md` (legal-advisor; 6 yüksek/11 orta/7 düşük), `guvenlik-raporu.md` (penetration-tester; kritik yok), `koruma-arastirmasi.md` (GitHub/Reddit/resmi doküman araştırması).
- **Güvenlik düzeltmeleri:** IP yalnızca platformdan (Netlify `context.ip` adaptörden, Vercel `x-real-ip`; IPv6 /64) — `server/catalog-live.js clientIp`; CSRF: sipariş/ödeme uçları yalnızca `application/json` + aynı Origin (`sameSiteJson`); ödeme başlatmaya IP başına 10 dk'da 5 sınır; WhatsApp bildirim tavanı (10 dk'da 15 sipariş üstü mesaj yok); ödeme dönüşü koşullu güncelleme (`updateOrderIf`, çift bildirim yok) + tutar/para birimi/fraudStatus/iyzico imza (`signatureOk`) kontrolü — uyuşmazsa "KONTROL EDİN" notu, `odendi` olmaz; callback yalnız POST; Vercel cron fail-closed; `public/_headers` + `vercel.json` güvenlik başlıkları (CSP, HSTS, frame-ancestors none…) — yerelde CSP'li sunucuyla denendi, ana sayfa/panel/Supabase engellenmedi; `.gitignore`; Vite gizli anahtar kilidi (VITE_SUPABASE_ANON_KEY'e sb_secret/service_role yazılırsa build durur — denendi); yönetici iki adımlı doğrulama (TOTP, Ayarlar sekmesi; `is_admin()` faktör varsa aal2 ister; sunucu `requireAdmin` artık RPC is_admin'i kullanıcının yetkisiyle çağırır); sipariş no `crypto.getRandomValues`.
- **Hukuk düzeltmeleri:** onay kutusu her ödeme yönteminde zorunlu + siparişe özel ön bilgilendirme özeti (sepette, TR); WhatsApp mesajına onay satırı (sürüm); onay kanıtı `consent_at`/`legal_version` kaydı; sepet gizlilik cümlesi düzeltildi (+KVKK bağlantısı); Meta şablonu 4 değişken (ad/telefon yok); Arapça font kendi sunucumuzdan (@fontsource/ibm-plex-sans-arabic 5.2.9, Google'a IP gitmiyor; CSP'den Google çıktı); altbilgide satıcı künyesi (doldurulan alanlar); prerender `SELLER` TEYİT uyarısı; KVKK metnine hizmet sağlayıcı/yurt dışı bölümü ve tamamlanmayan sipariş saklama süresi (TEYİT); ürün sayfalarına alerjen satırı (tahin, fıstık, polen, kutular).
- **Canlı doğrulama:** guncelleme-guvenlik.sql çalıştırıldı (kontrol ✓). Uçlar: JSON+aynı origin 201, text/plain 415, yabancı Origin 403 (dev middleware origin iletmiyordu, düzeltildi), onaysız 400; kayıtlarda consent_at + legal_version var; test kayıtları iptal edildi.
- **Bekleyen (sahip):** SELLER bilgileri, ETBİS, gıda işletme kaydı; Supabase'de kayıt kapalı + Redirect URL'ler; hesaplarda 2FA; yurt dışı aktarım için avukat; CallMeBot şu an yeni anahtar vermiyor olabilir (araştırma) → Meta/Telegram/e-posta; sözleşmenin müşteriye e-postayla gönderimi için e-posta servisi; Turnstile + Netlify rateLimit (yayında).

## Araç kurulumu (2026-11-24)
- Kullanıcı düzeyinde kuruldu: firecrawl, posthog, playwright, hyperframes (claude-plugins-official), watch@claude-video, composio@composio, gstack (~/.claude/skills/gstack, `gstack-` önekli 61 skill, tarayıcısız kurulum). Zaten kuruluydu: superpowers, andrej-karpathy-skills.
- Kurulmayanlar: Perplexity (API anahtarı gerekiyor: `claude mcp add perplexity -s user -e PERPLEXITY_API_KEY=... -- npx -y @perplexity-ai/mcp-server`), Paperclip (Claude eklentisi değil; ayrı sunucu uygulaması), rea (morluto/rea tersine mühendislik aracı; amaç belirsiz, güvenilirlik doğrulanmadı).
- Proje kökünde `CLAUDE.md` oluşturuldu: Karpathy ilkeleri + değişmez proje kuralları + araç rehberi.

## Görsel turlar — Codex astra (2026-11-24)
- Tur 1–2 (taste-skill): yön "split-stage / 32A kapısı"; Instrument Serif dik başlık + Inter gövde; bakır patinası yeşili #163e38 + bal amberi; bento/eyebrow/hairline/gradyan/sayaç kaldırıldı; inspect 0 FAIL / 3 WARN. Rapor: `codex-tasarim-raporu.md`, görüntüler `.taste-skill/`.
- Task B (sinematik): filmde amber geçiş + 32A kapı yakınlaşması, kelime kelime başlık açılışı (AR kelime bütün), View Transitions ile sayfa geçişi (router.js navigate), ana paket +1,7 kB.
- Task A (bal dökümü): `HoneyPour.jsx` + `honeyPourScene.js` (tembel three.js, 96 fps masaüstü, telefonda/reduced-motion/Save-Data/WebGL yoksa SVG durağan). Task A2 (renk/kavanoz/kalın akış) YARIDA: yalnızca Karakovan'da yan yana düzen (`.kk__pour`, "Petekten kavanoza" + sipariş düğmesi) yapıldı; Codex kullanım sınırı (20:44'e kadar). Brief: scratchpad `codex-honeypour-2-en.md`. Yedekler: scratchpad `backup-pre-codex-tasarim`, `backup-tur2`, `backup-tur3`.

## Altyapı (Aşama 1) — 2026-11-24
- Git + özel GitHub deposu (dal `main`). Gizli anahtar kalkanı: `.gitignore` + `scripts/secret-scan.mjs` (`.githooks` pre-commit/pre-push; yeni klonda `git config core.hooksPath .githooks`) + CI'da gitleaks.
- Vitest (`npm test`), `npm run check` (lint + test + tarama), `.github/workflows/ci.yml`, Dependabot.
- Eksik kalan: uçtan uca tarayıcı testleri (Playwright) ve Supabase CLI ile migration yönetimi (şimdilik `supabase/migrations/*.sql` elle çalıştırılıyor).

## Yarıda kalan kartlı ödemeler (Aşama 2.1) — 2026-11-25
- `settleByToken()` (server/payment.js): sonucu token ile iyzico'ya sunucudan sorar; tarayıcı dönüşü, webhook ve eşleştirme aynı fonksiyonu kullanır.
- Başlatmada iyzico token'ı `orders.provider_token`'a yazılır → migration `supabase/migrations/20261124_01_odeme_eslestirme.sql` ÇALIŞTIRILMALI (çalıştırılmazsa ödeme yine çalışır, yalnızca eşleştirme token bulamaz).
- `server/reconcile.js`: `reconcilePayments()` her 15 dk (netlify/functions/odeme-eslestir.mjs) 10 dk–48 sa arası bekleyenleri sorar; 1 saati geçen ödenmemişler "başarısız". `handleIyzicoWebhook()` `/api/iyzico-bildirim` — bildirime güvenmez, token ile sorar; V3 imza uyuşmazlığı yalnızca kayda geçer (TEYİT: iyzico imza biçimi).
- iyzico panelinde bildirim (webhook) adresi canlı alan adıyla girilmeli: `https://ALAN-ADI/api/iyzico-bildirim`.
- Testler: `tests/reconcile.test.js` (sahte Supabase + iyzico; 44 test geçiyor).

## Onay e-postası ve stok (Aşama 2.2–2.3) — 2026-11-25
- `server/mailer.js`: kartla ödenen siparişte Brevo ile onay e-postası (özet + ön bilgilendirme + mesafeli satış tam metni). Brevo hesabı ŞİMDİLİK ATLANDI; `BREVO_API_KEY` + `MAIL_FROM` girilince çalışır (`npm run kontrol` denetler). Panelde WhatsApp siparişleri için hazır onay mesajı düğmesi.
- Stok: migration `20261125_01_stok.sql` (çalıştırıldı). `inventory` tablosu + `orders_stock` tetikleyicisi (kayıtta düşer, iptal/başarısız/iadede geri ekler, yetmezse `stok_yetersiz` → sunucu 409 `stock`), ürün durumu adetten (≤ low_at "az kaldı", 0 "tükendi"; ön siparişe dokunmaz). Panelde boyut başına "Stok adedi" (boş = takip yok).
- Gerçek veritabanında denendi: stok 1 → 1. sipariş adet 0 / "tükendi", 2. sipariş `stok_yetersiz`, iptal → adet 1 / "az kaldı"; test stoğu silindi, ürün durumu geri alındı, test siparişi `iptal`.
- Not: stok durumu değişince site (statik) "Siteye yayınla" ile güncellenir; ödeme ekranı ise canlı veritabanına bakar, tükenmiş ürün satılamaz.
