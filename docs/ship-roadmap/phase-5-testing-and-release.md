# Phase 5 — Testing & Release Runbook

> **PR 5** · **Depends on:** Phases 1–4 · **Unblocks:** the presentation.
> **Goal:** satisfy the proposal's Chapter 6 (unit/integration/API/E2E testing) with real suites on the critical paths, fix the missing Playwright `global-setup.ts` that makes e2e fail on invocation, verify the security fixes and the money identity, and produce a per-role demo script + release checklist so the defense runs without surprises. `dev` stays green; `npm run build` passes.
>
> **Shared references:** verification commands + money identity = [INDEX §9](INDEX.md#9-verification-every-phase); test scaffolding reused = [INDEX §3](INDEX.md#3-the-live-seam-what-the-programme-reuses-verified); out-of-scope = [INDEX §8.11](INDEX.md#8-resolved-decisions--open-items).

---

## Task 5.1 — API suite: commerce lifecycle end-to-end

### What it is
An API-level test that walks place → pay → accept → ship → deliver → confirm → release → payout and asserts the money identity.

### Current state (verified)
- `__tests__/api/` has `mockAuth.ts`, `requestBuilder.ts`, `index.ts`, `.gitkeep` — **zero test files**; `vitest.api.config.mts` present; `npm run test:api` requires local Supabase.

### Implementation approach
1. Using `mockAuth` (JWT mock) + `requestBuilder`, seed a minimal fixture (or reuse P4 seed subset), then exercise each order route in sequence for buyer/seller.
2. Assert: escrow held on pay, released on confirm, exactly one payout row, and `seller_payout + platform_fee ≈ amount` (INDEX §9).
3. Cover the sandbox gateway decline path (no order created) and the auto-release path (backdated delivered).

### Code changes
| File | Change |
|---|---|
| `__tests__/api/orders.lifecycle.test.ts` | new — full-chain test |
| `__tests__/api/payments.test.ts` | new — gateway matrix |

### Folder structure (this task)
Under `__tests__/api/` per existing config.

### Comment conventions (this task)
Per repo testing conventions (invoke the `api-testing` skill when authoring).

### Acceptance criteria
- [ ] `npm run test:api` runs the lifecycle test green against local Supabase
- [ ] Money identity asserted; decline + auto-release covered
- [ ] `npx tsc --noEmit && npm run lint` green

### Testing criteria
- **Engineer:** `npm run test:api` passes; failing a deliberately-broken ledger step turns it red.
- **Non-technical:** Success = "an automated test proves buying and paying works from start to finish."

---

## Task 5.2 — API suite: messaging, notifications, disputes, gates

### What it is
API tests for the P0-fixed messaging/notifications and the P2 trust gates.

### Current state (verified)
- No tests; routes fixed in P0/P2.

### Implementation approach
1. Messaging: create conversation on a listing, send, list, mark-read → unread resets (regression against the 0.1 bugs).
2. Notifications: assert lifecycle + seller-approval notifications fire once each.
3. Gates: publish blocked without approval/payout; allowed after; wholesale PO IDOR returns 404 for non-owner.

### Code changes
| File | Change |
|---|---|
| `__tests__/api/messaging.test.ts`, `notifications.test.ts`, `gates.test.ts` | new |

### Folder structure (this task)
Under `__tests__/api/`.

### Comment conventions (this task)
Per `api-testing` skill.

### Acceptance criteria
- [ ] All three suites green under `npm run test:api`
- [ ] IDOR + gate regressions covered
- [ ] `npx tsc --noEmit && npm run lint` green

### Testing criteria
- **Engineer:** `npm run test:api` includes the three files, all passing.
- **Non-technical:** Success = "tests guarantee chat, alerts, and seller approval rules keep working."

---

## Task 5.3 — Integration suite: seed integrity + security regressions

### What it is
Integration tests (real DB) asserting the P4 seed's invariants and the P0.6 security posture, including RLS on the wholesale/orders path.

### Current state (verified)
- `vitest.integration.config.mts` + `__tests__/integration/` helpers exist; zero tests. RLS-vs-code question for wholesale PO flagged INDEX §8.9.

### Implementation approach
1. Post-seed assertions: volumes per INDEX §6; money identity across all completed orders; every listing has an image; approval/status mixes correct.
2. Security: attempt cross-user reads of orders/POs/conversations with an anon+authenticated client to confirm RLS blocks them independently of the code guard.

### Code changes
| File | Change |
|---|---|
| `__tests__/integration/seed-integrity.test.ts`, `rls-security.test.ts` | new |

### Folder structure (this task)
Under `__tests__/integration/`.

### Comment conventions (this task)
Per `integration-testing` skill.

### Acceptance criteria
- [ ] `npm run test:integration` green after `seed:demo`
- [ ] RLS confirmed to block cross-tenant reads (or gaps documented + code-guarded)
- [ ] `npx tsc --noEmit && npm run lint` green

### Testing criteria
- **Engineer:** `npm run test:integration` passes; seed invariants + RLS asserted.
- **Non-technical:** Success = "the demo data is provably correct and users can't see each other's private data."

---

## Task 5.4 — E2E smoke: buyer / seller / admin journeys

### What it is
Playwright journeys over the three headline flows, plus the missing `global-setup.ts` that currently breaks e2e on start.

### Current state (verified)
- `playwright.config.ts:7` references `__e2e__/global-setup.ts` — **does not exist**; `__e2e__/` has only `.gitkeep`; webServer runs `next dev -p 3202`.

### Implementation approach
1. Author `__e2e__/global-setup.ts` (+ teardown) — ensure Supabase up + `seed:demo` (or a smaller e2e seed) before the run.
2. Three specs: buyer browses → adds to cart → checks out (sandbox card) → sees order; seller creates listing → publishes → admin approves → it appears in browse; admin resolves a dispute.
3. Use seeded demo credentials; page objects per the `e2e-testing` skill.

### Code changes
| File | Change |
|---|---|
| `__e2e__/global-setup.ts`, `global-teardown.ts` | new |
| `__e2e__/tests/{buyer,seller,admin}.spec.ts` | new |
| `__e2e__/pages/*` | new — page objects |

### Folder structure (this task)
Under `__e2e__/` per `playwright.config.ts`.

### Comment conventions (this task)
Per `e2e-testing` skill.

### Acceptance criteria
- [ ] `npm run test:e2e` boots the dev server, seeds, and runs the three journeys green
- [ ] `global-setup.ts` resolves (config no longer references a missing file)
- [ ] `npx tsc --noEmit && npm run lint` green

### Testing criteria
- **Engineer:** `npm run test:e2e` passes headless.
- **Non-technical:** Success = "a robot clicks through buying, selling, and admin approval exactly like a user would."

---

## Task 5.5 — Release checklist + per-role demo script

### What it is
The single document the team follows on demo day, and the go/no-go checklist.

### Current state (verified)
- No runbook exists; `NOTES.md`/`BUILD_REPORT.md` list scattered TODOs.

### Implementation approach
1. `docs/ship-roadmap/RUNBOOK-demo.md`: environment setup (env vars, `supabase start`, `seed:demo` on :3202), demo credentials table, and a scripted walkthrough per role (buyer purchase, seller list+get-approved, mechanic inspect, admin moderate+resolve+payout, AI assistant Q&A) with the exact clicks.
2. Release checklist: all suites green, `npm run build` passes, seed verification passes, the §8.1/§8.6 deviations documented for the viva, out-of-scope items (INDEX §8.11) listed so questions are anticipated.
3. `PROGRESS.md` closing summary appended.

### Code changes
| File | Change |
|---|---|
| `docs/ship-roadmap/RUNBOOK-demo.md` | new — demo script + checklist |
| `docs/ship-roadmap/PROGRESS.md` | edit — final summary |

### Folder structure (this task)
Docs only.

### Comment conventions (this task)
Markdown per `.claude/rules/markdown.md`.

### Acceptance criteria
- [ ] Runbook lets someone with no prior context stand up the demo and walk every role
- [ ] Release checklist enumerates green suites, build, seed verification, and documented deviations
- [ ] All internal links resolve

### Testing criteria
- **Engineer:** a teammate follows the runbook cold and reaches a working demo.
- **Non-technical:** Success = "anyone on the team can set up and present the full demo by following one page."
