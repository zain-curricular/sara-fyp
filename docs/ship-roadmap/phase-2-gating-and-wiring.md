# Phase 2 — Marketplace Gating & Connective Tissue

> **PR 2** · **Depends on:** Phase 0 · **Unblocks:** P4 (seeds must honour the gates), P5.
> **Goal:** enforce the three trust gates the proposal explicitly promises (seller admin-approval, payout-setup-before-listing, listing moderation) and connect every orphaned-but-finished UI entry point so the whole app is reachable by clicking, not by typing URLs. Turns "features exist" into "features are used." `dev` stays green.
>
> **Shared references:** decisions 8.6, 8.7 = [INDEX §8](INDEX.md#8-resolved-decisions--open-items); inventory §1.2/§1.4 = [INDEX §1](INDEX.md#1-verified-feature-inventory-grounded-2026-08-09); conventions = [INDEX §7](INDEX.md#7-conventions).

---

## Task 2.1 — Seller approval gate

### What it is
Make store creation produce a *pending* seller that an admin must approve before selling (proposal §1.3, §3.4).

### Current state (verified)
- `api/seller/onboard/route.ts:110-115` adds `"seller"` to roles and sets `active_role='seller'` immediately.
- Admin `POST /api/admin/sellers/[id]/verify` sets a flag nothing reads as a gate.
- No `seller_approved` notification/enum member (INDEX §1.2).

### Implementation approach
1. Migration (marketplace_gates): `seller_stores.approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected'))`; notification enum member `seller_approved`.
2. Onboard: create store `pending`, grant seller role but gate selling actions on `approved` (or grant role only on approval — pick one; simpler: role granted, publish gated).
3. Admin verify route: set `approved`/`rejected`, notify the seller (existing pattern).
4. Seller dashboard shows a "pending approval" banner until approved; `become-a-seller` copy hardened from "may review" to the real workflow.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_marketplace_gates.sql` | new — approval_status, enum |
| `src/app/api/seller/onboard/route.ts` + `src/lib/features/seller-store/services.ts` | edit — pending status |
| `src/lib/features/admin/services.ts` | edit — approve/reject + notify |
| `src/app/seller/*` shells, `become-a-seller/shell.tsx` | edit — pending banner + copy |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] New store is `pending`; seller cannot make listings `active` until admin approves
- [ ] Admin approve flips status + fires `seller_approved` notification
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** onboard → assert pending + publish blocked → admin approve → publish allowed.
- **Non-technical:** Success = "new sellers wait for admin approval before their shop goes live."

---

## Task 2.2 — Payout-setup gate

### What it is
Require valid payout details (proper table, validated) before a seller can publish (proposal §3.4; INDEX §8.6).

### Current state (verified)
- `seller/payouts/setup/shell.tsx:67` saves bank details into `profiles.metadata` via `PATCH /api/auth/me` — unvalidated, not queryable as a gate; no check exists in onboarding or `POST /api/listings` (`:79` checks only role).

### Implementation approach
1. Migration: `seller_stores.payout_details jsonb NULL` (method, account/IBAN/wallet, holder name).
2. New/updated route `PATCH /api/seller/store` (or dedicated payout route) with zod validation (IBAN pattern, wallet format); write to `payout_details`.
3. Publish gate: `POST /api/listings/[id]/publish` requires `payout_details IS NOT NULL AND approval_status='approved'`; friendly 422 with a link to setup.
4. Payout setup page reads/writes the new column instead of profile metadata.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_marketplace_gates.sql` | edit — payout_details |
| `src/app/api/seller/store/route.ts` + `seller-store` schemas/services | edit — validated payout write |
| `src/app/api/listings/[id]/publish/route.ts` | edit — gate |
| `src/app/seller/payouts/setup/shell.tsx` | edit — new column |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Zod schema documented; gate has a `//..` comment.

### Acceptance criteria
- [ ] Publishing without payout details returns 422 with guidance; with details succeeds
- [ ] Invalid IBAN/wallet rejected server-side
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** publish attempt with/without payout details; invalid payload rejected.
- **Non-technical:** Success = "a seller must add bank details before they can sell anything."

---

## Task 2.3 — Listing moderation gate

### What it is
Route new listings through admin review instead of straight to `active` (proposal §1.3; INDEX §8.7).

### Current state (verified)
- `api/listings/[id]/publish/route.ts:75` sets `status:"active"` directly; admin approve/reject routes exist but are optional.

### Implementation approach
1. Publish transitions to `pending_review` (existing listing status enum member; confirm it exists, else add in migration).
2. Admin approve → `active` (+ existing seller notification `admin/services.ts:581`), reject → `rejected` with reason (`:628`).
3. Seller listing table shows moderation status chips; buyer-facing queries already filter `status='active'`.
4. Admin listings queue counts pending (KPI wiring already present).

### Code changes
| File | Change |
|---|---|
| `src/app/api/listings/[id]/publish/route.ts` | edit — `pending_review` |
| `supabase/migrations/2026081000xx_marketplace_gates.sql` | edit — enum member if missing |
| `src/app/seller/listings/*` | edit — status chips |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Publish yields `pending_review`; only admin approve makes it `active` and buyer-visible
- [ ] Reject sets `rejected` + reason + notifies seller
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** publish → assert not visible in browse → admin approve → visible.
- **Non-technical:** Success = "listings appear on the site only after an admin approves them."

---

## Task 2.4 — Listing-page CTAs (Contact Seller, Request Inspection, compatibility)

### What it is
Render the three finished-but-unlinked buyer entry points on the listing detail page.

### Current state (verified)
- `src/components/listings/contact-seller-button.tsx` fully written, **zero import sites**; listing shell has no contact affordance.
- `buyer/mechanic-requests/new/page.tsx:24` requires `listingId`; **no listing links there** — mechanic module unreachable.
- `listing_compatibility` table exists (`20260419000005:27-41`), zero app reads; listing "compatibility" text is hardcoded marketing copy.

### Implementation approach
1. Render `ContactSellerButton` in `app/(public)/listings/[id]/shell.tsx` (guest → login redirect; owner → hidden). Uses the 0.1-fixed conversation upsert.
2. Add "Request Inspection" CTA linking `/buyer/mechanic-requests/new?listingId=<id>`; empty-state button on the requests list too.
3. Compatibility panel: read `listing_compatibility` rows (vehicle make/model/year) and render a real "Fits these vehicles" list; fall back to hidden when none.

### Code changes
| File | Change |
|---|---|
| `src/app/(public)/listings/[id]/shell.tsx` | edit — 3 CTAs/panel |
| `src/app/buyer/mechanic-requests/shell.tsx` | edit — new-request button |
| `src/lib/features/listings/services.ts` (or product-catalog) | edit — read compatibility |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] From a listing, a logged-in non-owner can start a chat and open the inspection request form
- [ ] Compatibility panel shows real vehicle rows when present, hidden when absent
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** render listing detail as buyer; assert both CTAs present and links resolve; seed one compatibility row and assert it renders.
- **Non-technical:** Success = "on a part page I can message the seller and ask a mechanic to inspect it, and I can see which cars it fits."

---

## Task 2.5 — Navigation & badges

### What it is
Recover the orphaned working pages and finish the messages unread badge.

### Current state (verified)
- Zero inbound links to `/seller/inventory` (204 ln), `/seller/listings/bulk-upload` (411 ln), `/wholesale`; `seller/layout.tsx:24-35` omits them.
- Header Messages link (`site-header.tsx:93-100`) has no badge despite the `:9` comment; bell count never decrements after marking read on `/notifications`.

### Implementation approach
1. Add Inventory + Bulk Upload to seller nav (`seller/layout.tsx`); add a Wholesale entry to the public nav (or footer) if in scope for the demo.
2. Messages header link: fetch total unread (the 0.1-fixed counts) + realtime subscription, render a numbered badge like the bell.
3. Bell decrement: share unread state (context or refetch on `/notifications` mark-read) so the badge updates without reload.

### Code changes
| File | Change |
|---|---|
| `src/app/seller/layout.tsx` | edit — nav entries |
| `src/components/layout/site-header.tsx` | edit — messages badge |
| `src/components/layout/notification-bell.tsx` + notifications hook | edit — decrement on read |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Inventory, Bulk Upload, Wholesale reachable from navigation
- [ ] Messages badge shows unread total and clears on read; bell badge decrements on mark-read
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** nav link presence test; badge count reflects seeded unread and updates on read.
- **Non-technical:** Success = "every page has a link, and the message/notification counters are accurate."

---

## Task 2.6 — Mechanic completeness

### What it is
Enforce mechanic verification on accept and pay mechanics on verdict so the earnings screen is real.

### Current state (verified)
- `verified_at` decorative — `acceptRequest` never checks it; role granted on self-onboard (`mechanic/services.ts:110`).
- `submitVerdict` (`:277-329`) never creates a payout; `api/mechanic/earnings/route.ts:26` queries `payouts` by `seller_id` → always empty.
- Inspection fee collected on request (`mechanic-requests/services.ts:24,90`) but never flows to the mechanic.

### Implementation approach
1. `acceptRequest`: require `verified_at IS NOT NULL`; unverified mechanics see a "pending verification" state (admin verify route already exists).
2. `submitVerdict`: on verdict, create a `payouts` row for the mechanic (amount = collected inspection fee), reusing 1.4's payout path (mechanic id in `seller_id` slot as the earnings route expects, or a `payee_id` — match the route's query).
3. Earnings page renders the resulting rows (list fixed in 0.3-style if needed).

### Code changes
| File | Change |
|---|---|
| `src/lib/features/mechanic/services.ts` | edit — verified gate + payout on verdict |
| `src/app/api/mechanic/earnings/route.ts` | edit — align query to payout shape |
| `src/app/mechanic/earnings/shell.tsx` | edit — render rows |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Unverified mechanic cannot accept; verified can
- [ ] Submitting a verdict creates a payout the mechanic sees under Earnings
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** accept as unverified (403) vs verified (200); verdict → assert earnings row.
- **Non-technical:** Success = "only approved mechanics take jobs, and they get paid and can see their earnings."
