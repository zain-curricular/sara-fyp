# Shared Test Infrastructure

Infrastructure shared across unit, integration, and API integration tests. Lives in `__tests__/` (at the `apps/main/` root, outside `src/`).

```
__tests__/
├── setup.ts              # Global setup — runs before every test
├── factories/            # Data factories — plain typed objects (unit tests)
│   ├── index.ts
│   ├── usersFactory.ts   # createMockUser(), createMockAuthResponse()
│   └── classesFactory.ts # createMockClass()
├── mocks/
│   └── server-only.ts    # Stub for Next.js "server-only" package
├── integration/          # Seed/cleanup helpers (integration + API tests)
│   ├── index.ts          # Barrel — re-exports all seed/cleanup functions
│   ├── client.ts         # Admin Supabase client
│   ├── seedUser.ts       # seedUser() + cleanupUser()
│   ├── seedClass.ts      # seedClass() + cleanupClass()
│   ├── seedAssignment.ts # seedAssignment() + cleanupAssignment()
│   └── ...               # One file per entity
└── api/                  # API test helpers (API integration tests)
    ├── index.ts          # Barrel — re-exports all API helpers
    ├── mockAuth.ts       # mockAuthenticatedUser(), mockUnauthenticated()
    └── requestBuilder.ts # buildRequest(), buildJsonRequest()
```

---

## Global Setup (`setup.ts`)

Runs before every test file via Vitest's `setupFiles` config.

**Handles:**

- Loads environment variables from `.env` in local dev (skipped in CI — see [Vitest Config](./2-vitest-config.md#environment-variables))
- Imports `@testing-library/jest-dom` matchers
- `beforeEach` — resets to real timers
- `afterEach` — RTL cleanup, clears mocks, restores originals, clears timers

**Convention:** Tests should never need to duplicate this cleanup logic. If you find yourself writing `vi.clearAllMocks()` in an `afterEach`, something is wrong.

---

## Data Factories (`factories/`)

Plain object factories that return typed data shapes — used by **unit tests only**. See [Factories & Mocking](./1-unit-testing/2-factories-and-mocking.md) for the overrides pattern, code examples, and what qualifies for a shared factory.

---

## Server-Only Mock (`mocks/server-only.ts`)

Empty stub for the `server-only` npm package so server modules can be imported in tests. Configured automatically via `vitest.config.ts` — see [Factories & Mocking](./1-unit-testing/2-factories-and-mocking.md#server-only-mock) for details.

---

## Seed & Cleanup Helpers (`integration/`)

Seed + cleanup helpers for inserting real data into the database — used by **DAL integration tests and API integration tests**. See [Shared Seed Functions](./2-integration-testing/2-shared-seed-functions.md) for the full architecture, conventions, and code examples.

---

## API Test Helpers (`api/`)

Auth mocking and request construction helpers — used by **API integration tests only**. See [Auth Helpers](./4-api-testing/2-auth-helpers.md) and [Writing API Tests](./4-api-testing/3-writing-api-tests.md#request-builder) for details.

---

## Next

- [Unit Testing](./1-unit-testing/1-unit-tests.md) — what gets unit tested and why
- [Integration Testing](./2-integration-testing/1-integration-tests.md) — what gets integration tested and why
- [API Integration Testing](./4-api-testing/1-api-integration-tests.md) — what gets API tested and why
