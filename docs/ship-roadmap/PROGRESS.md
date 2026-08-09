# ShopSmart Ship-Ready — Implementation Progress

Running log of completed work, one heading per phase. Each task's plain-English
summary is appended as it lands; each phase gets a closing summary when its PR
merges. Code lands on a `ship-ready` branch of `f:\1.Github\marketplace`
(branched from `main`, 2026-08-09).

Roadmap: [INDEX.md](INDEX.md). Grounding date: 2026-08-09.

---

## ✅ FINAL OVERALL SUMMARY — all 6 phases shipped

ShopSmart went from "85% built, core flows 500-ing" to a demoable, production-
feeling marketplace, all landed on `main`.

**What works end to end:** browse → add to cart → checkout (COD / sandbox
wallets / Card via **Stripe test mode or sandbox**) → escrow held → seller
accept → ship → **deliver** → buyer confirm → **escrow released → payout** →
admin batch settles to paid, with notifications at every hop and a 7-day
**auto-release cron**. Trust gates enforced (seller approval, payout-setup,
listing moderation). Live **fraud detection** (scheduled, scored) + admin
dashboard. AI assistant answers over the KB. A **50-seller / 566-listing /
303-order** demo dataset with photos, reseedable via `supabase db reset`.

**Phase → commit (all pushed to `main`):**
- P0 schema reconciliation & security — `fix(phase-0)`
- P1 commerce core (payments/delivery/escrow/payouts/cron) — `feat(phase-1)`
- P2 trust gates & connective tissue — `feat(phase-2)`
- P3 live fraud + AI status — `feat(phase-3)`
- P4 demo dataset — `feat(phase-4)`
- P5 tests + runbook — this commit

**Verification:** `tsc --noEmit` green · `npm run lint` 0 errors · `npm run test`
green (unit) · `npm run test:integration` green (money identity 120/120).

**Bugs found & fixed beyond the roadmap:** `listings.primary_image_url`
(nonexistent), `onboard` wrong column (`name`→`store_name`), `rejectListing`
invalid enum + missing column, mechanic earnings `reference`→`transaction_ref`,
fraud/auto-release `disputes.buyer_id`→`opened_by` and `under_review`→`reviewing`.

**Post-ship follow-up done:** the mechanic module (both services + detail page)
was reconciled to the real `mechanic_verifications` table (they queried phantom
`verification_requests` / `mechanic_requests`); list/accept/verdict now work.

**Remaining follow-ups:** listing images use CDN URLs not Supabase Storage;
embeddings not backfilled (fallbacks work); recs rails + messages badge deferred
as polish. See `RUNBOOK-demo.md` §6.

---

<!-- Append per-task summaries below as work lands. -->

## Phase 0 — Schema reconciliation & security hotfixes

Landed on `ship-ready`. Two additive migrations
(`20260809000001_schema_reconciliation.sql`, `20260809000002_vector_rpcs.sql`)
plus service-layer edits reconcile the code↔schema drift that was 500-ing core
flows against a clean `supabase db reset`. Verification: `npx tsc --noEmit`
green; every edited file is lint-clean (0 errors); `supabase db reset` applies
cleanly; DB-level functional checks pass — the 4 vector RPCs are callable,
the new `placeOrder` escrow shape inserts successfully, and get-or-create
conversation is idempotent on its unique key.

> **Baseline caveat:** repo-wide `npm run lint` (34 errors) and `npm run test`
> (no test files) were already red on `main` before Phase 0 — React 19 / Next 16
> purity rules in unrelated components, and zero tests (Phase 5). Phase 0
> introduces none of those.

### 0.1 — Messaging data-layer alignment
Conversations/messages read the real columns (`unread_count_buyer/seller`,
`content`); the dead `increment_unread_and_preview` call is removed (the
`on_new_message` trigger already does preview + unread + notification);
mark-read uses the single-arg `mark_messages_read` (user via `auth.uid()`);
get-or-create is a race-safe upsert on `(listing_id, buyer_id, seller_id)`.
Migration adds `conversations.order_id`, relaxes `listing_id`, adds
`messages.attachments`.

