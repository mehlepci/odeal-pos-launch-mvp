# 20-Dakika Sunum / Demo Script — ÖdeAl Akıllı POS Lansman MVP

**Format:** 20 dk gösterim + 10 dk Q&A
**Linkler hazır olsun:** LP (`/`), `/basvur`, `/iletisim`, `/dashboard` (şifre `odeal2026`), GitHub repo, DECISIONS.md
**Tek cümlelik açılış:** *"LP'den lead'in satış/onboarding'e aktarımına kadar olan akışı uçtan uca, çalışır halde prototipledim — göstereyim."*

---

## 0:00–2:00 · Çerçeve (slide/sözlü)
- Senaryo: yeni fiziki POS lansmanı, hedef 3 ayda 2.500 lead, **karma** kazanım modeli.
- Çözdüğüm asıl problem: *"bazıları satışla konuşmak, bazıları self-serve başvurmak istiyor"* → bunu ilk tıklamadan ayrı iki akışa böldüm. Bu UI değil, **lead kalitesi** kararı.
- Teslim ettiğim 3 parça: (1) LP + tracking, (2) API + DB + scoring, (3) iç dashboard.

## 2:00–7:00 · Landing Page & İki Akış (canlı)
- LP'yi gez: hero, iki CTA — **"Hemen Başvur"** (self-serve) vs **"Sizi Arayalım"** (sales). Responsive olduğunu göster (pencereyi daralt).
- DevTools → Console aç: bir CTA'ya tıkla → `cta_click` event'inin `dataLayer`'a düştüğünü göster. *"Client tarafı GTM `dataLayer`'a yazıyor; canlı bir GTM container (`GTM-P7QJ6PFN`) bunları GA4'e iletiyor — GA4 Realtime'da görünüyor. Aynı container'dan Meta Pixel / Google Ads kod deploy etmeden eklenebilir. Server tarafı da — birazdan göstereceğim — gerçek GA4'e gidiyor."*
- **`/basvur`**: 3 adımlı form — her adımda `form_step_complete` event'i (akış başına drop-off ölçmek için). Son adımı doldur, **Başvur**.
- **`/iletisim`**: kısa form (düşük friction, amaç telefon yakalamak). Notes alanına *"POS'um bozuldu, acil ihtiyacım var"* yaz → **canlı AI** bu notu okuyup skora +20 bindirecek (dashboard'da göstereceğiz).

## 7:00–11:00 · API, DB & Scoring (kod + canlı)
- `app/api/leads/route.ts`: POST → validate → `scoreLead()` → Prisma ile DB'ye yaz → **server-side** `lead_created` GA4 event'i.
- `lib/scoring.ts`: kural tablosunu göster (self-serve +25, yüksek-değer sektör +25, telefon +15…). *"ML değil çünkü ilk gün 0 conversion verimiz var ve marcom ekibine HIGH/MEDIUM/LOW'u açıklayabilmem lazım."*
- **İki katman tracking** (DECISIONS D-006): client GTM = sayfa event'leri, server GA4 = conversion (ad-blocker'a dayanıklı).
- **⭐ CANLI GA4 ANI:** Yan ekranda **GA4 → Admin → DebugView** açık olsun. Az önce `/basvur`'dan gönderdiğin lead'in `lead_created` event'i, `flow_type` / `score` / `industry` parametreleriyle DebugView'da belirir. *"Bu mock değil — gerçek GA4 property'sine, server-side Measurement Protocol ile gidiyor. Form gönderildi, conversion Google'da."* (Property `G-QLMSTSMK49`.)
- DB: Prisma 7 + libSQL adapter, prod'da **Turso** (bulut SQLite). *"Lokalde `file:`, prod'da `libsql://` — tek satır."*

## 11:00–16:00 · Dashboard (canlı)
- `/dashboard` → şifre. *"sessionStorage gate — bilinçli MVP tradeoff'u; prod'da NextAuth + Google OAuth, bir öğleden sonra."*
- **5 metrik, her biri bir aksiyona bağlı:** Toplam Lead (2.500 pace), Self-serve vs Arayalım (kanal), Yüksek Kalite (skor≥70), Bu Hafta vs Geçen Hafta.
- Grafikler: günlük trend (30 gün), UTM kaynak dağılımı.
- Lead tablosu: akış + skor filtreleri. *"Az önce gönderdiğimiz lead burada, skoruyla."* (demo lead'i göster, refresh.)
- **⭐ CANLI AI ANI:** Az önce *"POS'um bozuldu acil"* notuyla gönderdiğin lead'in satırına tıkla → skor dökümü açılır. Kural puanlarının yanında **🤖 AI aciliyet sinyali +20** ve Gemini'nin tek cümlelik gerekçesi (*"POS bozuk, acil ihtiyaç…"*) görünür. *"Bu mock değil — her başvuruda Gemini notu okuyup skoru gerçekten değiştiriyor; ama puanı kod sabitliyor, yani kara kutu değil, açıklanabilir."*
- *"Neden bu 5 metrik?"* → DECISIONS D-008: volume + kalite + kanal + pace; vanity'yi yakalar.

## 16:00–19:00 · Trade-off'lar & Sonraki İterasyon
- En savunulabilir 3 trade-off: Turso vs Postgres, kural+AI hibrit scoring (saf ML değil), hybrid tracking.
- AI kullanımı: (1) bu MVP'yi Claude ile hızlı yazdım, (2) **üründe canlı**: `lib/ai-scoring.ts` her sales başvurusunda Gemini ile notu okuyup açıklanabilir +puan biniyor (az önce dashboard'da gösterdim). Puanlar kodda sabit → kara kutu değil.
- Sonraki adım (öncelik sırası): **CRM handoff** → lead status pipeline → Meta CAPI / Google Ads conversion import (GA4 server-side zaten canlı) → cost-per-lead → pace göstergesi.

## 19:00–20:00 · Kapanış
- *"4 günde mükemmellik değil, uçtan uca çalışan MVP hedefledim: gerçek bir lead şu an Turso'da, dashboard'da, skoruyla. Her kararın 'neden'i DECISIONS.md'de."*

---

## Q&A için hazır cevaplar (10 dk)
- **"Neden ayrı backend (FastAPI) değil?"** → Marcom MVP'sinde tek repo deploy hızı > mimari saflık; ölçeklenince API route'ları ayrı servise taşınabilir.
- **"Scoring'i nasıl doğrularsın?"** → 4-6 hafta sonra lead→activated POS conversion'ı kurallara karşı backtest; ağırlıkları gerçek veriyle kalibre et, sonra LLM boost.
- **"Veri kalıcı mı, yoksa demo mu kayboluyor?"** → Turso bulut; canlıda POST ettiğim lead refresh sonrası duruyor (gösterdim).
- **"Ad-blocker conversion'ı bozar mı?"** → Client-side bozulur; o yüzden `lead_created` server-side Measurement Protocol ile gidiyor.
- **"Auth neden bu kadar basit?"** → Bilinçli; 5 kişilik iç araç. Prod = NextAuth + @ödeal.com Google OAuth.
- **"KVKK / consent?"** → MVP'de kapsam dışı; prod'da form consent + GTM consent mode eklenir (dürüst sınır).
