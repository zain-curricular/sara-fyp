# ShopSmart Ship-Ready — Implementation Roadmap (INDEX)

> **What this is.** The gap-closure programme that takes ShopSmart from "85% of the surface built, core flows broken at runtime" to a demoable, production-feeling marketplace: working commerce lifecycle (payment → escrow → delivery → payout), enforced trust gates, a live AI assistant, fraud detection, a full-platform realistic demo dataset (50 sellers, 500+ listings, activity for every role), and a real test suite. Structure mirrors the phase-file conventions in `.claude/skills/roadmap-creator`.
>
> **Target repo:** `f:\1.Github\marketplace` (single repo — Next.js 16 App Router app + `supabase/` migrations, edge functions, seed). **Home:** fixes land inside the existing feature modules (`src/lib/features/*`), new migrations in `supabase/migrations/`, demo data in `supabase/seed-data/` + `scripts/`.
> **Frontends:** same repo (buyer, seller, admin, mechanic, public surfaces).
> **Status:** planning/documentation only — **no source code is written from this roadmap until each phase is approved.**
> **Grounding date:** 2026-08-09 (every "Current state" note reflects a direct read of the repo on this date, via a four-pass parallel audit of commerce, messaging/notifications, AI/fraud, and mechanic/admin/seller areas, cross-checked against `BUILD_REPORT.md` and `NOTES.md`).
> **Prior art it builds on:** the complete ShopSmart build described in `BUILD_REPORT.md` (112 pages, 76 API routes, 17 feature modules, 45 migrations), the idempotent fixed-UUID seed pattern in `supabase/seed.sql`, and the test scaffolding in `__tests__/` (mockAuth, requestBuilder, vitest configs) that currently has zero tests.

---

## 0. How to read this roadmap

- **Phase = PR.** Phase ids are `0…5`. Each phase must be green on `npx tsc --noEmit && npm run lint && npm run test` (plus the suites it introduces) before the next phase that depends on it starts.
- **Dependency posture:** Phase 0 is the root — it reconciles the schema every other phase writes against. Phases 1, 2, 3 fan out in parallel after 0. Phase 4 (demo data) needs the final shapes from 1–3. Phase 5 (testing/release) closes the programme.
- **"Current state" is verified, not assumed.** Every claim carries a `file:line` anchor or an explicit "does not exist". Anything unverifiable is a **⚠️ Flag** routed to §8.
- **Shared conventions** live in the repo already: `CLAUDE.md` (three-layer architecture, two-barrel feature modules, tabs, file headers), `_CONVENTIONS/` docs, and `.claude/rules/*.md`. This roadmap does not restate them; §7 lists only the additions.
- **North Star invariant:** *every screen, for every role, shows real data and every proposal flow can be walked live in the demo without touching a database console.*
- **Deadline context:** ship target is 2026-08-10. Tasks are deliberately coarse (5–6 per phase); do not subdivide further when transcribing to tickets.

---

## 1. Verified feature inventory (grounded 2026-08-09)

Legend: ✅ = works today · ⚠️ = partially / broken at runtime · ❌ = not at all

### 1.1 Commerce: orders, payments, escrow, payouts

