# 20-Dakika Sunum / Demo Script — ÖdeAl Akıllı POS Lansman MVP

**Format:** 20 dk gösterim + 10 dk Q&A
**Linkler hazır olsun:** LP (`/`), `/basvur`, `/iletisim`, `/dashboard` (şifre `odeal2026`), GitHub repo, DECISIONS.md, yan ekranda GA4 (Realtime + DebugView)

**Açılış cümlesi (sesli):**
> "Merhaba. Ben bu case için, bir kullanıcının landing page'e gelmesinden, lead'e dönüşüp satış ya da onboarding'e aktarılmasına kadar olan tüm akışı uçtan uca, gerçekten çalışan bir ürün olarak kurdum. Slayt yerine doğrudan canlı ürün üzerinden göstereceğim."

---

## 0:00–2:00 · Çerçeve

*(Sözlü ya da tek slayt)*

> "Senaryo şu: yeni bir fiziki POS cihazı lanse ediyoruz ve 3 ayda 2.500 lead toplamak istiyoruz. Buradaki asıl mesele şu: gelen işletmelerin hepsi aynı değil. Bir kısmı bir satış temsilcisiyle konuşmak istiyor, bir kısmı kimseyle uğraşmadan kendi başına online başvurmak istiyor. Ben de bu iki niyeti daha ilk tıklamadan birbirinden ayırdım. Bu bir tasarım tercihi değil, bir lead kalitesi kararı — çünkü kullanıcının hangi yolu seçtiği, o lead'in ne kadar sıcak olduğunu söylüyor."

> "Teslim ettiğim üç parça var: landing page ve tracking, API artı veritabanı artı lead skorlama, ve son olarak ekibin içinde kullanacağı bir dashboard. Hepsi canlı, hepsini göstereceğim."

---

## 2:00–7:00 · Landing Page & İki Akış (canlı)

**Yap:** LP'yi gez — hero, iki CTA: **"Hemen Başvur"** (self-serve) ve **"Sizi Arayalım"** (sales). Pencereyi daralt, responsive olduğunu göster. Yan ekranda **GA4 → Reports → Realtime** açık olsun.

> "İşte landing page. Dikkat ederseniz iki ayrı çağrı var: 'Hemen Başvur' kendi başına başvurmak isteyen için, 'Sizi Arayalım' ise satışla konuşmak isteyen için. Kullanıcı daha buradan hangi tarafta olduğunu bize söylüyor."

**Yap:** Bir CTA'ya tıkla → Realtime'da `cta_click` belirsin.

> "Şimdi bir butona tıklıyorum… ve görüyorsunuz, tıklama birkaç saniye içinde Google Analytics'in Realtime ekranına düştü. Yani tracking gerçekten çalışıyor. Bunu canlı bir Google Tag Manager container'ı üzerinden yapıyorum; ileride Meta Pixel ya da Google Ads eklemek istersek tek satır kod yazmadan, buradan ekleyebiliriz. Birazdan bir de server tarafındaki tracking'i göstereceğim."

> *(İpucu: Realtime 5-30 sn gecikebilir. Sahneye çıkmadan önce bir kere tıklayıp ısıt, sahnede ikinciyi göster.)*

**Yap:** `/basvur` — 3 adımlı formu doldur, **Başvur**.

> "Self-serve tarafı 3 adımlı bir form. Her adımı tamamladığınızda ayrı bir event gönderiyorum, böylece hangi adımda insanların kaçtığını ölçebiliyorum — yani formu nerede iyileştirmem gerektiğini veriyle görüyorum."

**Yap:** `/iletisim` — kısa formu doldur. **Notes alanına yaz: "POS'um bozuldu, acil ihtiyacım var."**

> "Bu da satış tarafı. Bilinçli olarak çok kısa tuttum, tek amacı telefon numarasını yakalamak. Ama şuraya, not alanına özellikle 'POS'um bozuldu, acil ihtiyacım var' yazıyorum — çünkü birazdan bu notu yapay zekânın okuyup skoru nasıl değiştirdiğini göstereceğim."

---

## 7:00–11:00 · API, DB & Scoring (kod + canlı)

**Yap:** `app/api/leads/route.ts`'i aç.

