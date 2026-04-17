# Global Lifecycle

The test suite uses **global setup and teardown** to seed all test data and authenticate all specs **once**, before any test runs. This replaces per-spec `beforeAll`/`afterAll` for data creation.

## Execution Flow

```
1. Playwright starts
2. Build app (npm run build && npm run start)
3. Wait for http://localhost:3000
4. GLOBAL SETUP
   ├── Generate runId (UUID prefix)
   ├── Seed all specs (concurrency 5)
   ├── Write manifest.json
   └── Authenticate all specs (concurrency 5)
5. RUN ALL SPECS (fully parallel)
   └── Each spec reads manifest in beforeAll
6. GLOBAL TEARDOWN
   └── Cleanup all specs (concurrency 5, best-effort)
```

## Global Setup (`global-setup.ts`)

Two phases, both rate-limited to **max 5 concurrent** operations (prevents Supabase connection pooler exhaustion and GoTrue overload).

### Phase 1 — Seed All Specs

1. Generates a shared `runId` (first 8 chars of UUID)
2. Imports all `.seed.ts` files from the seed registry (`seeds/index.ts`)
3. Calls `seed(runId)` for each spec — returns test data (IDs, emails, passwords)
4. Writes all returned data to `__e2e__/.playwright/manifest.json`
5. **Aborts the entire test run** if any seed fails

### Phase 2 — Authenticate All Specs

1. For each spec with `email` + `password` in its manifest data (unless `skipAuth: true`):
    - Calls `authenticateHeadless()` — REST API auth, no browser
    - Writes storageState to `__e2e__/.playwright/auth/{specName}.json`
2. Also processes `additionalAuth` array entries (multi-user specs):
    - Writes to `__e2e__/.playwright/auth/{specName}-{suffix}.json`

## Global Teardown (`global-teardown.ts`)

- Reads full manifest from disk
- Calls `cleanup(data)` for each seeded spec (concurrency 5)
- **Best-effort** — logs errors but doesn't fail the test run
- Stale data from crashed runs is handled idempotently by the next run's setup

## The Manifest

The manifest is the bridge between global setup and individual specs.

**Written by:** `global-setup.ts` after all seeds complete
**Read by:** each spec's `beforeAll` via `readManifest(SPEC)`
**Cleaned up by:** `global-teardown.ts` via `readFullManifest()`

```typescript
// Manifest structure
interface ManifestFile {
    runId: string;
    createdAt: string;
    specs: Record<string, Record<string, unknown>>;
}
```

**Path:** `__e2e__/.playwright/manifest.json` (gitignored)

### Reading the Manifest in Specs

```typescript
import { readManifest } from "../../helpers/manifest";

const SPEC = "class-creation";

let m: Record<string, unknown>;

test.beforeAll(async () => {
    m = readManifest(SPEC); // Throws if spec not found in manifest
});

test("example", async ({ classesPage }) => {
    // Access pre-seeded IDs from manifest
    const classId = m.classId as string;
    const email = m.email as string;
});
```

## Concurrency Control

The `pLimit` helper in `helpers/concurrency.ts` is an inline async semaphore (replaces ESM-only `p-limit`):

```typescript
const limit = pLimit(5);
await Promise.allSettled(specs.map((spec) => limit(async () => seed(spec))));
```

**Why concurrency 5?** Higher values exhaust Supabase's connection pooler and overload GoTrue's auth server, causing intermittent failures.

## How to Add a New Spec

When adding a new test, the global lifecycle requires:

1. Create `{feature}.seed.ts` — implements `SpecSeed` interface (see **Seed System**)
2. Create `{feature}.spec.ts` — reads manifest, uses storageState
3. **Register the seed** in `seeds/index.ts` — add static import + entry to the registry array
4. The rest happens automatically — global setup seeds it, authenticates it, teardown cleans it up
