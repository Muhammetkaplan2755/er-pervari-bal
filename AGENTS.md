# Er Pervari Bal — proje kuralları (Codex ve Codex için)

Önce `HANDOFF.md` oku: projenin tüm geçmişi, kararları ve açık işleri orada.
Sahibiyle Türkçe, sade dille konuş; kod ayrıntısını az tut.

## Çalışma ilkeleri (Karpathy kuralları — `karpathy-guidelines` skill'i kurulu)
1. **Önce düşün.** Varsayımını açıkça yaz; birden fazla yorum varsa sessizce seçme, söyle.
2. **Önce sadelik.** İstenmeyen özellik, tek kullanımlık soyutlama, gereksiz "esneklik" yok.
3. **Cerrahi değişiklik.** Yalnızca isteğe dokunan satırları değiştir; komşu kodu "iyileştirme", mevcut yorumları silme.
4. **Hedefe dayalı.** Her işin doğrulanabilir başarı ölçütü olsun (build, lint, tarayıcıda kontrol, ölçüm) ve doğrulanana kadar bitmiş sayma.

## Değişmez kurallar
- **Uydurma yok:** fiyat, hasat tarihi, yorum, ödül, rakam, sağlık/şifa/"organik"/"%100 doğal" iddiası ekleme. Doğrulanmamış içerik `(TEYİT)` ile işaretlenir.
- **Görseller:** Google'dan / stoktan fotoğraf alma, yapay zekâ ile ürün görseli üretme. Gerçek fotoğraf yoksa "Çizim" etiketli SVG (src/components/ProductArt.jsx).
- **WhatsApp mesajları** dükkâna her zaman Türkçe gider.
- **Gizli anahtarlar** yalnızca `.env*.local` ve barındırma panelinde; asla `VITE_` önekli değişkende, asla sohbete/koda.
- **KVKK:** müşteri adı/telefon/adresi üçüncü taraf bildirim servislerine gönderilmez; yeni bir dış servis eklenirse `src/data/legal.js` aydınlatma metni güncellenir.
- **CSP** yalnızca `'self'` + Supabase + Google Maps iframe (`public/_headers`); harici CDN/script/font ekleme. Fontlar @fontsource ile yerel.
- **Yeni npm paketi:** en az 2 haftalık sürüm, `--save-exact`, açık lisans.
- Satış güvenliği: fiyat her zaman sunucuda hesaplanır (server/catalog-live.js); sipariş uçları JSON + aynı Origin ister; ödeme sonucu iyzico'dan sunucuda doğrulanır.

## Doğrulama
- `npm run build` (prerender 27 sayfa + 404) ve `npx oxlint src server scripts api netlify` temiz olmalı.
- Görsel değişiklikte: telefon 375 / tablet 768 / masaüstü 1440 + Arapça (RTL) + hareket azaltma; yatay taşma olmamalı.
- Kurulum/anahtar kontrolü: `npm run kontrol`.
- Yönetici paneli hesapsız deneme: `npm run dev` → `/yonetim?demo`.

## Araçlar (kurulu) — ne zaman hangisi
- **taste-skill** (`~/.Codex/skills/taste-skill`): sayfa tasarımı, "yapay zekâ işi" görünümü giderme, tarayıcıda ölçüm (`inspect.mjs`, `lint.mjs`). Yönetici paneli "app screen" kurallarıyla denetlenir.
- **impeccable**, **frontend-design**, **audit-suite**: tasarım cilası ve denetim.
- **Playwright / Chrome DevTools MCP**: ekran görüntüsü, FPS, Lighthouse, form ve ödeme testleri.
- **superpowers**: arka uç işlerinde planlı ve testli geliştirme.
- **Firecrawl**: referans sitelerin tekniklerini incelemek (içerik/kod KOPYALANMAZ, yalnızca teknik).
- **PostHog**: site yayına çıkınca ziyaretçi analizi ve oturum kaydı (önce çerez onayı + KVKK metni).
- **hyperframes**: HTML'den marka videosu (Instagram Reels) üretimi.
- **watch (Codex-video)**: referans videoları kare kare incelemek.
- **Codex** (`/codex:*`, görsel işler için `gpt-6.2-astra`, effort high): büyük işleri dosya sahipliği ayrılmış görevlerle devretmek; her diff incelenir.
- **OWASP Security Audit / Security Audit Loop / Legal / supabase** eklentileri: güvenlik ve hukuk turları.
