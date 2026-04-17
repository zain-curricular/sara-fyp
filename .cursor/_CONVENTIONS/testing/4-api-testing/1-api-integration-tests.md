# API Integration Testing

API integration tests validate the **full vertical slice** of an API request: route handler → auth → validation → service → DAL → DB → response. Only JWT verification is mocked — everything else runs against a real Supabase instance.

**This layer replaces unit tests for API routes.** Route unit tests mock all services, which means they can't catch wiring bugs between layers. API integration tests exercise the real code path, making them strictly better for route-level coverage.

## What Gets API Integration Tested

**Route handlers only** — the `route.ts` files in `app/api/`.

```
app/api/
├── classes/route.ts                    ← API integration tested
├── classes/[classId]/route.ts          ← API integration tested
├── assignments/route.ts                ← API integration tested
├── assignments/[assignmentId]/route.ts ← API integration tested
└── ...
```

### What Does NOT Get API Integration Tested

- **Data-access functions** — [DAL integration tested](../2-integration-testing/1-integration-tests.md) (already covered)
- **Pure utility functions** — [unit tested](../1-unit-testing/1-unit-tests.md) with no mocking
- **Service orchestrators** — unit tested with mocked DAL (exercised indirectly by API tests, but still get dedicated unit tests for complex branching)
- **UI components** — unit tested with mocked hooks

## The Mock Boundary

Only **one thing** is mocked: `authenticateFromRequest()` — the JWT verification function. Everything downstream runs real:

| Layer                                          | Mocked? | Why                                               |
| ---------------------------------------------- | ------- | ------------------------------------------------- |
| `authenticateFromRequest()`                    | **Yes** | JWT verification requires Supabase Auth internals |
| `requireTeacherRole()`                         | No      | Reads from the mock auth result — runs real       |
| `authenticateAndAuthorize*()` ownership checks | No      | Hits real DB to verify resource ownership         |
| `validateRequestBody()` (Zod)                  | No      | Validates real payloads                           |
| Service functions                              | No      | Business logic runs against real data             |
| Data-access functions                          | No      | Real Supabase queries against real DB             |

> **The principle:** mock the authentication boundary (proving _who you are_), but let authorization (proving _what you can access_) run real against seeded DB data.

See [Auth Helpers](./2-auth-helpers.md) for the mocking implementation.

## What API Integration Tests Catch

| Bug Category                        | Old Route Unit Tests | API Integration Tests           |
| ----------------------------------- | -------------------- | ------------------------------- |
| Auth/authorization misconfiguration | Partially (mocked)   | **Yes (real ownership checks)** |
| Zod validation mismatches           | No (schema mocked)   | **Yes**                         |
| Service orchestration bugs          | No (services mocked) | **Yes**                         |
| Response envelope shape             | Partially            | **Yes**                         |
| Error status code mapping           | Partially            | **Yes**                         |
| DAL query correctness               | No                   | **Yes**                         |

---

## Environment

Same as [DAL integration tests](../2-integration-testing/1-integration-tests.md#environment) — tests run against whichever Supabase instance the environment variables point to (local Docker, ephemeral CI, or staging).

```bash
# Local development
supabase start        # Spin up local instance
npm run test:api      # Run all API integration tests
```

---

## Next

- [Auth Helpers](./2-auth-helpers.md) — auth mocking strategy and helpers
- [Writing API Tests](./3-writing-api-tests.md) — file placement, test structure, conventions
