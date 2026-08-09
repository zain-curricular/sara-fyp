# Phase 3 — Intelligence: AI Assistant, Recommendations, Fraud

> **PR 3** · **Depends on:** Phase 0 (RPCs, `chatbot_sessions`, fraud schema) · **Unblocks:** P4 (embeddings for seeded listings), P5.
> **Goal:** the AI-powered claims in the proposal actually run: the chatbot answers over the knowledge base and listings, listings and KB docs carry embeddings, recommendations surface in the UI, and the fraud worker generates real signals on a schedule that the admin dashboard shows. Everything except live LLM answers degrades gracefully without a key (INDEX §8.10). `dev` stays green.
>
> **Shared references:** decisions 8.8, 8.10 = [INDEX §8](INDEX.md#8-resolved-decisions--open-items); AI seam = [INDEX §3](INDEX.md#3-the-live-seam-what-the-programme-reuses-verified); inventory §1.3 = [INDEX §1](INDEX.md#1-verified-feature-inventory-grounded-2026-08-09).

---

## Task 3.1 — AI provider bring-up

### What it is
Make the AI provider configurable and its degraded state visible instead of silent.

### Current state (verified)
- `src/lib/ai/provider.ts` returns `null` on missing key/package (`getChatModel`/`getEmbeddingsModel`); `.env` has **no `OPENAI_API_KEY`**; `.env.example:7-9` declares the three AI vars.
- Fallbacks are silent and always return `ok:true`, so an unconfigured stack looks identical to a working one.

### Implementation approach
1. Document `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL` in `.env` (values supplied per INDEX §8.10) and confirm `.env.example`.
2. Add a tiny server helper `aiStatus()` → `'live' | 'degraded'` based on key presence; expose it so UI surfaces (chatbot, listing wizard) can show a subtle "AI limited" note instead of pretending.
3. No behavior change when key present; when absent, features keep working via fallbacks but say so.

### Code changes
| File | Change |
|---|---|
| `.env`, `.env.example` | edit — AI vars |
| `src/lib/ai/provider.ts` | edit — `aiStatus()` export |
| chatbot + wizard shells | edit — degraded note |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] With key set, `aiStatus()` = live; without, = degraded and UI shows the note
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** unit-test `aiStatus()` both branches (env stubbed).
- **Non-technical:** Success = "when AI is off, the app clearly says so instead of silently faking it."

---

## Task 3.2 — Chatbot online end-to-end

### What it is
With 0.3 (`chatbot_sessions`) and 0.5 (RPCs) done, make the RAG pipeline answer real questions with citations.

### Current state (verified)
- `api/chatbot/route.ts` is a real LangChain pipeline; blocked only by the table name (0.3), missing RPCs (0.5), and `kb_documents.slug` column reference in `mapKbDocs`/keyword fallback (column doesn't exist — actual columns: `id,title,source,content,embedding,metadata,created_at`).
- Three UI surfaces exist: `app/chatbot/shell.tsx`, `app/(public)/assistant/shell.tsx`, `components/chatbot/chatbot-widget.tsx`.

### Implementation approach
1. Fix citation/link building to use real columns (`id`/`title`/`source`), not `slug`.
2. Verify `retrieveContext` calls the 0.5 RPCs with matching arg names; keyword fallback path stays for the no-key case.
3. Persist session + messages + citations to `chatbot_sessions`; render citations in all three surfaces.
4. Session continuity across turns (session id round-trip).

### Code changes
| File | Change |
|---|---|
| `src/lib/features/chatbot/services.ts` | edit — column fixes, RPC wiring |
| `src/app/api/chatbot/route.ts` | edit — citation shape |
| chatbot/assistant/widget shells | edit — render citations |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] With key: "which oil filter fits a Suzuki Mehran?" returns a grounded answer citing KB/listings
- [ ] Without key: returns a keyword-based answer over KB, no 500
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** API test posts a question, asserts 200 + non-empty answer + ≥0 citations in both modes.
- **Non-technical:** Success = "the assistant answers parts questions and links to the source."

---

## Task 3.3 — Embedding pipeline

### What it is
Populate `listings.embedding` (never written today) and re-embed KB docs, so vector search actually returns rows.

### Current state (verified)
- `listings.embedding` uniformly NULL — no write path in `src`; vector recommendation branches therefore dead even after 0.5.
- KB embedding written only on admin create (`admin/services.ts:1284`, fixed columns in 0.4) but seeded KB docs have none.

### Implementation approach
1. Embed-on-write: when a listing is created/edited (and has a key), generate + store its embedding from title+description+specs via the provider seam; no-op when degraded.
2. Backfill script `scripts/embed-backfill.ts` (or a seed sub-step) that embeds all listings/KB docs lacking an embedding, batched via `embedMany`, idempotent.
3. Guard every vector RPC call to skip when the query embedding is NULL (falls back to SQL heuristic).

