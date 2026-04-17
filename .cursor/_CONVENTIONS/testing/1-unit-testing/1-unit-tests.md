# Unit Testing

Unit tests validate **logic above the data-access layer** — service orchestrators, auth utilities, and pure functions. They mock all data so they run fast, with no database required.

> **Note:** API route handlers are **no longer unit tested**. They are covered by [API integration tests](../4-api-testing/1-api-integration-tests.md) which exercise the full request path against a real database. Existing route unit tests (`route.test.ts`) are being retired incrementally — see [migration guide](../4-api-testing/4-api-test-best-practices.md#migration-from-unit-tests).

## Overview

### What Gets Unit Tested

Services, auth utilities, and pure functions — everything **except** data-access functions and route handlers.

```
lib/features/
├── {feature}/services/_utils/          ← Unit tested (composite services)
├── {feature}/services/_auth/           ← Unit tested (authorization logic)
├── {feature}/services/_pipeline/       ← Unit tested (AI orchestrators)
├── {feature}/_utils/                   ← Unit tested (pure transforms)
└── {feature}/services/_data-access/    ← Integration tested (NOT unit tested)

app/api/
└── {route}/route.ts                    ← API integration tested (NOT unit tested)

lib/auth/
└── auth.ts                             ← Unit tested (token parsing + auth)

lib/utils/
└── validateRequestBody.ts              ← Unit tested (validation logic)
```

### What Does NOT Get Unit Tested

- **Data-access functions** — [integration tested](../2-integration-testing/1-integration-tests.md) against a real DB
- **API route handlers** — [API integration tested](../4-api-testing/1-api-integration-tests.md) against a real DB
- **Supabase client configuration** — infrastructure, not logic
- **Type definitions and schemas** — no runtime behavior to test

### Why Mock the Layer Below

Each layer mocks its direct dependencies so tests isolate the logic **in that layer only**:

| Layer Under Test      | What It Mocks         | What It Validates                                   |
| --------------------- | --------------------- | --------------------------------------------------- |
| **Composite service** | Data-access functions | Validation, orchestration, error branching          |
| **Auth utility**      | Supabase `getUser()`  | Token extraction, ownership checks, error responses |
| **Pure function**     | Nothing               | Input → output transformation                       |

---

## Test Layers

### Composite Services

Service orchestrators that coordinate multiple data-access calls with business logic. These use `Promise.all()` for parallel fetches and discriminated unions for type-safe error handling.

**Mock targets:** all data-access imports (`getQuestion()`, `getAssignmentOwner()`, etc.)

### Auth Utilities

Two levels of auth — generic token validation and feature-specific ownership checks. Both return discriminated union results.

**Mock targets:** `authenticateFromRequest()` (for feature auth), Supabase `getUser()` (for generic auth)

### Pure Functions

No mocking needed. Pass data in, assert the output. Test edge cases and fallback logic.

---

## Environment

Unit tests run **everywhere** with no external dependencies:

| Context       | Database    | Speed                        |
| ------------- | ----------- | ---------------------------- |
| **Local dev** | None needed | Fast (< 1 second per file)   |
| **PR CI**     | None needed | Runs before `supabase start` |

**Configuration:** `vitest.config.ts` — see [Vitest Config](../2-vitest-config.md) for full details.

---

## Next

- [Factories & Mocking](./2-factories-and-mocking.md) — shared test data and mock patterns
- [Writing Unit Tests](./3-writing-unit-tests.md) — file placement, test structure, conventions