| Capability | Status | Evidence |
|---|---|---|
| Order placement (API+service+UI) | ⚠️ | `src/lib/features/orders/services.ts:143` (`placeOrder`) is complete, but insert omits legacy `listing_id`/`amount` — both `NOT NULL` in `supabase/migrations/20260416000006_orders_escrow.sql`; never relaxed by `20260419000007_shopsmart_orders.sql` → NOT NULL violation on every checkout |
| Saved-address path in checkout | ⚠️ | `orders/services.ts:153` reads `.from("addresses")`; table is `saved_addresses` (`20260419000009_chatbot_kb_payouts.sql:75`) |
| Seller acceptance | ✅ | `src/app/api/orders/[id]/accept/route.ts` → `transitionOrderStatus` (`orders/services.ts:498`), state-machine guard + ownership check |
| Payment (any gateway) | ❌ | Zero gateway deps in `package.json`; checkout (`src/app/(buyer)/checkout/shell.tsx`) renders JazzCash/EasyPaisa/Card with literal "Coming soon" badges, advance button `disabled={paymentMethod !== "cod"}`; method never persisted — `mapOrderRow` hardcodes `paymentMethod: "cod"` (`orders/services.ts:75`) |
| Payment-after-acceptance ordering | ❌ | `placeOrder` auto-transitions `pending_payment → paid_escrow` at placement (`orders/services.ts:311-325`); no post-acceptance payment step exists |
| Shipping / dispatch | ✅ | `src/app/api/orders/[id]/ship/route.ts` persists tracking + transitions `accepted → shipped` |
| **`shipped → delivered` transition** | ❌ | **No route, button, webhook, or admin action ever sets `delivered`** — grep across `src/app/api` returns zero writes; `transitionOrderSchema` declares the state but is never imported by a route |
| Buyer confirm receipt | ⚠️ | `orders/services.ts:568` requires `ss_status === "delivered"` (`:586`) — unreachable; escrow write invalid (below) |
| Escrow writes | ⚠️ | `placeOrder` (`services.ts:328`) inserts nonexistent `buyer_id`/`seller_id`, omits NOT NULL `type`/`payment_method`, uses `status:"held"` — invalid for enum `escrow_tx_status ('pending','completed','failed')`; correct column is `ss_status` (`20260419000007:36-40`). `confirmReceipt` (`:594`) writes nonexistent `released_at`. Cancel route same class of bug |
| Dispute resolve → escrow | ⚠️ | `src/lib/features/admin/services.ts:923` writes `ss_status:"completed"` — violates CHECK `('held','released','refunded','disputed')` |
| Escrow auto-release (7-day) | ⚠️ | `supabase/functions/auto-release-escrow/index.ts` written, filters `.is("deleted_at", null)` (column does not exist on `orders`) and is **not scheduled** — `20260416000016_cron.sql` schedules 7 jobs, none for it |
| Payout record creation | ❌ | Repo-wide, nothing inserts into `payouts`; only SELECT/UPDATE in `admin/services.ts:1318,1351` and SELECT in `api/mechanic/earnings/route.ts` — table permanently empty |
| Seller payouts page | ⚠️ | `src/app/seller/payouts/page.tsx:37` queries **`seller_payouts`** — table does not exist (real table: `payouts`, `20260419000009:48`); error swallowed, always renders empty state |
| Admin payout batch | ⚠️ | `runPayoutBatch` (`admin/services.ts:1347`) only flips `pending → processing`; never `paid`, no `paid_at`/`transaction_ref`, no money movement |
| Buyer order tracking | ✅ | `src/app/buyer/orders/[id]/track/` — real Realtime `postgres_changes` on `order_status_events` (in publication); tracking number is free text (no courier API) |

### 1.2 Messaging & notifications

| Capability | Status | Evidence |
|---|---|---|
| Realtime infrastructure | ✅ | `messaging/hooks.ts:235-280`, `notifications/hooks.ts:141-190` — genuine `postgres_changes` subscriptions; publications in `20260417000005` + `20260417000007` |
| Conversation list / thread | ⚠️ | `messaging/services.ts` queries columns that don't exist in `20260416000008_messaging.sql`: `buyer_unread_count`/`seller_unread_count` (`:109-110,164-165`) vs `unread_count_buyer`/`unread_count_seller`; `messages.body` (`:214,268,274`) vs `content`; `messages.attachments`, `conversations.order_id` — no such columns; `.is("listing_id", null)` (`:50`) vs `listing_id NOT NULL` |
| Mark-as-read | ⚠️ | `services.ts:327` passes `{p_conversation_id, p_user_id}`; RPC takes one arg (`20260417000006_mark_messages_read_strict.sql:7-9`) → PGRST202, unread counts never reset |
| Dead RPC call | ⚠️ | `services.ts:283` calls `increment_unread_and_preview` — never created (confirmed `BUILD_REPORT.md` TODO 6); superseded by trigger `handle_new_message` (`20260416000013_triggers.sql:100-150`) |
| Contact-seller entry point | ❌ | `src/components/listings/contact-seller-button.tsx` fully written, **zero import sites**; listing shell has no contact affordance |
| Notification creation on events | ⚠️ | 5 insert sites (order placed `orders/services.ts:341`, status change `:553`, listing approve/reject `admin/services.ts:581,628`, mechanic events `mechanic/services.ts:257,319`, new-message trigger). **Missing: seller-approval and payment-update notifications**; no `seller_approved` enum member (`20260416000001_enums.sql:87-99`) |
| Notification bell + mark read | ✅ | `src/components/layout/notification-bell.tsx` (realtime badge), `api/notifications/*` routes, ownership-scoped services |
| Messages unread badge in header | ❌ | `site-header.tsx:93-100` — plain link, no badge (header comment at `:9` claims one) |