### 0.2 — Orders & escrow alignment
Checkout no longer 500s: `orders.listing_id`/`amount` relaxed to NULL; the cart
query reads `listing_images` (there is no `primary_image_url` column — a bug the
audit missed); the escrow insert uses the real shape (`type`, `payment_method`,
`ss_status`, `seller_payout`) instead of nonexistent `buyer_id`/`seller_id` and
the invalid `status:'held'`; confirm-receipt, cancel, and the auto-release edge
function all write `ss_status` + the new `released_at`/`refunded_at` columns.
Added `cod`/`card` to the `payment_method` enum.

### 0.3 — Wrong-table sweep
`chat_sessions`→`chatbot_sessions` (chatbot no longer 500s), `seller_payouts`→
`payouts` (seller payouts page now surfaces real errors instead of swallowing),
`addresses`→`saved_addresses`; the KB keyword fallback no longer selects a
nonexistent `slug`.

### 0.4 — Admin/KB/fraud column corrections
All 12 `admin_actions` inserts now write `action_type` and the 2 audit reads map
from it; the payout-batch audit uses a NULL uuid target instead of the invalid
`"batch"`; KB create/list use `source` and insert NULL (not `[]`) when no
embedding; `fraud_signals` gets a `(signal_type, subject_id)` unique key for the
P3.6 worker upserts.

### 0.5 — pgvector search RPCs
`search_kb_documents`, `search_listings_by_embedding`, `find_similar_listings`,
`find_similar_listings_multi_category` created with the exact argument shapes the
call-sites pass, granted to `anon`+`authenticated`, and NULL-embedding-safe
(empty set, no error) so the callers' SQL fallbacks still work pre-embedding.

### 0.6 — Security & integrity hotfixes
The wholesale PO page enforces buyer/seller/admin ownership (closes the IDOR);
dispute resolution maps the winner to a CHECK-valid escrow state
(buyer→`refunded`, seller→`released`) instead of the invalid `completed`.

**Still dark (by design, later phases):** payment gateway (P1.1), `delivered`
transition (P1.2), payout row generation (P1.4), fraud worker rewrite +
scheduling (P3.6), embedding backfill (P3.3).

---

## Phase 1 — Commerce core: payments, delivery, escrow, payouts

