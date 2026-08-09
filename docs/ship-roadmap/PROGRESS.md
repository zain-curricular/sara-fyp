# ShopSmart Ship-Ready — Implementation Progress

Running log of completed work, one heading per phase. Each task's plain-English
summary is appended as it lands; each phase gets a closing summary when its PR
merges. Code lands on a `ship-ready` branch of `f:\1.Github\marketplace`
(branched from `main`, 2026-08-09).

Roadmap: [INDEX.md](INDEX.md). Grounding date: 2026-08-09.

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
