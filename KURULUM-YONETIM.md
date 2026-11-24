# Yönetici paneli kurulumu — Er Pervari Bal

Panel adresi: `https://ALAN-ADI/yonetim` (arama motorlarına kapalı).

Panelde neler var:
- **Siparişler:** kartla ödenen ve WhatsApp'tan gelen siparişler. Durum değiştirme (onaylandı, kargoda, iptal…), kargo takip numarası, ek gider ve not.
- **Rapor:** seçilen ayda hangi üründen kaç adet satıldığı, ciro, iyzico kesintisi, ürün maliyeti, ek giderler ve net kazanç.
- **Ürünler:** ürün ekleme, fiyat, stok durumu, boyutlar, birim maliyet, siteden gizleme.
  - **Fotoğraf yükleme:** telefondan çekilen fotoğraf otomatik küçültülür, ilk fotoğraf kapak olur.
  - **İngilizce / Arapça** ad ve açıklama.
  - Ardından "Siteye yayınla" düğmesi.
- **Ayarlar:** WhatsApp bildirimi gidecek numaralar (istediğiniz kadar), haftalık özetin açılıp kapatılması, deneme bildirimi.

Otomatik mesajlar:
- Her yeni siparişte listedeki **tüm numaralara** WhatsApp mesajı gider. Kartlı siparişlerde mesaj ödeme onaylanınca gider; WhatsApp siparişlerinde müşteri sipariş verdiği anda gider.
- **Her pazartesi 09:00'da** geçen haftanın özeti gider: sipariş sayısı, ciro, kesinti, maliyet, net kazanç ve en çok satanlar.

Üç hesap gerekiyor: **Supabase** (veritabanı ve giriş, ücretsiz paket yeter), **Meta WhatsApp Business Platform** (otomatik mesajlar) ve **Netlify** (site barındırma).

---

## 0. Hesap kurmadan paneli görmek

Geliştirme bilgisayarında `npm run dev` çalıştırıp `http://localhost:5173/yonetim?demo` adresini açın. Panel örnek verilerle açılır; herhangi bir e-posta ve şifreyle giriş yapılabilir. Hiçbir şey kaydedilmez, mesaj gönderilmez. Bu mod canlı sitede yoktur.

## 1. Supabase (veritabanı)

