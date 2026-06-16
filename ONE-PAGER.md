# ÖdeAl Akıllı POS — Lansman MVP · 1 Sayfalık Özet

**Canlı:** https://odeal-pos-launch-mvp.vercel.app · **Dashboard:** /dashboard (şifre: `odeal2026`)
**Kod:** github.com/mehlepci/odeal-pos-launch-mvp · **Hedef:** 3 ayda 2.500 lead (~28/gün)

---

### Problem & Yaklaşım
Karma müşteri kazanım modeli: bazı KOBİ'ler satış ekibiyle konuşmak, bazıları doğrudan self-serve başvurmak istiyor. Çözüm, bu iki niyeti **ilk tıklamadan itibaren ayrı iki akışa** bölüyor — böylece her lead, satış ve scoring'in kullanabileceği bir `flowType` taşıyor. Akış: **LP → form (2 akış) → API + scoring → DB → dashboard**, uçtan uca çalışır halde.

### Mimari Kararlar (detay: DECISIONS.md)
- **Tek repo, Next.js 16 (App Router) + TypeScript** — LP, API route'ları ve dashboard tek deployda. Marcom MVP'sinde deploy hızı ve bakım kolaylığı, ayrı backend'in mimari saflığından önemli.
- **Prisma 7 + libSQL → Turso** — Prod'da Turso (bulut SQLite), lokalde `file:` SQLite. Tek satır URL değişikliğiyle geçiş; serverless'ta kalıcı veri.
- **İki ayrı flow** (`/basvur` self-serve, `/iletisim` sizi-arayalım) — tek formda "beni arayın" checkbox'ı yerine ayrı akışlar, çünkü niyet sinyalini ve scoring bilgisini korumak istiyoruz.
- **Kural bazlı lead scoring (0–100)** — ML değil. Açıklanabilir, ilk günden çalışır, geçmiş veri gerektirmez.

### Trade-off'lar (ne'yi neden seçmedim)
| Seçim | Alternatif | Neden bu |
|---|---|---|
| Turso/SQLite | Günde-1 hosted Postgres | Demo'da sıfır kurulum; prod'a tek satır geçiş |
| Kural bazlı scoring | ML model | 0 conversion verisiyle ML öğrenemez; kurallar açıklanabilir |
| GTM + server-side GA4 | Sadece client-side | Ad-blocker conversion event'lerini düşürür; server-side kaçırmaz |
| Tailwind (kütüphanesiz) | shadcn/ui | Her tasarım kararı açık ve savunulabilir, "sihir" yok |
| sessionStorage şifre | NextAuth/OAuth | 5 kişilik iç araç; 4 günün %20'sini auth'a harcamaya değmez |

### Ölçüm Yaklaşımı
**İki katmanlı tracking** — Client (GTM `dataLayer`): `page_view`, `cta_click`, `form_start`, `form_step_complete`, `form_submit` (akış başına drop-off ölçer). Server (GA4 Measurement Protocol): `lead_created`, DB yazımından sonra → ad-blocker'a dayanıklı conversion. **Dashboard'daki 5 metrik** her biri bir aksiyona bağlı: Toplam Lead (2.500 hedefine pace), Self-serve vs Sizi-Arayalım kırılımı (kanal performansı → reklam hedefleme), HIGH/MEDIUM/LOW kalite dağılımı (vanity volume'ı yakalar), UTM kaynak dağılımı (bütçe yönü), günlük trend (kampanya spike/ölü gün).

### AI/LLM Kullanımı
- **Bu MVP'yi geliştirirken:** Claude (Anthropic) ile kod üretimi, scoring kuralları ve copy taslakları hızlandırıldı; kararlar ve trade-off'lar tarafımca verildi ve DECISIONS.md'de gerekçelendirildi.
- **Üründe sonraki adım:** `lib/scoring.ts` içine async `aiScoreBoost(notes)` — sales formundaki serbest-metin `notes` alanını LLM ile analiz edip aciliyet sinyali (örn. "POS'um bozuldu, acil") için +puan. Entegrasyon noktası kodda hazır.

### Bir Sonraki İterasyon
1. **CRM handoff** — lead oluşunca HubSpot/Salesforce'a POST; satış dashboard'a bakmak zorunda kalmaz.
2. **Lead status workflow** — `NEW → CONTACTED → QUALIFIED → CONVERTED`; dashboard gerçek pipeline tracker'a döner.
3. **Gerçek GA4 + Meta CAPI** — anahtarlarla canlı, DebugView'da doğrulama.
4. **Source bazlı cost-per-lead** — ad platform API'leri ile HIGH lead gönderen kanala bütçe kaydırma.
5. **Pace göstergesi** — "bu hızla 2.500'e X günde ulaşırsın" — 3 aylık hedefi her gün görünür kılar.