### Code changes
| File | Change |
|---|---|
| `src/lib/features/listings/services.ts` | edit — embed on write |
| `scripts/embed-backfill.ts` | new — batch backfill |
| `package.json` | edit — `embed:backfill` script |

### Folder structure (this task)
No new folders beyond `scripts/`.

### Comment conventions (this task)
Script header documents idempotency + batch size.

### Acceptance criteria
- [ ] After backfill (key set), a sample of listings/KB docs have non-NULL 1536-dim embeddings
- [ ] Backfill is safe to re-run (skips already-embedded)
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** run backfill on seeded data; `SELECT count(*) WHERE embedding IS NOT NULL`.
- **Non-technical:** Success = "the site can find similar parts by meaning, not just category."

---

## Task 3.4 — KB ingestion & re-embed

### What it is
Ensure the knowledge base (proposal's chatbot backbone) is populated and embedded.

### Current state (verified)
- 8 KB docs seeded in `seed.sql` (buying, selling, escrow, inspection, catalog, returns, shipping) with no embeddings; `createKBDocument` columns fixed in 0.4.

### Implementation approach
1. Extend seeded KB to 12+ docs (add: warranty, disputes, payouts, wholesale) — content lives in P4's `seed-data/kb.json`.
2. Backfill (3.3) embeds them; admin KB page (`/admin/kb`) can add/edit and re-embeds on save.
3. Confirm `retrieveContext` reads these via `search_kb_documents`.

### Code changes
| File | Change |
|---|---|
| `src/lib/features/admin/services.ts` | edit — re-embed on KB edit |
| (KB content authored in P4 `seed-data/kb.json`) | — cross-ref |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] ≥12 KB docs embedded and retrievable by the chatbot
- [ ] Editing a KB doc in admin re-embeds it
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** ask a warranty question, assert the warranty doc is cited.
- **Non-technical:** Success = "the assistant knows the shop's policies and can quote them."

---

## Task 3.5 — Recommendations wired into UI

### What it is
Surface the recommendation endpoints that no page currently consumes.

### Current state (verified)
- `home` = newest 8 (no personalization); `similar/[id]` = category SQL; query-variant `similar` + `for-you` call the (0.5-created) RPCs; `frequently-bought` is real co-purchase logic but **no UI fetches for-you/home/frequently-bought**.

### Implementation approach
1. Homepage: "Recommended for you" (for-you, auth) / "Trending" (home, guest) rail.
2. Listing detail: keep "Similar" (already consumed) + add "Frequently bought together" rail using `frequently-bought`.
3. With embeddings (3.3) present, vector branches return meaningful results; without, SQL fallback still fills the rails.

### Code changes
| File | Change |
|---|---|
| `src/app/(public)/_components/*` (home rails) | new/edit — recommendation rails |
| `src/app/(public)/listings/[id]/_components/*` | edit — frequently-bought rail |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Per repo rules.

### Acceptance criteria
- [ ] Home shows a recommendation rail (personalized when logged in); listing shows frequently-bought
- [ ] Rails are non-empty against seeded data in both vector and fallback modes
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** render home + listing; assert rails populated from the endpoints.
- **Non-technical:** Success = "the homepage suggests parts for me and product pages show what's often bought together."

---

## Task 3.6 — Fraud worker live

### What it is
Rewrite the fraud worker to the real schema, drop the impossible rule, emit scores, and schedule it (INDEX §8.8).

### Current state (verified)
- `fraud-worker/index.ts:200-210` writes nonexistent columns, invalid status, missing `onConflict` constraint (added in 0.4), reads nonexistent `listing_price_history` (rule 3), emits no `score`, never scheduled.
- Admin review UI + action/dismiss work (`admin/services.ts:945-1028`); table always empty.

### Implementation approach
1. Rewrite inserts to real `fraud_signals` columns (`subject_type, subject_id, signal_type, score, details, status='open'`), upsert on the 0.4 unique key.
2. Rules: (1) new-seller price outlier vs category median, (2) buyer dispute rate; replace rule 3 with listing-price-vs-category-median outlier (no new table). Each sets a 0–1 `score` the admin UI already colour-codes.
3. Schedule via pg_cron parity with the other jobs (`20260416000016_cron.sql` style) or `config.toml`.

### Code changes
| File | Change |
|---|---|
| `supabase/functions/fraud-worker/index.ts` | edit — schema, rules, scores |
| `supabase/migrations/2026081000xx_...` | edit — schedule entry |

### Folder structure (this task)
No new folders.

### Comment conventions (this task)
Each rule documented with its threshold + score formula.

### Acceptance criteria
- [ ] One scheduled run over seeded data produces `fraud_signals` rows with scores; admin dashboard renders them colour-coded
- [ ] Admin action/dismiss transitions status and writes an audit row (0.4)
- [ ] `npx tsc --noEmit && npm run lint && npm run test` green

### Testing criteria
- **Engineer:** invoke the worker against seed data engineered to trip each rule; assert rows + scores; dismiss one.
- **Non-technical:** Success = "the system flags suspicious sellers/buyers and admins can act on them."