### 1.3 AI, recommendations & fraud

| Capability | Status | Evidence |
|---|---|---|
| Chatbot (RAG pipeline) | ⚠️ | `api/chatbot/route.ts` is a real LangChain pipeline, but `chatbot/services.ts:41,51,81,90` queries `chat_sessions` — table is `chatbot_sessions` (`20260419000009:8`) → hard 500 on every request |
| RAG vector search RPCs | ❌ | `search_kb_documents`, `search_listings_by_embedding`, `find_similar_listings` (`recommendations/similar/route.ts:51`), `find_similar_listings_multi_category` (`for-you/route.ts:62`) — none defined in any of the 45 migrations |
| Embeddings population | ❌ | `listings.embedding` (`20260419000005:17-22`) never written by any code path; uniformly NULL |
| KB ingestion | ⚠️ | `createKBDocument` (`admin/services.ts:1284-1292`) inserts `source_url` (column is `source`) and `embedding: []` (invalid for `vector(1536)`) |
| AI listing generation | ✅ | `api/ai/generate-listing/route.ts` — real call, anti-hallucination prompt, wired into wizard (`create-listing-wizard.tsx:241-280`); needs `OPENAI_API_KEY` (absent from `.env`) |
| Recommendations | ⚠️ | Heuristic fallbacks work; vector paths dead (missing RPCs + NULL embeddings); `frequently-bought` is real co-purchase logic but **no UI consumes** for-you/home/frequently-bought |
| Fraud signal generation | ❌ | `supabase/functions/fraud-worker/index.ts:200-210` upserts columns that don't exist (`rule`,`target_id`,`target_type`,`detected_at`) vs real `fraud_signals` (`20260419000008:72-81`); status `"pending_review"` violates CHECK; `onConflict` references missing constraint; rule 3 reads nonexistent `listing_price_history`; never scheduled |
| Fraud admin review | ✅ | `admin/fraud` pages + action/dismiss routes + services (`admin/services.ts:945-1028`); table just always empty |
| Admin audit trail | ⚠️ | Fraud services insert `admin_actions.action`/`note` — table defines `action_type` NOT NULL (`20260419000008:94-102`); error unchecked, audit rows silently lost |
| Vehicle compatibility / garage | ❌ | `listing_compatibility` table exists (`20260419000005:27-41`), referenced by zero app code; `(buyer)/garage/page.tsx` is a hardcoded "Coming soon" stub |

### 1.4 Gating, mechanic, misc

| Capability | Status | Evidence |
|---|---|---|
| Seller admin-approval gate | ❌ | `api/seller/onboard/route.ts:110-115` grants `seller` role instantly; admin verify flag (`api/admin/sellers/[id]/verify`) read by nothing |
| Payout-setup-before-selling gate | ❌ | No payout check in onboarding or listing create; `seller/payouts/setup/shell.tsx:67` saves bank details into `profiles.metadata` via `PATCH /api/auth/me` — unvalidated, not queryable as a gate |
| Listing moderation gate | ❌ | `api/listings/[id]/publish/route.ts:75` sets `status:"active"` directly; admin approve/reject routes optional |
| Mechanic module backend | ✅ | Onboarding, accept (`api/mechanic/requests/[id]/accept`), verdict, completed, settings — all real |
| Mechanic entry point for buyers | ❌ | `buyer/mechanic-requests/new/page.tsx:24` requires `listingId` param; **no listing page links there** — module unreachable via UI |
| Mechanic earnings | ⚠️ | `api/mechanic/earnings/route.ts:26` queries `payouts` by `seller_id`; `submitVerdict` (`mechanic/services.ts:277-329`) never creates a payout row — always empty |
| Mechanic verification gate | ⚠️ | `verified_at` decorative — `acceptRequest` never checks it; role granted on self-onboard (`mechanic/services.ts:110`) |
| Orphaned working pages | ⚠️ | `/seller/inventory` (204 ln), `/seller/listings/bulk-upload` (411 ln), `/wholesale` — zero inbound links; `seller/layout.tsx:24-35` omits them from nav |
| Wholesale PO ownership | ⚠️ | `src/app/wholesale/po/[id]/page.tsx:27-31` fetches any order by id with **no `buyer_id` check** — IDOR unless RLS saves it (**⚠️ Flag**, §8.9) |
| Admin panel (12 sections) | ✅ | All pages render real data; all 23 client `fetch()` sites resolve to existing admin-gated handlers |

