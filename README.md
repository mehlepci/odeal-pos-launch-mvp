# ÖdeAl Akıllı POS — Launch MVP

End-to-end marcom prototype for a physical POS product launch: **landing page → lead capture → scoring → internal dashboard**. Built for the Digital Marketing Engineer case study.

**Live demo:** https://odeal-pos-launch-mvp.vercel.app
**Dashboard:** https://odeal-pos-launch-mvp.vercel.app/dashboard — password: `odeal2026`

> ⚠️ Demo / case-study project. Not affiliated with ÖdeAl; uses mock data.

---

## What's inside

| Layer | Route | What it does |
|---|---|---|
| Landing page | `/` | Responsive LP, two CTAs, GTM + GA4 tracking |
| Self-serve flow | `/basvur` | 3-step online application (higher-intent lead) |
| Sales-contact flow | `/iletisim` | Short "call me back" form (lower-friction lead) |
| Lead API | `/api/leads` | `POST` create + score, `GET` list |
| Metrics API | `/api/metrics` | Aggregations for the dashboard |
| Dashboard | `/dashboard` | 5 KPIs, charts, filterable lead table (marcom team) |

**The hybrid acquisition model** (the core of the brief) is implemented as two physically separate flows so each lead carries a `flowType` the sales team and scoring engine can act on. See [DECISIONS.md](DECISIONS.md) D-004.

## Stack

- **Next.js 16** (App Router) + **TypeScript** — LP, API, and dashboard in one deployable repo
- **Prisma 7** + **libSQL adapter** — **Turso** (cloud SQLite) in prod, local `file:` SQLite in dev
- **Tailwind CSS v4**, **Recharts** for dashboard charts
- **Vercel** deploy, **GTM** (client) + **GA4 Measurement Protocol** (server) for tracking

Every architecture choice — and the trade-off behind it — is documented in **[DECISIONS.md](DECISIONS.md)**. The one-page summary is **[ONE-PAGER.md](ONE-PAGER.md)**.

## Run locally

```bash
npm install                 # postinstall runs `prisma generate`
cp .env.example .env        # fill in Turso creds, OR use the file: line for local SQLite
npm run seed                # creates 60 mock leads
npm run dev                 # http://localhost:3000
```

To run fully offline, set `DATABASE_URL="file:./dev.db"` in `.env` (no token needed), then `npm run seed`.

## Lead scoring

Rule-based 0–100 score, computed on every submission in [lib/scoring.ts](lib/scoring.ts). Chosen over pure ML because it's explainable to the marcom team and works on day one with zero historical data.

**Live AI layer:** [lib/ai-scoring.ts](lib/ai-scoring.ts) calls Google Gemini (`gemini-2.5-flash`) to read the free-text `notes` field and classify its urgency/purchase-intent, adding a bounded, explainable boost (`none/low/high → +0/+10/+20`) on top of the rule score. The LLM only classifies; the points per class are fixed in code, and the result (`aiScore` + the model's `aiReason`) is shown in the dashboard's score breakdown. Falls back to +0 when there's no note or `GEMINI_API_KEY` is unset. See DECISIONS.md D-005/D-010.

## Tracking

Two layers (DECISIONS.md D-006):
- **Client-side via GTM `dataLayer`** — `page_view`, `cta_click`, `form_start`, `form_step_complete`, `form_submit`
- **Server-side via GA4 Measurement Protocol** — `lead_created`, fired from the API after the DB write so ad blockers can't drop the conversion event

**Both layers are live in production:**
- Client-side: a real GTM container (`GTM-P7QJ6PFN`) is loaded and published, routing the `dataLayer` events into GA4 — visible in GA4 Realtime (or DebugView via GTM Preview).
- Server-side: real `lead_created` events are sent to a live GA4 property and are verifiable in GA4 DebugView (submit a form, watch the event appear).

They fall back to console logging / no-op only when the `GA4_*` / `NEXT_PUBLIC_GTM_ID` env vars are unset (e.g. a local fork without keys). See `.env.example`.

## Deploy

Connected to Vercel with auto-deploy on push to `main`. Production env vars (Settings → Environment Variables): `DATABASE_URL` + `DATABASE_AUTH_TOKEN` (Turso), `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` + `GA4_DEBUG_MODE` for live server-side tracking, `NEXT_PUBLIC_GTM_ID` for client-side GTM, and `GEMINI_API_KEY` for live AI lead scoring.
