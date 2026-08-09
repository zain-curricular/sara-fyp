# ShopSmart — Demo Runbook & Release Checklist

Everything needed to stand up the demo and walk every role. Follow top to bottom.

---

## 1. Environment setup

```bash
# 1) Start local Supabase (this project runs on 55xxx ports so it can coexist
#    with another local Supabase project on the default 543xx ports)
supabase start

# 2) Reset the DB — applies all migrations + seeds base data + the demo dataset
#    (supabase/seed.sql + supabase/seed-data/demo.sql are both wired in)
supabase db reset

# 3) Regenerate DB types (only needed if migrations changed)
npm run supabase:gen-types

# 4) Start the app (port 3202)
npm run dev            # http://localhost:3202
```

**Required env (`.env`, already local):** `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321`,
`DATABASE_URL=…:55322`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (present — AI runs live).

**Optional — real Stripe test mode for Card:** add `STRIPE_SECRET_KEY=sk_test_…`
(and optional `STRIPE_CURRENCY`, default `usd`). Without it, Card uses the in-repo
sandbox. Either way the demo works.

---

## 2. Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopsmart.pk` | `Admin@123` |
| Seller (approved) | `seller1@shopsmart.pk` … `seller50@demo.shopsmart.pk` | `Seller@123` |
| Buyer | `buyer1@shopsmart.pk` … `buyer80@demo.shopsmart.pk` | `Buyer@123` |
| Mechanic | `mechanic@shopsmart.pk`, `mech1..10@demo.shopsmart.pk` | `Mech@123` |

> Note: base accounts use `@shopsmart.pk`; the 50/80/10 generated demo accounts
> use `@demo.shopsmart.pk`.

---

## 3. What's in the demo data

52 stores (42 approved / 8 pending / 4 rejected) · 566 listings (422 active, all
with photos; 23 pending review; 11 rejected) · 303 orders across every status
(122 completed) · 120 payouts · 122 reviews · 30 disputes · 60 conversations ·
24 mechanic verifications · 12 fraud signals · 80 buyers (2 banned) · 10 mechanics.

---

## 4. Scripted walkthrough (per role)

### Buyer — purchase with escrow
1. Sign in as `buyer1@shopsmart.pk`. Browse (`/`) or search a part.
2. Open a listing → **Add to cart** → go to **Cart** → **Checkout**.
3. Enter shipping → **Payment**: pick **Card** (test `4242 4242 4242 4242` succeeds;
   `4000 0000 0000 0002` declines), or JazzCash/EasyPaisa (sandbox), or COD.
4. **Place order** → success page. Open **My Orders** — status `paid_escrow`, the
   **escrow chip** shows *Held in escrow*.

### Seller — list, get approved, fulfil
1. Sign in as `seller1@shopsmart.pk` → **Seller** dashboard.
2. **Listings → New Listing** → fill fields (try **AI Generate** for the
   description) → **Publish** → the listing goes to **pending review** (moderation
   gate). *(Publishing is blocked if the store isn't approved or has no payout
   details — Payouts → Payout settings.)*
3. On a `paid_escrow` order: **Accept** → **Mark as shipped** (tracking) →
   **Mark as delivered**.
4. **Payouts** shows pending/paid totals once orders complete.

### Buyer — confirm receipt (releases the money)
1. Back as the buyer, open the delivered order → **Confirm receipt & release
   payment**. Order → `completed`, escrow → *Released*, a payout row is created.

### Mechanic — inspection
1. From any listing, buyers click **Request inspection**.
2. Sign in as a mechanic → see requests. *(Known issue — see §6: the mechanic
   service currently queries the wrong table; the data exists but the flow needs
   a small follow-up fix.)*

### Admin — moderate, settle, fraud
1. Sign in as `admin@shopsmart.pk` → **Admin**.
2. **Sellers**: approve a pending store → seller gets a notification, can publish.
3. **Listings**: approve a `pending_review` listing → it goes `active` and shows
   in browse; or reject with a reason.
4. **Payouts → Run payout batch** → pending payouts settle to **paid** with a
   batch ref; sellers are notified.
5. **Fraud**: view scored, colour-coded signals. Run detection live in SQL:
   `select public.detect_fraud_signals();`
6. **Disputes**: resolve buyer/seller — escrow refunds or releases accordingly.

### AI assistant
- Open the chatbot (widget / `/assistant`). Ask e.g. *"How does escrow work?"* or
  *"Which oil filter fits a Suzuki Mehran?"* — it answers over the knowledge base.
  (Vector retrieval activates after an embeddings backfill; keyword + LLM works now.)

### Cron (auto-release) — optional live proof
```sql
-- back-date a delivered order 8 days and run the scheduled job by hand:
select public.auto_release_escrow();   -- completes it, releases escrow, pays out
```

---

## 5. Verification (go/no-go)

```bash
npx tsc --noEmit          # green
npm run test              # unit — green (payments seam)
npm run test:integration  # seed integrity + money identity — green
npm run lint              # 0 errors (warnings only)
npm run build             # production build
```

**Money identity (asserted in the integration suite):** every released escrow
belonging to an order has a matching payout of exactly `seller_payout` — verified
120/120 on the seed.

---

## 6. Known issues & deliberate deviations (anticipate viva questions)

- **Mechanic module** — `mechanic/services.ts` queries a nonexistent table
  `verification_requests`; the real table is `mechanic_verifications` (different
  columns). Data is seeded (24 rows) but the list/accept/verdict flow needs the
  service reconciled. *Follow-up.*
- **Listing images use CDN URLs** (loremflickr/pravatar), not Supabase Storage —
  real and reliable but needs internet at demo time. Storage upload is a follow-up.
- **Embeddings not backfilled** — `listings.embedding` is NULL, so vector search /
  recommendations use SQL/keyword fallbacks (which work). A one-time OpenAI
  backfill enables semantic search.
- **Payment ordering** (INDEX §8.1): payment is taken at checkout (industry norm),
  not after seller acceptance as the proposal text implies. COD pays on delivery.
- **Recommendation rails** (3.5) and **messages unread badge** (2.5) deferred as
  polish; endpoints/data exist.
- **No E2E tests** — per project decision; unit + integration cover the critical
  paths.

---

## 7. Release checklist

- [ ] `supabase start` (55xxx) + `supabase db reset` complete without error
- [ ] `npm run dev` serves on :3202
- [ ] `npx tsc --noEmit` green · `npm run test` green · `npm run test:integration` green
- [ ] `npm run lint` 0 errors · `npm run build` passes
- [ ] Buyer purchase → seller fulfil → confirm receipt → payout walk completes
- [ ] Admin approve seller / moderate listing / run payout batch / view fraud works
- [ ] Deviations in §6 understood for Q&A
