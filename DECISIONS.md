# Architecture Decisions — ÖdeAl Akıllı POS Launch MVP

> Every decision: What → Why → Trade-off considered → Presentation talking point

---

## D-001: Stack — Next.js 16 + TypeScript

**Decision:** Single Next.js 16 App Router project deployed on Vercel.

**Why:**
- Full-stack in one repo: landing page, API routes, and dashboard all live together. No separate backend to maintain or deploy.
- App Router gives us server components (faster pages, no client JS for static content) and API routes in the same codebase.
- Vercel is built by the same team as Next.js — deploy is `git push`, zero config.
- TypeScript catches type errors at build time, not at the client's browser.

**Trade-off considered:** Could have used separate FastAPI backend + React frontend. Rejected because it doubles the infra complexity and there's no benefit at MVP scale.

**Presentation note:** "I chose one tool that does everything well over two tools that each do one thing. For a marcom MVP, deploy speed and maintainability matter more than architectural purity."

---

## D-002: Database — SQLite + Prisma ORM

**Decision:** SQLite for dev/demo, Prisma as the ORM.

**Why SQLite:**
- Zero external services. The database is a single file (`dev.db`). No Postgres server to set up, no connection strings to manage, no cloud account needed to demo.
- Fast to seed with realistic mock data. Perfect for a 4-day MVP.

**Why Prisma:**
- Type-safe queries generated from the schema — the IDE tells you what fields exist.
- Migration system: `prisma migrate dev` creates versioned SQL files, so schema changes are tracked.
- One-line upgrade path: change `provider = "sqlite"` to `"postgresql"` and set a Neon/Supabase DATABASE_URL — all queries stay identical.

**Trade-off considered:** Could have used a hosted Postgres (Supabase, Neon) from day one. Chose SQLite because the demo environment doesn't need cloud persistence. For Vercel production deploy: add a free Neon database and update DATABASE_URL.

**Presentation note:** "SQLite for the demo means anyone can clone and run this without creating accounts. Production upgrade is a one-line change."

---

## D-003: UI — Tailwind CSS v4 (no component library)

**Decision:** Pure Tailwind CSS v4 utility classes. No shadcn/ui or other component library.

**Why:**
- Tailwind v4 is already in the Next.js scaffold. Adding another dependency for an MVP creates unnecessary complexity.
- Every style is visible inline — no "magic" from a library that interviewers need to mentally unpack.
- Forces clear, readable HTML structure that demonstrates product thinking (hero → stats → features → CTA is a deliberate narrative).

**Trade-off considered:** shadcn/ui would give polished components faster. Chose against it because the landing page needs custom visual design anyway, and the dashboard is simple enough that raw Tailwind is sufficient.

**Presentation note:** "I deliberately avoided component libraries so every design decision is explicit and explainable. There's nothing hidden."

---

## D-004: Two-Flow Model — "Sizi Arayalım" vs "Hemen Başvur"

**Decision:** Split the CTA into two distinct user journeys from the first interaction.