### 1.5 Non-functional (proposal Chapter 6 / §3.5)

| Capability | Status | Evidence |
|---|---|---|
| Unit / integration / API tests | ❌ | 0 test files repo-wide; `__tests__/` contains only helpers (`mockAuth.ts`, `requestBuilder.ts`, fixtures); 4 vitest configs present |
| E2E tests | ❌ | `__e2e__/` contains only `.gitkeep`; `playwright.config.ts:7` references `__e2e__/global-setup.ts` — **does not exist** (running e2e fails immediately) |
| Storybook stories | ❌ | 0 `.stories.tsx` files |
| Sentry monitoring | ❌ | `@sentry/nextjs` in `package.json`, zero usages in `src/` |
| Upstash rate limiting | ❌ | `@upstash/ratelimit` in `package.json`, zero usages |
| Demo data | ⚠️ | `supabase/seed.sql` — 6 users, 2 sellers, 16 listings, 3 orders, 2 reviews, 8 KB docs; no images in storage, no mechanic requests, disputes, fraud signals, payouts, conversations |

### Where it's currently broken/uncovered — the one-paragraph version

A single root cause dominates: **the service layer was written against a schema that was never migrated** (messaging columns, `chat_sessions`, `seller_payouts`, `addresses`, escrow columns/enums, fraud columns, `admin_actions.action_type`, four missing pgvector RPCs, two legacy NOT NULLs on `orders`). On top of that sit four genuinely missing capabilities — payment gateway, `delivered` transition, payout generation, fraud/cron scheduling — three unenforced trust gates, a handful of orphaned-but-finished UI entry points, and zero tests.

---

## 2. Target artifact tree (canonical)

New/changed artifacts only; all fixes to existing files stay in their current homes per the two-barrel module layout.

```
supabase/
├── migrations/
│   ├── 2026081000xx_schema_reconciliation.sql        # P0 — columns, renames-by-fix, enum members, constraints
│   ├── 2026081000xx_vector_rpcs.sql                  # P0 — 4 pgvector search functions + grants
│   ├── 2026081000xx_commerce_lifecycle.sql           # P1 — payment_method, escrow ledger cols, cron schedules
│   └── 2026081000xx_marketplace_gates.sql            # P2 — store approval status, payout_details, notification enum members
├── seed-data/                                        # P4 — committed, offline-capable demo dataset
│   ├── manifest.json                                 # volumes + checksums + license attribution
│   ├── media/                                        # downloaded images, organized <bucket>/<path>
│   │   ├── listing-images/<category>/<file>.jpg
│   │   ├── avatars/<file>.jpg
│   │   └── store-logos/<file>.jpg
│   ├── users.json  stores.json  listings.json
│   ├── orders.json  reviews.json  disputes.json
│   ├── conversations.json  notifications.json
│   ├── mechanic.json  fraud.json  kb.json
│   └── sources.md                                    # where every image came from + license
scripts/
├── fetch-seed-media.ts                               # P4 — downloads manifest URLs → supabase/seed-data/media
└── seed-demo.ts                                      # P4 — `npm run seed:demo` (DB + storage, idempotent)
src/lib/payments/                                     # P1 — sandbox gateway module (single seam)
__tests__/api/…  __tests__/integration/…              # P5 — suites on existing scaffolding
__e2e__/global-setup.ts  __e2e__/tests/…              # P5 — playwright suites (config already points here)
docs/ship-roadmap/                                    # this roadmap + RUNBOOK-demo.md (P5)
```

### Files edited OUTSIDE the module homes (minimal, unavoidable live wiring)

| File | Why |
|---|---|
| `package.json` | `seed:demo`, `seed:media` scripts; no new runtime deps expected (P1 gateway is simulated in-repo) |
| `.env` / `.env.example` | `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` documented for seed script |
| `supabase/config.toml` | edge-function schedules if pg_cron is not used for them |
| `src/components/layout/site-header.tsx` | messages unread badge (P2) |
| `src/app/seller/layout.tsx` | nav links for inventory + bulk upload (P2) |