1. https://supabase.com adresinden hesap açın ve **New project** oluşturun. Bölge olarak Frankfurt (eu-central-1) seçin. Veritabanı şifresini güvenli bir yerde saklayın.
2. **SQL Editor** → `supabase/schema.sql` dosyasının tamamını yapıştırın → **Run**. Dosya ürün fotoğrafı deposunu ("urunler") da kurar. Tekrar çalıştırmak güvenlidir; dosya güncellenince yeniden çalıştırın.
3. Aynı yerde `supabase/seed.sql` dosyasını çalıştırın. Bu, mevcut 11 ürünü veritabanına aktarır.
4. **Authentication → Sign In / Providers**: **Allow new users to sign up** seçeneğini **kapatın**. Böylece dışarıdan kimse hesap açamaz.
5. **Authentication → Users → Add user**: yöneticinin e-postası ve şifresi. "Auto confirm" seçili olsun.
6. Bu kullanıcıyı yönetici yapın. SQL Editor'da çalıştırın, e-postayı kendi adresinizle değiştirin:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'yonetici@ornek.com';
   ```
   Birden fazla yönetici için 5. ve 6. adımı her kişi için tekrarlayın.
7. **Project Settings → API** sayfasından üç değeri alın:
   - Project URL
   - `anon` `public` anahtarı (herkese açık; tarayıcıda kullanılır)
   - `service_role` anahtarı (**GİZLİ**; yalnızca sunucuda kullanılır, hiçbir yere yapıştırmayın)
8. **Authentication → URL Configuration → Site URL**: sitenin adresini yazın. Şifre yenileme e-postası bu adrese döner.
9. **Yerelde denemek için** bu değerleri proje klasöründeki `.env.development.local` dosyasında hazır duran satırlara yazın:
   - `VITE_SUPABASE_URL` ve `SUPABASE_URL` satırlarına Project URL (ikisine de aynısı)
   - `VITE_SUPABASE_ANON_KEY` satırına anon public anahtarı
   - `SUPABASE_SERVICE_ROLE_KEY` satırına service_role anahtarı
   Canlıda aynı değerler Netlify ortam değişkenlerine girilir (bölüm 3).

## 2a. Geçici WhatsApp bildirimi — CallMeBot (Meta kurulana kadar)

Ücretsizdir ve kişisel kullanım içindir. Mesajı CallMeBot'un kendi WhatsApp numarası gönderir; dükkânın numarası bir otomasyona bağlanmaz.

1. Bildirim alacak telefonda (şimdilik 0553 663 58 64) https://www.callmebot.com/blog/free-api-whatsapp-messages/ sayfasını açın.
2. Sayfada yazan **güncel** CallMeBot numarasını rehbere kaydedin. Numara zaman zaman değişiyor; başka yerden almayın.
3. O numaraya WhatsApp'tan sayfada yazan izin cümlesini gönderin: `I allow callmebot to send me messages`
4. Birkaç dakika içinde bir **API anahtarı** gelir. 2 dakikada gelmezse 24 saat sonra tekrar deneyin.
5. Anahtarı `.env.development.local` dosyasındaki satırın sonuna yazın: `CALLMEBOT=905536635864:ANAHTAR`. Canlıda aynı satırı Netlify ortam değişkenine girin.
6. Başka numara eklemek için o telefonda da 1–4. adımları yapın ve virgülle ekleyin: `CALLMEBOT=905536635864:ANAHTAR1,905xxxxxxxxx:ANAHTAR2`

Gizlilik için bu geçici yolda mesaja müşterinin adı, telefonu ve adresi yazılmaz. Mesajda yalnızca sipariş no, ödeme şekli, ürünler, tutar ve il/ilçe bulunur; ayrıntılar panelde. Meta (aşağıda) kurulunca otomatik olarak o kullanılır ve numaralar panelden yönetilir.

## 2. Meta WhatsApp Business Platform (otomatik mesajlar)

WhatsApp'ta otomatik mesaj göndermenin resmi ve hesap kapatılma riski olmayan tek yolu budur. Gayriresmî araçlar WhatsApp kurallarına aykırıdır ve numarayı kapattırabilir; bu yüzden kullanılmadı.

1. https://business.facebook.com adresinden bir **Meta işletme portföyü** oluşturun.
2. https://developers.facebook.com → **My Apps → Create app**. Tür olarak "Business" seçin ve uygulamaya **WhatsApp** ürününü ekleyin.
3. **WhatsApp → API Setup**: gönderici numarayı ekleyin.
   - Bu numara, normal WhatsApp uygulamasında kullanılmayan **ayrı bir hat** olmalı.
   - Dükkânın mevcut WhatsApp Business numarasını kullanmak isterseniz Meta'nın "uygulama ile birlikte kullanım (coexistence)" seçeneğine bakın.
   - Bildirimleri alacak numaralar normal WhatsApp kullanmaya devam eder.
4. Aynı sayfadaki **Phone number ID** değerini not alın.
5. **Business Settings → Users → System users** bölümünde bir sistem kullanıcısı oluşturun.
   - Uygulamayı ve WhatsApp hesabını bu kullanıcıya atayın.
   - **Generate token** ile, süresi dolmayan (never) ve `whatsapp_business_messaging` + `whatsapp_business_management` izinli bir anahtar üretin. Bu anahtar **GİZLİ**dir.
6. **WhatsApp Manager → Message templates → Create template** ile iki şablon oluşturun.
   - Kategori: **Utility (Hizmet)**, dil: **Turkish**.
   - Adlar aşağıdakiyle birebir aynı olmalı. Değişkenlerin ({{1}}, {{2}}…) sırası önemli.

   **Ad:** `siparis_bildirimi`
   ```
   Yeni sipariş: {{1}}
   Bölge: {{2}}
   Ürünler: {{3}}
   Tutar: {{4}}
   Müşteri bilgileri yönetici panelinde.
   ```
   Örnek değerler (Meta onay için ister): `Kartla ödendi · EP12AB`, `Gaziantep / Şahinbey`, `2× Süzme bal 1 kg`, `₺1.850,00`
   Müşteri adı ve telefonu bilerek mesaja konmaz (KVKK: veri en aza indirme, yurt dışı aktarım).

   **Ad:** `haftalik_rapor`
   ```
   Er Pervari Bal haftalık özet ({{1}})
   Sipariş: {{2}}
   Ciro: {{3}}
   Banka / iyzico kesintisi: {{4}}
   Maliyet ve giderler: {{5}}
   Net kazanç: {{6}}
   En çok satanlar: {{7}}
   ```
   Örnek değerler: `16 Kasım – 22 Kasım`, `14`, `₺18.400,00`, `₺520,00`, `₺9.100,00`, `₺8.780,00`, `Süzme bal 1 kg (6)`

7. Şablonların onaylanmasını bekleyin. Genelde dakikalar ile birkaç saat arası sürer.
8. **Ücret:** Meta, işletmenin başlattığı her şablon mesajı için ülkeye göre küçük bir ücret alır. Güncel fiyat: https://developers.facebook.com/docs/whatsapp/pricing. Ödeme yöntemi WhatsApp Manager'dan eklenir.

## 3. Netlify (barındırma) ve ortam değişkenleri

1. Siteyi Netlify'a bağlayın. Build komutu `npm run build`, yayın klasörü `dist`.
2. **Site configuration → Build & deploy → Build hooks → Add build hook** ile bir adres oluşturun. Panelin "Siteye yayınla" düğmesi bu adresi kullanır. Adres **GİZLİ**dir.
3. **Site configuration → Environment variables** bölümüne aşağıdakileri girin. Gizli olanlar asla `VITE_` ile başlamaz.

| Değişken | Değer | Gizli mi |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | hayır |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public anahtarı | hayır |
| `SUPABASE_URL` | Supabase Project URL | hayır |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role anahtarı | **EVET** |
| `WHATSAPP_TOKEN` | Meta sistem kullanıcısı anahtarı | **EVET** |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Phone number ID | hayır |
| `NETLIFY_BUILD_HOOK` | Build hook adresi | **EVET** |
| `VITE_KART_ODEME` | `1` (kartla ödeme açık) | hayır |
| `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` | iyzico canlı anahtarları | **EVET** |
| `IYZICO_BASE_URL` | `https://api.iyzipay.com` (canlı) | hayır |

