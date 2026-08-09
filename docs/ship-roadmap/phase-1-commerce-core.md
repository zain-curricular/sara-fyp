# Phase 1 — Commerce Core: Payments, Delivery, Escrow, Payouts

> **PR 1** · **Depends on:** Phase 0 · **Unblocks:** P4 (order/payout seed data), P5.
> **Goal:** the proposal's flagship promise runs end-to-end live: checkout with a sandbox gateway (JazzCash/EasyPaisa/Card + COD) → escrow held → seller accepts → ships → **marks delivered** → buyer confirms receipt → escrow released → **payout row created** → admin batch marks paid — with notifications at every hop and the 7-day auto-release cron actually scheduled. Money in equals money out (INDEX §9 identity).
>
> **Shared references:** decisions 8.1, 8.2, 8.4, 8.5 = [INDEX §8](INDEX.md#8-resolved-decisions--open-items); live seam = [INDEX §3](INDEX.md#3-the-live-seam-what-the-programme-reuses-verified); conventions = [INDEX §7](INDEX.md#7-conventions).

---

## Task 1.1 — Sandbox payment gateway

### What it is
Enable the three disabled payment methods behind an in-repo simulated processor; persist what the buyer chose (INDEX §8.1/§8.2).

### Current state (verified)
- Checkout step 2 (`src/app/(buyer)/checkout/shell.tsx`) renders JazzCash/EasyPaisa/Card each with a literal "Coming soon" badge; advance button `disabled={paymentMethod !== "cod"}`.
- No gateway SDK in `package.json`; no payment call anywhere; `checkout/failed/page.tsx` is a dead route.
- `payment_method` is never persisted — `mapOrderRow` hardcodes `"cod"` (`orders/services.ts:75`).
- `src/lib/payments/` **does not exist**.

### Implementation approach
1. New module `src/lib/payments/` (two-barrel per conventions): `processPayment(input): {ok, ref} | {ok:false, reason}` — deterministic sandbox (magic values: card `4242…` succeeds, `4000…0002` declines; wallet number ending `00` fails), latency-simulated.
2. Migration (commerce_lifecycle): `orders.payment_method text NOT NULL DEFAULT 'cod'`, `orders.payment_ref text NULL`.
3. Checkout: enable the three options labelled **Sandbox**, add a processing interstitial, on decline route to the (now live) `/checkout/failed` with reason; on success continue the existing `placeOrder` path with method + ref.
4. `placeOrder` + `mapOrderRow`: persist/read real `payment_method`, `payment_ref`; escrow row records the method (column exists on legacy table).

### Code changes
| File | Change |
|---|---|
| `src/lib/payments/index.ts`, `services/index.ts` | new — sandbox processor seam |
| `supabase/migrations/2026081000xx_commerce_lifecycle.sql` | new — payment columns |
| `src/app/(buyer)/checkout/shell.tsx` | edit — enable methods, interstitial, failure path |
| `src/lib/features/orders/services.ts` | edit — persist method/ref |

### Folder structure (this task)
```
src/lib/payments/
├── index.ts            # client barrel: types, magic-value constants
└── services/index.ts   # server barrel ("server-only"): processPayment
```

### Comment conventions (this task)
File headers state SANDBOX explicitly; magic values documented in module README-style header.

### Acceptance criteria
- [ ] All four methods selectable; sandbox success creates order with persisted `payment_method`/`payment_ref`; decline lands on `/checkout/failed` with no order created
- [ ] COD behaviour unchanged
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** unit-test `processPayment` matrix (success/decline/timeout); API test placing one order per method asserting persisted fields.
- **Non-technical:** Success = "I can pay with a test card and see it succeed or be declined like a real store."

---

## Task 1.2 — Delivery leg (`shipped → delivered`)

### What it is
Create the missing transition that currently dead-ends every order (INDEX §8.5).

### Current state (verified)
- No route/button/webhook ever sets `delivered` — zero write sites across `src/app/api`; `transitionOrderSchema` declares the state but no route imports it.
- `confirmReceipt` requires `ss_status === "delivered"` (`orders/services.ts:586`) — unreachable; auto-release queries `delivered` — never matches.
- Ship route + seller `ShipForm` work (`api/orders/[id]/ship/route.ts`).

### Implementation approach
1. `POST /api/orders/[id]/deliver` — seller-owned, guard `shipped → delivered` via `transitionOrderStatus` (the seam, not around it), sets `delivered_at`, status event, buyer notification.
2. Seller order detail (`app/seller/orders/[id]/shell.tsx`): "Mark as delivered" button on shipped orders, mirroring the Ship form pattern.
3. Buyer order detail + track timeline show the delivered step; confirm-receipt CTA becomes reachable.

### Code changes
| File | Change |
|---|---|
| `src/app/api/orders/[id]/deliver/route.ts` | new — transition route |
| `src/lib/features/orders/services.ts` | edit — `delivered_at`, service fn |
| `src/app/seller/orders/[id]/shell.tsx` | edit — Mark-delivered UI |
| `src/lib/features/orders/hooks.ts` | edit — `useMarkDelivered` |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules; route header names the FSM edge it adds.

### Acceptance criteria
- [ ] Seller can transition shipped→delivered exactly once; non-owner gets 403; wrong-state gets 409/422
- [ ] Buyer timeline shows Delivered in realtime (existing `order_status_events` subscription)
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** API test full guard matrix (owner/non-owner × valid/invalid state).
- **Non-technical:** Success = "the order timeline finally reaches Delivered and the buyer is asked to confirm receipt."

---

## Task 1.3 — Escrow hold/release/refund correctness

### What it is
With 0.2's columns in place, make the escrow ledger semantically right across the four money moments: hold (payment), release (confirm-receipt/auto), refund (cancel/dispute-buyer-wins).

### Current state (verified)
- Post-0.2 the writes are structurally valid, but: `confirmReceipt` (`orders/services.ts:568`) was unreachable so never exercised; checkout copy promises "held until you confirm receipt" — now true only after 1.2; `seller_payout`/`platform_fee` columns exist (`NOTES.md` schema decisions) but release never computes them into the ledger.
- Dispute path fixed for validity in 0.6; refund semantics for partial flows undefined.

### Implementation approach
1. On hold: escrow row stores `amount = order total`, `platform_fee` (3%, matching `placeOrder` math), `seller_payout = amount - platform_fee - shipping share` — single source of truth for 1.4.
2. `confirmReceipt`: set escrow `ss_status='released'`, `released_at`, transition order → `completed`, notify seller.
3. Cancel/dispute-refund: `ss_status='refunded'`, `refunded_at`, notify both parties.
4. Add a `getEscrowSummary` DAF for the buyer/seller order detail panels (held/released/refunded chip).

### Code changes
| File | Change |
|---|---|
| `src/lib/features/orders/services.ts` | edit — ledger math, release/refund writes |
| `src/lib/features/admin/services.ts` | edit — dispute refund uses same helpers |
| `src/app/buyer/orders/[id]/shell.tsx`, `src/app/seller/orders/[id]/shell.tsx` | edit — escrow status chip |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Ledger math gets a `//..` block citing the INDEX §9 identity.

### Acceptance criteria
- [ ] Place→…→confirm-receipt yields exactly one escrow row ending `released` with `seller_payout + platform_fee ≈ amount`
- [ ] Cancel and buyer-wins-dispute yield `refunded` + timestamp
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** API test walks the full lifecycle and asserts the ledger identity; dispute/cancel variants.
- **Non-technical:** Success = "confirming receipt releases the money to the seller; cancelling refunds the buyer — and the order page says so."

---

## Task 1.4 — Payout generation & completion

### What it is
Create payout rows when escrow releases; finish the admin batch so payouts reach `paid`; light up the seller payouts page.

### Current state (verified)
- Nothing inserts into `payouts` anywhere; table permanently empty.
- `runPayoutBatch` (`admin/services.ts:1347`) only `pending → processing`; never `paid`, no `paid_at`/`transaction_ref`.
- Seller page fixed to read `payouts` in 0.3 but has no data to show.
- `payouts` schema at `20260419000009:48` (period-based, `seller_id`, `status`).

### Implementation approach
1. On escrow release (1.3 + auto-release fn): upsert a payout row for the seller (`amount = seller_payout`, `status='pending'`, period = release week, `order_ids` in details).
2. `runPayoutBatch`: `pending → processing → paid` with `paid_at` + sandbox `transaction_ref` (reuse payments seam for realism); keep the existing `admin_actions` audit write.
3. Seller payouts page: totals header (pending / paid this month) + rows; admin payouts screen already lists — verify with real rows.

### Code changes
| File | Change |
|---|---|
| `src/lib/features/orders/services.ts` | edit — payout upsert on release |
| `supabase/functions/auto-release-escrow/index.ts` | edit — same payout upsert |
| `src/lib/features/admin/services.ts` | edit — batch completes to `paid` |
| `src/app/seller/payouts/shell.tsx` (or page) | edit — totals + rows |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Completing an order produces a `payouts` row visible on both seller and admin screens
- [ ] Admin "Run payout batch" ends with rows in `paid` + `paid_at` + `transaction_ref`
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** lifecycle API test extended: after confirm-receipt assert payout row; call batch route; assert `paid`.
- **Non-technical:** Success = "sellers see their earnings appear and admin can pay them out with one click."

---

## Task 1.5 — Auto-release cron live

### What it is
Schedule the 7-day escrow auto-release so unconfirmed delivered orders complete themselves.

### Current state (verified)
- `auto-release-escrow` function exists, column bugs fixed in 0.2/1.4; **not scheduled** — `20260416000016_cron.sql` has 7 jobs, none for it; `supabase/config.toml` has no schedule; `NOTES.md:42` lists deployment as outstanding.

### Implementation approach
1. Prefer pg_cron parity with the existing 7 jobs: add a `cron.schedule('auto-release-escrow', '0 3 * * *', …)` entry in the commerce migration invoking the same logic as the edge function via a SQL function, **or** schedule the edge function in `config.toml` — decide by matching how the other 7 jobs invoke work; keep one mechanism, delete the redundant path.
2. Release date basis: `delivered_at + interval '7 days'`, skip orders with open disputes (logic already drafted in the function).
3. Log a status event + notification on auto-release (distinct copy from manual confirm).

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_commerce_lifecycle.sql` | edit — cron schedule (or `supabase/config.toml`) |
| `supabase/functions/auto-release-escrow/index.ts` | edit — final logic, or port to SQL fn |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Migration comment states cadence + dispute-skip rule.

### Acceptance criteria
- [ ] A delivered order backdated 8 days is auto-completed by one scheduled run (escrow released + payout row + notification)
- [ ] Orders with open disputes are skipped
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** backdate a seeded order's `delivered_at`, invoke the job manually (SQL or `supabase functions serve`), assert outcome.
- **Non-technical:** Success = "if a buyer forgets to confirm, the seller still gets paid after 7 days."

---

## Task 1.6 — Commerce notifications & timeline completeness

### What it is
Fill the notification gaps the proposal names for payments and money movement.

### Current state (verified)
- Existing inserts: order placed (`orders/services.ts:341`), status change (`:553`), listing approve/reject, mechanic, new-message trigger. **No payment/escrow/payout notifications anywhere** (grep `from("notifications").insert` = 5 sites).
- Notification `type` enum (`20260416000001_enums.sql:87-99`) lacks payment/payout members.

### Implementation approach
1. Migration (commerce_lifecycle): add enum members `payment_received`, `order_delivered`, `escrow_released`, `payout_paid`.
2. Insert via the existing pattern at each new hop: payment success (1.1), delivered (1.2), released — manual + auto (1.3/1.5), payout paid (1.4).
3. Buyer/seller order timelines render the new event types with correct copy/icons.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_commerce_lifecycle.sql` | edit — enum members |
| `src/lib/features/orders/services.ts`, `admin/services.ts`, edge fn | edit — notification inserts |
| `src/lib/features/notifications/types.ts` + notification renderers | edit — new types/copy |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Each lifecycle hop produces exactly one correctly-typed notification for the right party (no duplicates)
- [ ] Bell badge increments in realtime for each (existing subscription)
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** lifecycle API test asserts the notification sequence per party.
- **Non-technical:** Success = "buyer and seller are pinged at every step — paid, delivered, money released, payout sent."