**Why (backed by ÖdeAl's real site):**
ÖdeAl's actual `sade-pos` and `pos-basvuru` pages already use these exact two CTAs. The hybrid model exists because:
- **"Sizi Arayalım" (Sales contact):** SMB owners who are risk-averse, want to ask questions, or are evaluating multiple POS providers. Shorter form = lower friction = more top-of-funnel capture.
- **"Hemen Başvur" (Self-serve):** Digitally-comfortable owners who've already decided. Longer form = more data = better lead quality = higher score.

Separating these flows from the first click means: (a) users self-qualify, (b) we can score them differently, (c) the marcom team can measure which channel converts better.

**Trade-off considered:** Single form with an optional "call me instead" checkbox. Rejected because it muddles the intent signal — we lose the routing information that makes scoring useful.

**Presentation note:** "The flow split is not a UI decision — it's a lead quality decision. Every lead in the system carries a flowType that tells the sales team how warm the prospect is."

---

## D-005: Lead Scoring — Rule-Based, Not ML

**Decision:** Score leads 0–100 using explicit business rules. No machine learning.

**Why:**
- **Explainability:** The marcom team can see exactly why a lead is HIGH/MEDIUM/LOW. "This lead scored 75 because they're a restaurant (high POS volume industry) who self-applied and provided a phone number." ML can't say that.
- **No training data:** We have zero historical conversion data on day one. ML models need labeled examples — rule-based works immediately.
- **Maintainable:** Any team member can add a new rule. ML requires a data scientist to retrain.

**Scoring rules:**
| Signal | Points | Business reason |
|---|---|---|
| Self-serve flow | +25 | Demonstrated intent without salesperson |
| High-value industry (restoran, market, kafe…) | +25 | High daily transaction volume = more POS value |
| Company size ≥ 10 employees | +20 | Larger operation = more POS revenue |
| Company size 5–9 employees | +10 | Mid-sized, still valuable |
| Phone provided | +15 | Willing to be called = warmer lead |
| Company name provided | +15 | Established business, not just curious |

**AI layer on top — live (not mocked):**
`lib/ai-scoring.ts` calls **Google Gemini** (`gemini-2.5-flash`) to read the free-text "notes" field from the sales-contact form and classify its purchase-intent/urgency. It returns a bounded, explainable boost — `none/low/high → +0/+10/+20` — that the API route adds on top of the rule score (`aiScore` + `aiReason` persisted per lead, shown in the dashboard breakdown). Example: "POS cihazım bozuldu, acil ihtiyacım var" → `high`, +20, reason "POS bozuk, acil ihtiyaç". The LLM only *classifies*; the points per class are fixed in code, so the score stays auditable. Degrades gracefully to +0 when there's no note or no API key.

**Why a hybrid (rules + AI), not pure ML:** the structured rules work from day one with zero historical data and are fully explainable to the marcom team; the LLM adds the one thing rules can't do — read prose — without making the whole score a black box.

**Presentation note:** "The score is rule-based and explainable, but I layered a live LLM on top to read the free-text note — submit 'POS'um bozuldu acil' and watch the score jump +20 with the AI's reason shown in the breakdown."

---

## D-006: Tracking — GTM (client-side) + GA4 Measurement Protocol (server-side)

**Decision:** Two-layer tracking architecture.

**Layer 1 — Client-side via GTM dataLayer:**
- Events: `page_view`, `cta_click`, `form_start`, `form_step_complete`, `form_submit`
- Implementation: `window.dataLayer.push({event, ...params})` — a simple function in `lib/gtm.ts`
- Why GTM instead of direct GA4: Lets the marcom team add/change tags without a developer deploy. Google Ads, Meta Pixel, and other tools can all be added through GTM without touching code.
- **Live, not mocked:** a real published GTM container (`GTM-P7QJ6PFN`) loads in production and routes the `dataLayer` events into GA4 (a Google Tag for `page_view` + a single GA4 Event tag forwarding the custom events via a regex Custom Event trigger). Visible in GA4 Realtime, or DebugView under GTM Preview.

**Layer 2 — Server-side via GA4 Measurement Protocol:**
- Event: `lead_created` sent from the API route after a lead is saved to the database
- Why server-side: Ad blockers block client-side GA4. The Measurement Protocol sends directly to Google's servers — conversion data is 20–30% more complete than client-side only.
- **Live, not mocked:** the production app sends real `lead_created` events to a live GA4 property (`G-QLMSTSMK49`), verifiable in GA4 DebugView. `engagement_time_msec` makes them count in Realtime/standard reports; an env-gated `GA4_DEBUG_MODE` surfaces them in DebugView for demos without polluting production reporting. If the env vars are unset (e.g. a fork without keys), it gracefully falls back to console logging so the flow still runs.

**Trade-off considered:** Server-side only (CAPI) vs. client-side only vs. hybrid. Hybrid is the industry best practice because client-side gives real-time page metrics while server-side captures reliable conversion events.

**Presentation note:** "This two-layer setup is what a proper marcom stack looks like. Client-side for page-level events, server-side for conversion events that must not be lost to ad blockers — and it's live: submit a form and watch the event land in GA4 DebugView."

---

## D-007: Dashboard Auth — Session-Based Password Gate

**Decision:** Simple client-side password check stored in `sessionStorage`. Password: `odeal2026`.

**Why (for MVP):**
- The dashboard is internal only. Building real auth (JWT, OAuth, NextAuth) adds 2–4 hours of work and 3 dependencies to an MVP that only 5 people will see.
- `sessionStorage` means the session clears when the tab closes — no stale sessions.
- The DECISIONS.md documents this as a known MVP compromise.

**Production upgrade:** Replace with NextAuth.js + Google OAuth (marcom team logs in with their @ödeal.com Google account). One afternoon of work.

**Presentation note:** "Auth is hardcoded. In production, I'd add Google OAuth through NextAuth — but adding auth complexity would have taken 20% of the 4-day time budget without adding any value to the demo."

---

## D-008: Dashboard Metrics Selection

**Why these 5 metrics:**

| Metric | Why it matters |
|---|---|
| Total Leads (with weekly trend) | Primary KPI — are we on track for 2500/90 days (≈28/day)? |
| Self-Serve vs Sales Contact split | Tells you which channel is working — adjust ad targeting accordingly |
| High / Medium / Low quality distribution | Volume without quality is vanity. This catches low-quality lead spikes |
| Top traffic sources (UTM) | Informs ad spend — double down on channels that send HIGH leads |
| Daily volume chart (30 days) | Spots campaign spikes, dead days, and weekend patterns |

**What I'd add in next iteration:** Conversion rate (lead → activated POS), cost per lead by source (needs ad platform API), and a 90-day pace indicator against the 2500 target.

---

## D-009: Language — Turkish LP, English Dashboard

**Decision:** Landing page in Turkish; dashboard in English.

**Why:**
- Landing page audience: Turkish SMB owners. Turkish copy reduces cognitive friction and matches ÖdeAl's real site tone.
- Dashboard audience: ÖdeAl's marcom team, who likely use English-language tools (Google Analytics, Meta Business Manager) and expect English in internal UIs.

---

## D-010: AI/LLM Usage — Where and How

The brief explicitly asks to call out where AI was used. Two distinct places:

**1. AI used to *build* this MVP.** I used Claude (Anthropic) as a pair-programmer: scaffolding components, drafting Turkish landing-page copy, and sanity-checking the scoring rules. The architecture decisions, trade-offs, and the rule weights themselves were mine — the AI accelerated execution, this doc records the reasoning.

**2. AI *in the product* — live.** `lib/ai-scoring.ts` calls Google Gemini (`gemini-2.5-flash`) on every sales-contact submission: it classifies the free-text `notes` for purchase-intent/urgency and adds a bounded, explainable boost (`none/low/high → +0/+10/+20`) on top of the rule score. The result (`aiScore` + the model's one-line `aiReason`) is persisted and shown in the dashboard's score breakdown. The LLM only classifies; points per class are fixed in code, so the score stays auditable and never becomes a black box. Falls back to +0 when there's no note or no API key. (Gemini rather than Claude only because no Claude API key was available during the build — the integration is provider-agnostic.)

---

## What I'd do in the next iteration

1. **Meta CAPI + Google Ads conversion import** — GA4 server-side is already live (DebugView-verified); next is forwarding `lead_created` to Meta Conversions API and importing conversions into Google Ads for closed-loop ad optimization
2. **Lead → CRM handoff** — POST to HubSpot or Salesforce when a lead is created, so sales team doesn't need to check the dashboard
3. **Lead status workflow** — add `status` field (NEW → CONTACTED → QUALIFIED → CONVERTED) so the dashboard becomes an actual pipeline tracker
4. **A/B test CTA copy** — "Hemen Başvur" vs "Ücretsiz Dene" — GTM is already set up to track which converts better
5. **Pace indicator** — "At current rate, you'll hit 2500 leads in X days" — makes the 3-month goal visible every day