İsteğe bağlı değişkenler:
- `WHATSAPP_WABA_ID`: Meta WhatsApp Business hesap kimliği. Yalnızca `npm run kontrol` şablon onayını denetlesin diye.
- `WHATSAPP_NOTIFY`: panelden bağımsız yedek numara listesi, virgülle ayrılır.
- `WHATSAPP_API_VERSION`: varsayılan `v23.0`.
- `PUBLIC_ORIGIN`: sitenin tam adresi.

4. Değişkenleri girdikten sonra **Deploys → Trigger deploy** ile siteyi yeniden yayınlayın.
5. Haftalık rapor `netlify/functions/haftalik-rapor.mjs` dosyasında tanımlı. Netlify onu kendiliğinden her pazartesi çalıştırır; ek ayar gerekmez.

## 4. Kurulumu kontrol etmek

Anahtarları `.env.local` dosyasına da yazıp şunu çalıştırın:

```bash
npm run kontrol
```

Supabase, iyzico ve WhatsApp bağlantılarını tek tek dener ve eksikleri ✓ / ✗ ile listeler. Hiçbir şeyi değiştirmez, mesaj göndermez, anahtarları ekrana yazmaz.

## 5. İlk kullanım

1. `/yonetim` adresine gidip giriş yapın.
2. **Ayarlar**: bildirim alacak numaraları ekleyin → **Kaydet** → **Deneme bildirimi gönder**. Mesaj gelmezse şablon onayına ve anahtarlara bakın.
3. **Ürünler**: gerçek fiyatları, her boyutun **birim maliyetini** ve gerçek ürün fotoğraflarını girin → **Kaydet** → **Siteye yayınla**. Maliyet girilmezse rapordaki net kazanç olduğundan yüksek görünür. Fotoğrafı yüklenen ürün Google Alışveriş ve Meta katalog akışlarına da girer.
4. Siteden bir deneme siparişi verin. Siparişler sekmesinde görünmeli ve WhatsApp mesajı gelmeli.

## Siparişler nasıl sayılır

- **Kartla:** ödeme onaylanınca "Ödendi" olur. iyzico'nun kestiği tutar ödeme sonucundan otomatik kaydedilir.
- **WhatsApp:** önce "WhatsApp — onay bekliyor" olarak görünür. Müşteri mesajı ve ödemesi gelince durumu **Onaylandı** yapın; gelmezse **İptal**.
- Raporda yalnızca şu durumlar satış sayılır: Ödendi, Onaylandı, Kargoda, Teslim edildi.
- Kargo ücreti, kapıda ödeme bedeli gibi giderleri sipariş ayrıntısındaki **Ek gider** alanına yazın. Net kazançtan düşülür.
- **Net kazanç** = tahsil edilen − iyzico kesintisi − ek giderler − ürün maliyeti. Vergi bu hesaba dahil değildir; kesin hesap için mali müşavir.

## Güvenlik notları

- Panel girişini Supabase yönetir. Tarayıcı, veritabanı kuralları (RLS) gereği yalnızca yöneticilere sipariş ve maliyet gösterir.
- Gizli anahtarlar yalnızca Netlify ortam değişkenlerinde durur; kodda ve tarayıcıda yoktur.
- Müşteri telefon ve adresleri kişisel veridir (KVKK). Panel hesabını paylaşmayın; her yönetici kendi hesabıyla girsin.