> "Form gönderilince arka tarafta şu oluyor: gelen veri doğrulanıyor, lead skorlanıyor, Prisma ile veritabanına yazılıyor ve hemen ardından Google'a server tarafından bir conversion event'i gidiyor. Hepsi tek bir endpoint'te."

**Yap:** `lib/scoring.ts`'i aç, kural tablosunu göster.

> "Skorlama kural bazlı. Self-serve başvurana 25 puan, restoran-market gibi yüksek işlem hacmi olan sektöre 25 puan, telefon bırakana 15 puan, ve böyle devam ediyor. Neden makine öğrenmesi değil de kurallar? Çünkü ilk gün elimizde sıfır conversion verisi var, bir model öğrenecek bir şey bulamaz. Ve daha önemlisi: pazarlama ekibine bir lead'in neden yüksek skor aldığını açıklayabilmem lazım — kurallar bunu açık açık söylüyor, kara kutu değil."

**Yap:** Yan ekranda **GA4 → Admin → DebugView** açık. Az önceki başvurunun event'ini göster.

> "Şimdi en sevdiğim ana geldik. Az önce gönderdiğim başvurunun conversion event'i, şu anda Google Analytics'in DebugView ekranında duruyor — flow type'ı, skoru, sektörü parametreleriyle birlikte. Bu bir simülasyon değil; gerçek bir GA4 hesabına, server tarafından gidiyor. Neden server tarafı? Çünkü reklam engelleyiciler client tarafındaki conversion'ları düşürür, ama server tarafındakini düşüremez — yani conversion verisi yüzde yirmi-otuz daha eksiksiz oluyor."

**Yap:** Veritabanından bahset.

> "Veritabanı tarafında Prisma ve Turso kullandım — Turso bulutta çalışan bir SQLite. Lokalde tek bir dosya, prodüksiyonda bulut; aradaki fark tek satır bağlantı adresi. Bu sayede demoyu sıfır kurulumla çalıştırabiliyorum ama prodüksiyon için de gerçek, kalıcı bir veritabanım var."

---

## 11:00–16:00 · Dashboard (canlı)

**Yap:** `/dashboard` → şifre gir.

> "Bu da ekibin içeride kullanacağı dashboard. Şifreyle koruyorum ama açık söyleyeyim: bu basit bir oturum kontrolü, bilinçli bir MVP tercihi. Prodüksiyonda buraya Google OAuth ile gerçek giriş eklerdim, bu yarım günlük bir iş — ama 4 günlük bir demoda zamanın yüzde yirmisini auth'a harcamaya değmezdi."

**Yap:** 5 metriği göster.

> "Burada beş metrik var ve her biri bir aksiyona bağlı. Toplam lead — 2.500 hedefine göre neredeyiz. Self-serve mi yoksa 'arayın' mı baskın — hangi kanal çalışıyor, reklamı ona göre yönlendiririm. Yüksek kaliteli lead oranı — çünkü kaliteden bağımsız sadece sayı saymak bizi yanıltır. Ve bu hafta geçen haftaya göre nasıl gidiyoruz."

**Yap:** Grafikleri ve lead tablosunu göster, filtreleri kullan.

> "Aşağıda 30 günlük trend ve hangi kaynaktan kaç lead geldiği var. Lead tablosunu da akışa ve skora göre filtreleyebiliyorum. Bakın, az önce gönderdiğimiz lead burada, skoruyla birlikte duruyor."

**Yap:** O lead'in satırına tıkla → skor dökümü açılsın, 🤖 AI satırını göster.

> "Şimdi o lead'in satırına tıklıyorum ve skorun neden o kadar olduğunu açıyorum. Kural puanlarını görüyorsunuz — ama buradaki şu satır farklı: yapay zeka aciliyet sinyali, artı 20 puan. Çünkü kullanıcı not alanına 'POS'um bozuldu, acil lazım' yazmıştı. Her başvuruda bu notu bir yapay zeka modeli okuyup aciliyetini sınıflandırıyor ve şu kısa gerekçeyi de kendisi yazıyor. Ama önemli olan şu: puanı modelin kendisi belirlemiyor, puanları ben kodda sabitledim — model sadece 'bu acil mi değil mi' diye sınıflandırıyor. Yani skor hem yapay zekâdan besleniyor hem de açıklanabilir kalıyor, kara kutuya dönüşmüyor."