---

## 3. The live seam (what the programme reuses, verified)

These primitives are correct today and every phase wraps them **unchanged**:

| Primitive | Location | Reused by |
|---|---|---|
| Order state machine + guards | `orders/services.ts:498` (`transitionOrderStatus`) | P1 adds the `delivered` edge through it, not around it |
| Status event + notification pattern | `orders/services.ts:341,553` | P1/P2 new notifications copy this shape |
| Realtime hooks | `messaging/hooks.ts`, `notifications/hooks.ts`, `buyer/orders/[id]/track/shell.tsx` | P2 badge, P1 timeline |
| Unread-count trigger | `handle_new_message` (`20260416000013:100-150`) | P0 deletes the redundant RPC call and keeps the trigger |
| AI provider degradation seam | `src/lib/ai/provider.ts` (null on missing key/package) | P3 builds on it; never bypassed |
| Admin service catalogue | `src/lib/features/admin/services.ts` (1,442 ln) | P1 payout batch, P2 gates, P3 fraud — extend, don't fork |
| Storage buckets + RLS | `20260419000010_storage_buckets.sql` (6 buckets) | P4 uploads into them as-is |
| Idempotent seed pattern | `supabase/seed.sql` (fixed UUIDs, `ON CONFLICT`, trigger disable) | P4 generalizes it |
| Test scaffolding | `__tests__/api/mockAuth.ts`, `requestBuilder.ts`, vitest/playwright configs | P5 writes suites onto it |
| Sandbox payment precedent | Checkout step 2 UI (`(buyer)/checkout/shell.tsx`) | P1 enables the existing options rather than redesigning checkout |

---

## 4. Phase → PR map

| Phase | File | PR | Scope (one line) | Gap(s) closed | Depends on |
|---|---|---|---|---|---|
| **0** | [Schema reconciliation & security hotfixes](phase-0-schema-reconciliation-and-security.md) | 0 | Make the DB and the service layer agree; kill every runtime 500; close the IDOR | §1.1–1.4 schema rows | — |
| **1** | [Commerce core: payments, delivery, escrow, payouts](phase-1-commerce-core.md) | 1 | Sandbox gateway, `delivered` leg, correct escrow lifecycle, payout generation + completion, cron | payments, delivered, payouts, auto-release | 0 |
| **2** | [Marketplace gating & connective tissue](phase-2-gating-and-wiring.md) | 2 | Seller-approval / payout-setup / listing-moderation gates; wire every orphaned CTA and nav | gates, contact-seller, inspection CTA, badges, mechanic earnings | 0 |
| **3** | [Intelligence: AI assistant, recommendations, fraud](phase-3-intelligence.md) | 3 | Chatbot live end-to-end, embedding pipeline, recommendations in UI, fraud worker scheduled | chatbot 500, embeddings, recs UI, fraud generation | 0 |
| **4** | [Demo data & storage seeding](phase-4-demo-data-and-seeding.md) | 4 | 50 sellers × 10+ listings with real internet-sourced images, activity for every role, `npm run seed:demo` | demo realism, storage media, per-role data | 1, 2, 3 |
| **5** | [Testing & release runbook](phase-5-testing-and-release.md) | 5 | API/integration/e2e suites on the critical paths + per-role demo script + release checklist | zero tests, missing e2e setup, demo script | 1–4 |

### Dependency graph

```
        ┌─▶ P1 ─┐
P0 ─────┼─▶ P2 ─┼─▶ P4 ─▶ P5
        └─▶ P3 ─┘
```

P1, P2, P3 are mutually independent once P0 lands and can run in parallel (three workstreams). P4 needs the final schema + flows from all three (payout rows, verified sellers, fraud signal shape, embeddings-or-fallback). P5 tests what 0–4 shipped and produces the presentation runbook; its e2e work can start drafting against P1's flows while P4 seeds.

---

## 5. Task index

Legend: **[T]** = has explicit testing criteria · **[—]** = docs/config only.

