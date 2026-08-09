# Phase 0 — Schema Reconciliation & Security Hotfixes

> **PR 0** · **Depends on:** nothing · **Unblocks:** P1, P2, P3 (everything).
> **Goal:** make the database and the service layer agree so that no existing code path 500s against a clean `supabase db reset`. One reconciliation migration set + targeted service-layer edits + two security/integrity hotfixes. No new features, no new UI — **behavioral change is limited to "broken → working"**. `dev` stays green.
>
> **Shared references:** artifact tree = [INDEX §2](INDEX.md#2-target-artifact-tree-canonical); live seam = [INDEX §3](INDEX.md#3-the-live-seam-what-the-programme-reuses-verified); conventions = [INDEX §7](INDEX.md#7-conventions); decisions 8.3, 8.4, 8.9 = [INDEX §8](INDEX.md#8-resolved-decisions--open-items).

---

## Task 0.1 — Messaging data-layer alignment

### What it is
Fix every mismatch between `src/lib/features/messaging/services.ts` and the real messaging schema so conversations, threads, and mark-as-read work end-to-end.

### Current state (verified)
- `services.ts:109-110,164-165` select `buyer_unread_count`/`seller_unread_count`; migration `20260416000008_messaging.sql` defines `unread_count_buyer`/`unread_count_seller`.
- `services.ts:214,268,274` use `messages.body`; column is `content`. `attachments` and `conversations.order_id` do not exist.
- `services.ts:50,69` allow `listing_id = null`; column is `NOT NULL`.
- `services.ts:283` calls RPC `increment_unread_and_preview` — **does not exist** (confirmed `BUILD_REPORT.md` TODO 6); superseded by trigger `handle_new_message` (`20260416000013_triggers.sql:100-150`).
- `services.ts:327` calls `mark_messages_read` with 2 args; function takes 1 (`20260417000006_mark_messages_read_strict.sql:7-9`) → PGRST202.
- `getOrCreateConversation` is a racy find-then-insert despite `UNIQUE (listing_id, buyer_id, seller_id)`.

### Implementation approach
1. Migration: `ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;` add `order_id uuid NULL REFERENCES orders`, add `messages.attachments jsonb NOT NULL DEFAULT '[]'` (cheapest direction: schema moves toward the richer code contract; column *names* move code toward schema).
2. In `services.ts`: rename all reads/writes to `content`, `unread_count_buyer`, `unread_count_seller`; delete the `increment_unread_and_preview` call; fix `mark_messages_read` to single-arg.
3. Replace find-then-insert with `.upsert(..., { onConflict: "listing_id,buyer_id,seller_id" })`.
4. Update `messaging/types.ts` mappers so the UI (`app/messages/shell.tsx`) keeps its camelCase fields.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_schema_reconciliation.sql` | new — conversations/messages deltas above |
| `src/lib/features/messaging/services.ts` | edit — column names, RPC fixes, upsert |
| `src/lib/features/messaging/types.ts` | edit — row mappers |

### Folder structure (this task)
Exactly the tree in [INDEX §2](INDEX.md#2-target-artifact-tree-canonical).

### Comment conventions (this task)
Per repo TypeScript rules: file-header block retained, `//..` block comments where flow changes; SQL migration gets a header comment stating it reconciles code↔schema drift.

### Acceptance criteria
- [ ] `GET /api/conversations`, `GET/POST /api/conversations/[id]/messages`, `POST /api/conversations/[id]/read` all return 2xx against a fresh `supabase db reset`
- [ ] Unread counters reset after read; no PGRST202 in server logs
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** curl the four routes as seeded buyer1↔seller1 (create conversation on a listing, send, list, read); assert unread goes 1→0 in DB.
- **Non-technical:** Success = "two users can chat about a listing and the unread badge clears when read."

---

## Task 0.2 — Orders & escrow schema/services alignment

### What it is
Unblock order placement and make every escrow write structurally valid (per INDEX §8.3/§8.4).

### Current state (verified)
- `orders.listing_id` and `orders.amount` are `NOT NULL` (`20260416000006_orders_escrow.sql`); `placeOrder` (`orders/services.ts:143`) inserts neither → NOT NULL violation on every checkout.
- `placeOrder` reads `.from("addresses")` (`services.ts:153`); table is `saved_addresses` (`20260419000009:75`).
- Escrow insert (`services.ts:328`) uses nonexistent `buyer_id`/`seller_id`, omits NOT NULL `type`/`payment_method`, writes `status:"held"` (invalid enum member); canonical column is `ss_status` (`20260419000007:36-40`). `confirmReceipt` (`:594`) writes nonexistent `released_at`; cancel route same class.
- `auto-release-escrow/index.ts` filters `.is("deleted_at", null)`; `orders` has no `deleted_at`.

### Implementation approach
1. Migration: drop NOT NULL on `orders.listing_id`/`amount` (amount CHECK → `amount IS NULL OR amount > 0`); add `escrow_transactions.released_at timestamptz`, `refunded_at timestamptz`.
2. `placeOrder`: read `saved_addresses`; escrow insert supplies required legacy `type`/`payment_method` and writes `ss_status:'held'`.
3. `confirmReceipt`/cancel/admin paths: write `ss_status` (`released`/`refunded`) + timestamp columns.
4. Edge function: remove `deleted_at` filter, query `ss_status`.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_schema_reconciliation.sql` | edit — orders NOT NULLs, escrow ledger columns |
| `src/lib/features/orders/services.ts` | edit — insert shape, `saved_addresses`, escrow columns |
| `src/app/api/orders/[id]/cancel/route.ts` | edit — refund write |
| `supabase/functions/auto-release-escrow/index.ts` | edit — column fixes (scheduling is P1.5) |

### Folder structure (this task)
Exactly the tree in [INDEX §2](INDEX.md#2-target-artifact-tree-canonical).

### Comment conventions (this task)
Per repo rules; migration header cites INDEX §8.3/§8.4 decisions.

### Acceptance criteria
- [ ] `POST /api/orders` succeeds from seeded cart (COD path) on a fresh reset; escrow row created with `ss_status='held'` and valid legacy `type`/`payment_method`
- [ ] Cancel pre-acceptance sets escrow `ss_status='refunded'` + `refunded_at`
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** place order via API as buyer1 with a saved address; inspect `orders` + `escrow_transactions` rows; cancel a second order and verify refund columns.
- **Non-technical:** Success = "checkout completes and an order appears for buyer and seller — no error screen."

---

## Task 0.3 — Wrong-table reference sweep

### What it is
Fix the three service call-sites that query tables that don't exist.

### Current state (verified)
- `chatbot/services.ts:41,51,81,90` → `chat_sessions`; real table `chatbot_sessions` (`20260419000009:8`). Every chatbot request 500s before the model is consulted.
- `src/app/seller/payouts/page.tsx:37` → `seller_payouts`; real table `payouts` (`20260419000009:48`). Error swallowed (`data ?? []`), page always empty.
- `orders/services.ts:153` → `addresses` (handled in 0.2; verify no other site remains — `addresses` feature module itself is correct).

### Implementation approach
1. Global grep for `from("chat_sessions")`, `from("seller_payouts")`, `from("addresses")` and correct each to the real table.
2. Seller payouts page: stop swallowing errors — surface `error` via the page's error boundary.

### Code changes
| File | Change |
|---|---|
| `src/lib/features/chatbot/services.ts` | edit — `chatbot_sessions` |
| `src/app/seller/payouts/page.tsx` | edit — `payouts` + error handling |

### Folder structure (this task)
No new files.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] `POST /api/chatbot` no longer 500s on session creation (reply may be the keyword-fallback answer)
- [ ] Seller payouts page queries `payouts` and renders rows when they exist
- [ ] Repo-wide grep proves zero references to `chat_sessions`, `seller_payouts`, or bare `from("addresses")` outside the addresses module
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** grep assertions above + one chatbot POST returning 200.
- **Non-technical:** Success = "the chatbot answers instead of erroring, and the seller payouts page can show payouts."

---

## Task 0.4 — Admin/KB/fraud column corrections

### What it is
Fix the admin audit-trail, KB ingestion, and fraud-signal shapes so P3/P4 can write real rows.

### Current state (verified)
- Fraud services insert `admin_actions.action`/`note` (`admin/services.ts:992-998,1018-1024`); table defines `action_type NOT NULL`, no `action` (`20260419000008:94-102`); insert error unchecked → audit rows silently lost.
- `createKBDocument` (`admin/services.ts:1284-1292`) inserts `source_url` (column is `source`) and `embedding: []` (invalid for `vector(1536)`).
- `fraud_signals` real shape: `subject_type, subject_id, signal_type, score, details, status CHECK ('open','dismissed','actioned')` (`20260419000008:72-81`); no unique key for upserts. Worker rewrite itself is P3.6 — this task only prepares the schema.

### Implementation approach
1. Services: `action` → `action_type`, check insert errors; KB insert uses `source` and `embedding: null` when generation fails.
2. Migration: `ALTER TABLE fraud_signals ADD CONSTRAINT fraud_signals_signal_subject_key UNIQUE (signal_type, subject_id);`
3. Audit all other `admin_actions` insert sites for the same column bug (grep `from("admin_actions")`).

### Code changes
| File | Change |
|---|---|
| `src/lib/features/admin/services.ts` | edit — `action_type`, KB columns, error checks |
| `supabase/migrations/2026081000xx_schema_reconciliation.sql` | edit — fraud unique constraint |

### Folder structure (this task)
No new files.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Creating a KB doc via `POST /api/admin/kb` persists with `source` set and NULL embedding when no key
- [ ] Fraud action/dismiss writes an `admin_actions` row that actually lands (verified in DB)
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** run KB create + fraud dismiss against seeded data; SELECT the audit row.
- **Non-technical:** Success = "admin actions leave a visible audit trail and KB articles save."

---

## Task 0.5 — pgvector search RPCs

### What it is
Create the four vector-search functions the AI/recommendation code already calls.

### Current state (verified)
- Called but **not defined in any of the 45 migrations**: `search_kb_documents`, `search_listings_by_embedding` (chatbot `retrieveContext`), `find_similar_listings` (`recommendations/similar/route.ts:51`), `find_similar_listings_multi_category` (`for-you/route.ts:62`).
- pgvector enabled (`20260419000002:5`); ivfflat indexes exist on `kb_documents.embedding` and `listings.embedding` (`20260419000005:17-22`).
- `BUILD_REPORT.md` TODO 5 sketches the expected signature shape.

### Implementation approach
1. New migration `2026081000xx_vector_rpcs.sql`: four `LANGUAGE sql STABLE` functions matching the **exact argument names/shapes the call-sites pass** (read each call-site first; cosine distance `<=>`, `LIMIT match_count`, active-listing filter for the listing functions).
2. `GRANT EXECUTE` to `authenticated` + `anon` where the calling route is public; keep them in `public` schema (they only SELECT, `SECURITY INVOKER`).
3. Guard: functions return empty set when the query embedding is NULL.

### Code changes
| File | Change |
|---|---|
| `supabase/migrations/2026081000xx_vector_rpcs.sql` | new — 4 functions + grants |

### Folder structure (this task)
Exactly the tree in [INDEX §2](INDEX.md#2-target-artifact-tree-canonical).

### Comment conventions (this task)
SQL header comment per function documenting caller file:line.

### Acceptance criteria
- [ ] All four RPCs callable via PostgREST with the argument shapes used in code (no PGRST202)
- [ ] `supabase db reset` applies cleanly; advisors (`supabase db advisors` / MCP) raise no new findings
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** `select * from find_similar_listings(...)` with a zero-vector; RPC via REST for each function.
- **Non-technical:** Success = "nothing visible yet — the AI features stop failing silently." 

---

## Task 0.6 — Security & integrity hotfixes

### What it is
Close the wholesale-PO IDOR and the dispute-resolution CHECK violation.

### Current state (verified)
- `src/app/wholesale/po/[id]/page.tsx:27-31` fetches any order by id with no `buyer_id`/seller/admin check (INDEX §8.9).
- `resolveDispute` (`admin/services.ts:923`) writes escrow `ss_status:'completed'` — violates CHECK `('held','released','refunded','disputed')`, so dispute resolution partially fails.

### Implementation approach
1. Wholesale PO page: after fetch, verify `order.buyer_id === session.userId || order.seller_id === session.userId || roles.includes("admin")`; else `notFound()`.
2. `resolveDispute`: map winner→escrow outcome correctly (`buyer` → `refunded`, `seller` → `released`) with timestamps from 0.2; order `ss_status` transitions stay within the order FSM.

### Code changes
| File | Change |
|---|---|
| `src/app/wholesale/po/[id]/page.tsx` | edit — ownership guard |
| `src/lib/features/admin/services.ts` | edit — valid escrow outcome mapping |

### Folder structure (this task)
No new files.

### Comment conventions (this task)
Per repo rules; guard gets a `//..` comment naming the IDOR it closes.

### Acceptance criteria
- [ ] Logged-in non-owner requesting another user's PO gets 404, owner gets 200
- [ ] Admin dispute resolution completes with escrow row in a CHECK-valid state for both winner outcomes
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** two-user PO fetch matrix; resolve one dispute each way and SELECT the escrow rows.
- **Non-technical:** Success = "users can only see their own orders, and admins can settle disputes without errors."
