# Writing Integration Tests

A guide for writing integration tests against the data-access layer.

---

## Where to Put Integration Tests

Integration tests live **next to the data-access files they test**, inside a `__tests__/` folder.

### Example

Given a data-access layer with multiple files:

```
lib/features/classes/services/_data-access/
├── sharedDafs.ts
├── studentDafs.ts
├── teacherDafs.ts
└── __tests__/                                    ← add this folder
    ├── sharedDafs.integration.test.ts            ← one test file per source file
    ├── studentDafs.integration.test.ts
    └── teacherDafs.integration.test.ts
```

### Rules

- **Add a `__tests__/` folder** inside the `_data-access/` directory
- **One integration test file per data-access file** — `teacherDafs.ts` gets `teacherDafs.integration.test.ts`
- **File naming:** always `{sourceFileName}.integration.test.ts`
- This keeps tests co-located with the code they verify — no hunting through a separate test directory

---

## Architecture

### Per-File Seeding

Every integration test file **seeds its own data** and **cleans up after itself**. No global fixtures, no shared state between files.

```typescript
import {
    seedUser,
    seedClass,
    cleanupUser,
    cleanupClass,
} from "../../../../../../__tests__/integration";

let testUser: SeededUser;
let testClass: ClassRow;

beforeAll(async () => {
    // Seed: insert real data into the database
    testUser = await seedUser();
    testClass = await seedClass({ teacher_id: testUser.id });
});

afterAll(async () => {
    // Cleanup: reverse order of creation (respects foreign keys)
    await cleanupClass(testClass.id);
    await cleanupUser(testUser.id);
});
```

> **Note:** The relative path depends on file depth. From a typical `_data-access/__tests__/` folder inside a feature module, the path is `../../../../../../__tests__/integration`. Adjust the number of `../` segments based on your test file's location relative to `apps/main/__tests__/`.

**Why per-file?**

- Each file is **fully self-contained** — no hidden dependencies
- A failing file can be re-run in isolation
- Integration tests run **sequentially** (no parallelism), so there is no speed benefit from shared fixtures
- Cleanup failures in one file don't poison other files

### Seed & Cleanup

See [Shared Seed Functions](./2-shared-seed-functions.md) for the full architecture. In short: seed functions have dummy defaults baked in — test files only override relational IDs and test-specific values.

---

## Test File Structure

```typescript
// getClassesForTeacher.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
    seedUser,
    seedClass,
    cleanupUser,
    cleanupClass,
} from "../../../../../../__tests__/integration";
import { getClassesForTeacher } from "../teacherDafs";

describe("getClassesForTeacher", () => {
    let testUser: SeededUser;
    let testClass: ClassRow;

    // ── Seed ──────────────────────────────────────────────
    beforeAll(async () => {
        testUser = await seedUser();
        testClass = await seedClass({ teacher_id: testUser.id });
    });

    // ── Cleanup ───────────────────────────────────────────
    afterAll(async () => {
        await cleanupClass(testClass.id);
        await cleanupUser(testUser.id);
    });

    // ── Tests ─────────────────────────────────────────────
    it("should return classes owned by the teacher", async () => {
        const result = await getClassesForTeacher(testUser.id);

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data![0].class_name).toBe(testClass.class_name);
    });

    it("should return empty array for teacher with no classes", async () => {
        const otherUser = await seedUser();

        const result = await getClassesForTeacher(otherUser.id);

        expect(result.data).toHaveLength(0);
        await cleanupUser(otherUser.id);
    });
});
```

---

## Conventions

- **One describe per function:** Each data-access function gets its own `describe` block
- **Test names:** Describe the expected behavior, not the implementation
- **Inline seed for one-off data:** If a single test needs extra data (like the "other user" above), seed and cleanup inline within that test

---

## Running

See [Vitest Config](../2-vitest-config.md) for all NPM scripts, configuration details, and CI workflows.