- **Phase 0 — Schema reconciliation & security hotfixes**
  - 0.1 Messaging data-layer alignment (columns, RPC arity, dead RPC, nullable `listing_id`, upsert race) **[T]**
  - 0.2 Orders & escrow schema/services alignment (legacy NOT NULLs, `ss_status` vs `status`, ledger columns, `saved_addresses`) **[T]**
  - 0.3 Wrong-table reference sweep (`chat_sessions`, `seller_payouts`, `addresses`) **[T]**
  - 0.4 Admin/KB/fraud column corrections (`action_type`, `source`, fraud_signals shape + unique key) **[T]**
  - 0.5 pgvector search RPCs (4 functions + grants + ivfflat sanity) **[T]**
  - 0.6 Security & integrity hotfixes (wholesale PO IDOR, dispute-resolve CHECK violation) **[T]**
- **Phase 1 — Commerce core**
  - 1.1 Sandbox payment gateway (JazzCash/EasyPaisa/Card live in checkout, persisted `payment_method`, success/failure paths) **[T]**
  - 1.2 Delivery leg (`shipped → delivered` route + seller UI + status events) **[T]**
  - 1.3 Escrow hold/release/refund correctness (place, confirm-receipt, cancel, dispute) **[T]**
  - 1.4 Payout generation & completion (rows on release; seller page live; admin batch → `paid`) **[T]**
  - 1.5 Auto-release cron live (fix query, schedule, config) **[T]**
  - 1.6 Commerce notifications & timeline completeness (payment, delivered, released, payout) **[T]**
- **Phase 2 — Marketplace gating & connective tissue**
  - 2.1 Seller approval gate (pending → admin verify → active; notification + enum) **[T]**
  - 2.2 Payout-setup gate (validated `seller_stores.payout_details`; required before publish) **[T]**
  - 2.3 Listing moderation gate (publish → `pending_review`; admin approve/reject drives `active`) **[T]**
  - 2.4 Listing-page CTAs (Contact Seller, Request Inspection, compatibility panel) **[T]**
  - 2.5 Navigation & badges (inventory/bulk-upload nav, messages unread badge, bell decrement) **[T]**
  - 2.6 Mechanic completeness (verified-gate on accept, payout row on verdict → earnings live) **[T]**
- **Phase 3 — Intelligence**
  - 3.1 AI provider bring-up (env, model config, visible degradation state) **[T]**
  - 3.2 Chatbot online end-to-end (sessions, RAG, citations, widget + assistant page) **[T]**
  - 3.3 Embedding pipeline (backfill script + embed-on-write for listings and KB) **[T]**
  - 3.4 KB ingestion & re-embed of seeded docs **[T]**
  - 3.5 Recommendations wired into UI (home, for-you, frequently-bought; vector paths live) **[T]**
  - 3.6 Fraud worker live (rules rewritten to real schema, score, schedule, admin dashboard real) **[T]**
- **Phase 4 — Demo data & storage seeding**
  - 4.1 Media acquisition pipeline (curated manifest → `scripts/fetch-seed-media.ts` → committed `seed-data/media/`) **[T]**
  - 4.2 Identity dataset (50 sellers + stores, 80 buyers, 10 mechanics, 3 admins; fixed UUIDs) **[T]**
  - 4.3 Catalog dataset (550+ listings, 10–12/seller, realistic parts/prices/compatibility, image mapping) **[T]**
  - 4.4 Activity dataset (orders in every status, escrow, payouts, reviews, favorites, views, conversations, notifications, disputes, fraud signals, mechanic requests, KB) **[T]**
  - 4.5 Seed runner — `npm run seed:demo` (idempotent; auth users; storage upload; post-reset safe) **[T]**
  - 4.6 Demo verification (count assertions + per-role screen checklist) **[T]**
- **Phase 5 — Testing & release runbook**
  - 5.1 API suite: commerce lifecycle end-to-end **[T]**
  - 5.2 API suite: messaging, notifications, disputes, gates **[T]**
  - 5.3 Integration suite: seed integrity + security regressions **[T]**
  - 5.4 E2E smoke: buyer / seller / admin journeys (+ missing `global-setup.ts`) **[T]**
  - 5.5 Release checklist + per-role demo script (`RUNBOOK-demo.md`) **[—]**

---

## 6. Demo-data model (P4 contract — stated once here)

**Volumes** (minimums; generators may exceed):