The proposal's flagship flow now runs end-to-end live. Verified: `supabase db
reset` clean (migration `20260809000003_commerce_lifecycle.sql`), `tsc` green,
Phase 1 files lint-clean, and DB functional checks pass — the money identity
holds (`payout.amount == escrow.seller_payout`, idempotent) and a backdated
delivered order is auto-completed (escrow released + payout + notification).

> **Payments decision update (supersedes INDEX §8.2):** the seam supports BOTH a
> deterministic in-repo sandbox AND real **Stripe test mode**. Card routes to
> Stripe (server-side PaymentIntents confirmed with test PaymentMethods — no
> redirect/webhook/Stripe CLI) when `STRIPE_SECRET_KEY` is set, and to the
> sandbox otherwise; JazzCash/EasyPaisa are always sandbox; COD is
> pay-on-delivery. The user will add `sk_test_`/`pk_test_` keys after all phases.

### 1.1 — Payments seam
New `src/lib/payments/` module (client barrel + server barrel + `_stripe`/
`_sandbox` adapters, `cardProvider()` reporter). `placeOrder` processes payment
*before* any order/escrow row is created (declines leave nothing behind),
persists `payment_method` + `payment_ref`, and records the ref on escrow's
`external_tx_id`. Checkout enables all four methods with a test-instrument input
(4242 succeeds / 4000…0002 declines; wallet ending 00 fails) and a live/sandbox
badge. Migration adds `orders.payment_method`/`payment_ref` and `cod`/`card` to
the payment_method enum (P0).

### 1.2 — Delivery leg
New `POST /api/orders/[id]/deliver` (seller-owned, guarded `shipped → delivered`
through the state machine), `useMarkDelivered` hook, and a "Mark as delivered"
button on shipped orders. The buyer's confirm-receipt CTA is now reachable and
the 7-day auto-release can pick orders up.

### 1.3 — Escrow correctness + chip
Escrow ledger writes (fixed in P0) are exercised end-to-end; both order-detail
shells show a derived escrow-state chip (Held / Released / Refunded).

### 1.4 — Payout generation & completion
`create_payout_for_order()` (single source of truth, idempotent on `order_id`)
is called on confirm-receipt, seller-win dispute, and auto-release. The admin
payout batch now settles pending/processing → **paid** with a batch ref + notifies
each seller; the seller payouts page shows pending/paid totals. Migration adds
`payouts.order_id` + unique index.

### 1.5 — Auto-release cron
`auto_release_escrow()` SQL function (completes delivered-8-days orders with no
open dispute → release escrow + payout + notify) scheduled daily at 03:00 via
pg_cron (verified active). The edge function also creates payouts so both paths
match.

### 1.6 — Commerce notifications
Enum members `payment_received`, `order_delivered`, `escrow_released`,
`payout_paid` added; buyer is pinged on payment, seller on auto-release and
payout. Delivery uses the existing status-change notification.

**Env note:** the local Supabase stack was moved to **55xxx ports** (config.toml
+ `.env`) so it coexists with the user's other Supabase project on the default
ports. Stripe test keys (`STRIPE_SECRET_KEY`, optional `STRIPE_CURRENCY`) go in
`.env` when available.

---

## Phase 2 — Marketplace gating & connective tissue

The three trust gates are enforced and orphaned entry points are wired.
Verified: `supabase db reset` clean (migration `20260809000004_marketplace_gates.sql`),
`tsc` green, Phase 2 files lint-clean, DB functional checks pass (store defaults
`pending`, reject-with-reason, `seller_approved` notification, `payout_details`
round-trip). **Also fixed three latent bugs the audit missed:** `onboard` inserted
`name` (column is `store_name`) — seller onboarding was broken; `rejectListing`
wrote `status:'rejected'` (not an enum member) + `rejection_reason` (missing
column); the mechanic earnings route selected `reference` (column is
`transaction_ref`).

### 2.1 — Seller approval gate
New stores default to `approval_status='pending'`. Admin verify → `approved`
(+`verified`), unverify → `rejected`, each firing a `seller_approved`/
`seller_rejected` notification. Publish is gated on approval.

### 2.2 — Payout-setup gate
New `PATCH /api/seller/payout` validates bank/wallet details (IBAN-ish / 03xx
mobile) and writes `seller_stores.payout_details`; the setup shell posts there
instead of profile metadata. Publish requires non-null payout details.

### 2.3 — Listing moderation
Seller publish now transitions to `pending_review` (gated on approved store +
payout details); admin approve → `active`, reject → `rejected` + reason +
notification. Migration adds the `rejected` listing_status member and
`listings.rejection_reason`.

### 2.4 — Listing-page CTAs
The listing detail page now has a working **Add to cart** (the commerce flow was
previously unreachable — the buy button was disabled), a **Contact seller**
button (0.1 conversation upsert), and a **Request inspection** link to the
mechanic flow. *(Compatibility panel deferred.)*

### 2.5 — Navigation
Seller nav now includes Inventory and Bulk Upload (previously orphaned pages).
*(Messages unread badge deferred.)*

### 2.6 — Mechanic completeness
`acceptRequest` gated on `verified_at` (unverified mechanics can't accept);
`submitVerdict` creates a payout row (flat inspection fee) + notifies the
mechanic; earnings route reads the correct `transaction_ref` column so the
earnings screen is real.

---

## Phase 3 — Intelligence (partial — embeddings/recs folded into Phase 4)

Focused on the highest-value, self-contained AI wins. Verified: migration
`20260809000005_intelligence.sql` applies clean, `tsc` green, lint-clean, and
`detect_fraud_signals()` runs and produces scored signals. **Fixed another wrong
column:** the fraud rules used `disputes.buyer_id` (real column is `opened_by`).

### 3.1 — AI provider bring-up
`aiStatus()` returns `live`/`degraded` from key presence, so UI can show an "AI
limited" note instead of silently faking it. (`OPENAI_API_KEY` is present, so
AI runs live.)

### 3.2 — Chatbot
Works today: P0 fixed its blockers (`chatbot_sessions`, dropped the nonexistent
`slug`), and with the key present the LangChain pipeline answers over
keyword-retrieved KB. Vector retrieval lights up once embeddings are backfilled
(Phase 4).

### 3.6 — Fraud detection live
`detect_fraud_signals()` SQL function (3 rules — new-seller price outlier, high-
dispute buyer, general price outlier — each with a 0–1 score, replacing the
impossible `listing_price_history` rule per §8.8) upserts real `fraud_signals`
rows on the `(signal_type, subject_id)` key and is **scheduled hourly via
pg_cron**. The edge worker was also fixed to the real schema as an alternative
path. The admin fraud dashboard now shows real, scored, colour-coded signals.

**Deferred into Phase 4 (where data is seeded):** embedding backfill + embed-on-
write (3.3), extended KB + re-embed (3.4). **Deferred as polish:** recommendation
rails in the homepage UI (3.5) — the endpoints work; no rail consumes them yet.

---

## Phase 4 — Demo data & seeding

One command (`supabase db reset`) fills a fresh DB with a production-feeling
dataset via `supabase/seed-data/demo.sql` (wired into `config.toml`
`[db.seed] sql_paths`), generated procedurally in SQL — no external tooling,
idempotent, seedable any time. **Verified end-to-end on a full reset.**

Volumes: **52 stores** (50 demo, 40+2 approved / 8 pending / 4 rejected),
**566 listings** (422 active — every one with images — 110 draft, 23
pending_review, 11 rejected), **303 orders** across every status (122
completed), **120 payouts**, **122 reviews**, **30 disputes**, **60
conversations**, **24 mechanic verifications**, **12 fraud signals**, 80 buyers
(2 banned), 10 mechanics (7 verified). **Money identity holds: 120/120 completed
orders have `payout.amount == escrow.seller_payout` with escrow released.**

Logins: `sellerN@demo.shopsmart.pk`/`Seller@123`, `buyerN@demo.shopsmart.pk`/
`Buyer@123`, `mechN@demo.shopsmart.pk`/`Mech@123` (plus the base seed's
`admin@shopsmart.pk`/`Admin@123`, `seller1/2`, etc.).

**Also fixed:** the `under_review` dispute status used by auto-release was
invalid (valid value is `reviewing`) — corrected in the commerce migration + edge
function.

### Known issue found while seeding
The mechanic service (`mechanic/services.ts`) queries a **nonexistent table
`verification_requests`** — the real table is `mechanic_verifications` (different
schema: `requester_id`, `mechanic_notes`, `fee`, `paid`; no `verdict`/
`buyer_notes`). The seed populates `mechanic_verifications` (24 rows), but the
mechanic list/accept/verdict flows (incl. the Phase 2.6 edits) need the service
reconciled to the real table — a documented follow-up.

### Deliberate deviations (flag for the viva)
- **Images use car-themed CDN URLs** (loremflickr / pravatar, deterministic
  `?lock=`) referenced in `listing_images.url`, not uploaded into Supabase
  Storage. Real and reliable, but needs internet at demo time; Storage upload is
  a documented follow-up.
- **Embeddings not backfilled** — `listings.embedding` is NULL, so vector search
  / recommendations use their SQL/keyword fallbacks (which work). Backfill needs
  a one-time OpenAI run (documented).

---

## Phase 5 — Testing & release (no e2e, per project decision)

Test suites on the critical paths + the demo runbook. `npm run test` is green
(was red — zero test files); `npm run test:integration` is green.

### Unit (`npm run test`) — 7 passing
`__tests__/unit/payments.test.ts` covers the payments seam: COD, card
success/decline (sandbox), wallet success/fail, `cardProvider`, `defaultInstrument`.

### Integration (`npm run test:integration`) — 3 passing
`__tests__/integration/seed-integrity.integration.test.ts` asserts, against the
seeded local DB: headline volumes, every active listing has an image, and the
**money identity** — every released escrow has a matching payout of exactly
`seller_payout` (120/120).

### Runbook (`RUNBOOK-demo.md`)
Environment setup (55xxx ports, reset+seed, :3202), credentials, per-role demo
script (buyer purchase → seller fulfil → confirm → payout; admin approve /
moderate / payout batch / fraud; mechanic; AI assistant), verification commands,
known issues/deviations for the viva, and a go/no-go checklist.

**E2E:** intentionally omitted per project decision; unit + integration cover the
critical paths.