> *(İstersen burada D-008'e değin: "Bu beş metriği şundan seçtim — hacim, kalite, kanal ve hız; vanity metrikleri eler.")*

---

## 16:00–19:00 · Trade-off'lar & Sonraki İterasyon

> "Birkaç bilinçli tercihimi açayım. Postgres yerine Turso seçtim çünkü demo hızını ve sıfır kurulumu önemsedim, ama tek satırla Postgres'e geçebilirim. Skorlamada saf makine öğrenmesi yerine kural artı yapay zeka hibriti kurdum — kurallar ilk günden açıklanabilir çalışsın, yapay zeka da kuralların yapamadığı tek şeyi yapsın, yani serbest metni okusun. Tracking'i de iki katmanlı yaptım: client tarafı sayfa hareketleri için, server tarafı conversion için."

> "Yapay zekâyı iki yerde kullandım. Bir: bu MVP'yi geliştirirken bir yapay zeka asistanıyla çok daha hızlı yazdım, ama mimari kararlar ve trade-off'lar bana ait, hepsini DECISIONS dosyasında gerekçelendirdim. İki: az önce gösterdiğim gibi ürünün kendi içinde canlı çalışıyor — her satış başvurusunda notu okuyup skora açıklanabilir bir puan ekliyor."

> "Bundan sonraki adımları da önceliklendirdim: önce CRM'e otomatik aktarım, böylece satış ekibi dashboard'a bakmak zorunda kalmaz; sonra lead'lere bir durum akışı; sonra Meta ve Google Ads tarafına conversion'ları geri besleme — GA4 server tarafı zaten hazır; ardından kaynak başına maliyet ve hedefe kalan hız göstergesi."

---

## 19:00–20:00 · Kapanış

> "Özetle: 4 günde mükemmel bir ürün değil, ama uçtan uca gerçekten çalışan bir MVP hedefledim. Az önce gönderdiğim lead şu anda bulut veritabanında, dashboard'da, skoruyla birlikte duruyor; conversion'ı Google'a düştü; notunu yapay zeka okudu. Attığım her kararın 'neden'ini de DECISIONS dosyasında yazdım. Sorularınızı almaktan mutluluk duyarım."

---

## Q&A için hazır cevaplar (10 dk)

**"Neden ayrı bir backend, mesela FastAPI, kullanmadın?"**
> "Bir pazarlama MVP'sinde tek repoda deploy hızı, mimari saflıktan daha değerliydi. Trafik büyüyünce bu API route'larını rahatlıkla ayrı bir servise taşıyabilirim — şu an erken optimizasyon olurdu."

**"Skorlamanın doğru olduğunu nasıl anlarsın?"**
> "Dört-altı hafta sonra elimde gerçek veri olunca, hangi lead'lerin gerçekten aktif POS'a dönüştüğüne bakıp kurallarımı buna karşı test ederim. Ağırlıkları gerçek veriyle kalibre ederim, sonra da yapay zeka katmanını güçlendiririm."

**"Veri kalıcı mı, yoksa demo bitince kayboluyor mu?"**
> "Kalıcı. Turso bulutta; az önce canlıda gönderdiğim lead, sayfayı yenilesem bile orada duruyor — zaten gösterdim."

**"Reklam engelleyiciler conversion'ı bozmaz mı?"**
> "Client tarafını bozar, evet. Tam da bu yüzden conversion event'ini server tarafından, Measurement Protocol ile gönderiyorum — onu engelleyemiyorlar."

**"Auth neden bu kadar basit?"**
> "Bilinçli bir tercih. Bu sadece 5 kişilik bir iç araç. Prodüksiyonda buraya NextAuth ile @ödeal.com Google girişi koyardım; demoya değer katmayacağı için şimdilik basit tuttum."

**"KVKK / kullanıcı onayı?"**
> "MVP kapsamı dışında bıraktım, dürüst olmak gerekirse. Prodüksiyonda forma açık rıza onayı ve GTM consent mode eklenir — bu net bir sınır."

**"Neden Claude değil de Gemini kullandın?"**
> "Tamamen erişim meselesi — build sırasında elimde Claude API anahtarı yoktu, Gemini'nin ücretsiz katmanı vardı. Entegrasyon sağlayıcıdan bağımsız; tek bir dosyayı değiştirip Claude'a ya da başka bir modele geçebilirim."