| Entity | Count | Notes |
|---|---|---|
| Sellers + stores | 50 | ~40 verified, 6 pending approval (for the admin demo), 4 rejected/suspended |
| Listings | 550+ | 10–12 per seller; ≥1 image each; spread across all 46 part categories and 26 vehicle models; ~30 in `pending_review`, ~10 rejected, ~15 `is_wholesale` |
| Buyers | 80 | includes 2 banned (admin demo) |
| Mechanics | 10 | 7 verified, 3 pending |
| Admins | 3 | includes the existing `admin@shopsmart.pk` |
| Orders | 300+ | every `ss_status` represented incl. ≥120 completed (with released escrow + payout rows), ≥15 disputed, ≥10 cancelled; dated over trailing 90 days so analytics charts have shape |
| Reviews | 200+ | tied to completed orders only; some with seller replies |
| Conversations/messages | 60+ / 400+ | linked to listings; unread counts non-zero for demo accounts |
| Disputes | 15+ | mix of open/resolved, with evidence |
| Fraud signals | 12+ | all three rule types, mixed open/actioned/dismissed, scores set |
| Mechanic requests | 20+ | pending / accepted / verdict-given / completed |
| Payouts | 60+ | pending / processing / paid — so both seller and admin payout screens are populated |
| Notifications | 500+ | derived from the activity above |
| KB documents | 12+ | the 8 in `seed.sql` + 4 new; embedded when key present |

**Identity scheme:** deterministic UUIDs continue the `seed.sql` convention (`aaaaaaaa-…` users, `bbbbbbbb-…` stores, `cccccccc-…` listings, `dddddddd-…` orders, …) so re-seeding is idempotent via `ON CONFLICT` upserts. Demo login credentials documented in `seed-data/manifest.json` and the runbook; all seeded users share the pattern `<Role>@123`-style passwords like the current seed.

**Media sourcing policy:** images are fetched from **license-safe sources only** (Wikimedia Commons, Unsplash/Pexels free tiers, manufacturer press kits where redistribution is permitted) via a checked-in URL manifest; `scripts/fetch-seed-media.ts` downloads once, normalizes (≤1600px, JPEG), and the resulting files are **committed** under `supabase/seed-data/media/` so seeding never needs network. Every file's origin + license recorded in `seed-data/sources.md`. Target: ≥120 distinct part/car images covering engine, brakes, suspension, electrical, body, filters, cooling, fuel + 50 avatar/logo images.

**Storage mapping:** seed runner uploads `media/<bucket>/<path>` → the six buckets from `20260419000010_storage_buckets.sql` (at minimum `listing-images`, `avatars`) via the service-role client against local Supabase, then writes matching DB rows (`listing_images`, `profiles.avatar_url`, store logos).

---

## 7. Conventions

Inherited wholesale from `CLAUDE.md`, `_CONVENTIONS/architecture/**`, and `.claude/rules/*.md` (three-layer API→service→DAF, two-barrel modules, `_`-private folders, tabs, file-header doc blocks, JSDoc on exports, shadcn-only primitives, `gap-*` spacing). Additions specific to this programme:

- **Migrations, not manual SQL** — every schema change in P0–P2 is a migration file; iterate locally per the Supabase skill (`execute_sql` to draft, `supabase db pull` to commit) and never hand-edit applied history.
- **The sandbox gateway is a seam** — all payment logic behind `src/lib/payments/` with one exported interface, so a real JazzCash/Stripe adapter can replace it without touching checkout or order services.
- **Seed data is code-reviewed data** — generators + JSON live in-repo; no network at seed time; deterministic output.
- **Every new notification goes through the existing pattern** at `orders/services.ts:341` (insert + type enum), never ad-hoc.

---

## 8. Resolved decisions & open items

### 8.1 Payment ordering — ✅ RESOLVED (pay at checkout, not after acceptance)
The proposal (§1.3) promises payment after seller acceptance; the built state machine pays at placement (`paid_escrow → accepted`). Flipping the FSM the day before shipping is high-risk, and pay-at-checkout is the industry norm (Daraz et al.). **Decision:** keep placement-time payment; make it real-feeling via the sandbox gateway (P1.1); document the deviation in the runbook (P5.5) so the viva answer is prepared. COD remains supported and semantically pays on delivery.

