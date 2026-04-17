# Integration Testing

Integration tests validate that our **data-access layer** communicates correctly with a real Supabase database. They are the foundation of our test pyramid — if the DB contract is wrong, no amount of unit-level mocking will catch it.

## Overview

### What Gets Integration Tested

**Data-access functions only** — the `_data-access/` files in each feature module. These are the functions that build and execute Supabase queries.

```
lib/features/
├── classes/services/_data-access/       ← Integration tested
├── assignments/assignments/services/_data-access/  ← Integration tested
├── assignments/marking/services/_data-access/      ← Integration tested
├── profiles/_services/                  ← Integration tested
└── ...
```

### What Does NOT Get Integration Tested

- API route handlers — [API integration tested](../4-api-testing/1-api-integration-tests.md) (real DB, mocked JWT only)
- Pure utility functions — unit tested (no mocking needed)
- Service orchestrators — unit tested (mock the data-access layer)
- UI components — unit tested (mock hooks/fetch)

### Why Real Database Queries

The data-access layer is the **contract between our app and the database**. These tests verify:

- Queries return the expected shape
- Filters, joins, and ordering work correctly
- Schema names and table names are correct
- RPC function calls behave as expected
- Insert/update/delete operations persist correctly

---

## Environment

Integration tests run against **whichever Supabase instance the environment variables point to**:

| Context           | Database                           | How                              |
| ----------------- | ---------------------------------- | -------------------------------- |
| **Local dev**     | Local Docker (`supabase start`)    | `.env` loaded automatically      |
| **PR CI**         | Ephemeral Docker in GitHub Actions | `supabase start` in the workflow |
| **Post-merge CI** | Real staging Supabase              | Staging secrets in GitHub        |

The tests are **environment-agnostic** — same test code, different database target.

### Prerequisites

```bash
# Local development
supabase start          # Spin up local instance
npm run test:integration  # Run all integration tests
```

---

## Next

- [Seed Functions](./2-shared-seed-functions.md) — how seed/cleanup helpers work
- [Writing Integration Tests](./3-writing-integration-tests.md) — file placement, test structure, conventions