### 8.2 Gateway realism — ✅ RESOLVED (in-repo sandbox processor)
No merchant accounts can be provisioned by tomorrow. **Decision:** `src/lib/payments/` simulated processor — deterministic outcomes (magic card numbers / wallet IDs for success, decline, timeout), a processing interstitial, persisted `payment_method` + `payment_ref`. Clearly labelled *Sandbox* in UI. Real adapter is post-ship work.

### 8.3 Legacy `orders.listing_id` / `amount` NOT NULLs — ✅ RESOLVED (relax to nullable)
The legacy device-testing flow still writes them; ShopSmart multi-item orders cannot. **Decision:** migration drops NOT NULL on both (CHECK on `amount` becomes `amount IS NULL OR amount > 0`); ShopSmart orders leave them NULL. Lower risk than backfilling fake per-order listing ids. (P0.2)

### 8.4 Escrow column duality (`status` vs `ss_status`) — ✅ RESOLVED (ss_status is canonical for ShopSmart)
All ShopSmart code paths read/write `ss_status` + new ledger columns (`released_at`, `refunded_at` added in P1 migration); legacy `status` enum left untouched for device-testing. (P0.2, P1.3)

### 8.5 Who marks `delivered` — ✅ RESOLVED (seller marks delivered; 7-day auto-release backstops)
No courier API exists. **Decision:** seller gets "Mark as delivered" on the shipped order (route guarded `shipped → delivered`); buyer confirm-receipt then releases escrow; the P1.5 cron auto-releases 7 days after `delivered`. Admin force-transition remains the override. (P1.2)

### 8.6 Payout details storage — ✅ RESOLVED (`seller_stores.payout_details jsonb` + zod)
Moves off `profiles.metadata`; validated server-side (IBAN/wallet format), required non-null before listing publish (gate in P2.2). Not encrypted at rest beyond DB defaults — acceptable for demo, flagged in runbook as production TODO.

### 8.7 Listing moderation default — ✅ RESOLVED (moderation ON)
`publish` transitions to `pending_review`; only admin approve sets `active`. Slower for real sellers but *better for the presentation* (demonstrates the promised workflow). Seed data pre-approves the bulk of listings via service role and leaves ~30 pending for the live demo. (P2.3, P4.3)

### 8.8 Fraud rule 3 (`listing_price_history`) — ✅ RESOLVED (drop the rule)
The table was never designed. Ship rules 1–2 (new-seller price outlier, buyer dispute rate) plus a cheap rule 3 replacement computable from existing data (listing price vs category median). No new table. (P3.6)

### 8.9 Wholesale PO ownership — ⚠️ FLAG → ✅ RESOLVED (explicit guard in code)
Audit could not confirm RLS protects `wholesale/po/[id]`. **Decision:** add the explicit `buyer_id`/seller/admin check in code regardless (defense in depth), P0.6. Verify RLS separately in P5.3.

### 8.10 `OPENAI_API_KEY` provisioning — ⚠️ OPEN (decision needed before P3.2, owner: you)
AI features need a funded OpenAI key in `.env` (and in the demo machine's env). Until provided, chatbot falls back to keyword search over KB (works after P0.5) and generate-listing returns placeholders. **Everything else in P3 is key-independent.** Blocked: embedding backfill (P3.3), live LLM answers.

### 8.11 Out of scope for this ship (explicitly deferred)
Real payment gateway accounts; SMS OTP (Twilio); transactional email; auction flow (`BUILD_REPORT.md` TODO 10); Sentry/Upstash wiring; garage feature beyond the compatibility panel (P2.4 covers fitment display on listings, not saved vehicles); Storybook stories.

---

## 9. Verification (every phase)

```bash
npx tsc --noEmit          # no typecheck script exists; this is the command
npm run lint
npm run test              # unit (vitest.config.mts)
```

Phase-specific additions: `npm run test:api` (P1+, requires local Supabase), `npm run test:integration` (P4+), `npm run test:e2e` (P5, requires dev server on :3202 per playwright PORT default), `npm run build` (P5 release gate).

Programme-wide identity that must hold from P1 onward, and is asserted in P5.3:

> For every order with `ss_status='completed'`: exactly one escrow row with `ss_status='released'`, and `sum(payouts.amount for that seller period) = sum(escrow.seller_payout)` — **money in equals money out.**

Demo-readiness gate (P4.6): after `npm run supabase:reset && npm run seed:demo`, every route in the per-role checklist renders non-empty, image-bearing data with zero console errors.
