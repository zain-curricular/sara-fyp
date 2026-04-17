# Shared Seed Functions

Seed functions are the **only way** integration tests create data. They insert real rows into the database via the admin client, with dummy defaults already baked in.

> **The rule:** Seed functions provide the boring data. Test files provide the relationships and test-specific values.

---

## File Structure

**One file per entity.** Each file exports both the seed and cleanup function for that entity.

```
__tests__/integration/
├── index.ts              # Barrel — re-exports everything
├── seedUser.ts           # seedUser() + cleanupUser()
├── seedClass.ts          # seedClass() + cleanupClass()
├── seedAssignment.ts     # seedAssignment() + cleanupAssignment()
└── ...                   # One file per entity
```

**Why per-entity files?**

- Seed + cleanup for an entity are tightly coupled — changing one usually means changing the other
- When a table schema changes, you edit **one file** instead of hunting through separate `seed.ts` and `cleanup.ts`
- File names match the function names — `seedClass.ts` is immediately discoverable

Test files import from the barrel:

```typescript
import {
    seedUser,
    cleanupUser,
    seedClass,
    cleanupClass,
} from "../../../../../__tests__/integration"; // relative from test file location
```

---

## How They Work

Each seed function:

1. Has **dummy defaults** for every non-relational field (names, subjects, dates, etc.)
2. **Requires** relational IDs as params — these must point to real seeded data
3. Accepts **optional overrides** for anything the test specifically cares about
4. Inserts via the **admin client** (bypasses RLS)
5. Returns the **full inserted row**

Each cleanup function:

1. Lives in the **same file** as its corresponding seed function
2. Deletes by ID via the **admin client**
3. Handles "not found" gracefully — no error if the row was already deleted

---

## Example: `seedClass.ts`

```typescript
// seedClass.ts

import { admin } from "./client";
import type { ClassRow, ClassInsert } from "@/lib/supabase/types";

export async function seedClass(
    overrides: { teacher_id: string } & Partial<ClassInsert>,
): Promise<ClassRow> {
    const defaults = {
        class_name: `Test Class ${Date.now()}`,
        subject: "Mathematics",
        exam_board: "AQA",
        exam_level: "GCSE",
        year_group: "Year 11",
    };

    const { data, error } = await admin
        .schema("classroom")
        .from("classes")
        .insert({ ...defaults, ...overrides })
        .select("*")
        .single();

    if (error) throw new Error(`Failed to seed class: ${error.message}`);
    return data;
}

export async function cleanupClass(classId: string): Promise<void> {
    await admin.schema("classroom").from("classes").delete().eq("id", classId);
}
```

---

## Usage in Test Files

Test files only pass in what matters — relational IDs and fields relevant to the test:

```typescript
import {
    seedUser,
    cleanupUser,
    seedClass,
    cleanupClass,
} from "../../../../../__tests__/integration"; // relative from test file location

// Most tests: just the required relationship
const testClass = await seedClass({ teacher_id: testUser.id });

// Testing subject filtering? Override subject too
const mathsClass = await seedClass({
    teacher_id: testUser.id,
    subject: "Mathematics",
});
const englishClass = await seedClass({
    teacher_id: testUser.id,
    subject: "English",
});

// Everything else uses the seed function's dummy defaults
```

---

## Conventions

### Required vs Optional Params

Use TypeScript to enforce that relational IDs are always provided:

```typescript
// teacher_id is REQUIRED — can't seed a class without a real teacher
// Everything else is optional and falls back to dummy defaults
overrides: { teacher_id: string } & Partial<ClassInsert>

// Both teacher_id and class_id are REQUIRED
overrides: { teacher_id: string; class_id: string } & Partial<AssignmentInsert>
```

### Error Handling

Seed functions **throw on failure**. If a seed fails, the test should fail immediately — not silently continue with `null` data:

```typescript
if (error) throw new Error(`Failed to seed class: ${error.message}`);
```

### Naming

- **Files:** `seedUser.ts`, `seedClass.ts`, `seedAssignment.ts` — always `seed` + entity name
- **Seed functions:** `seedUser()`, `seedClass()`, `seedAssignment()`
- **Cleanup functions:** `cleanupUser()`, `cleanupClass()`, `cleanupAssignment()`
- Seed + cleanup always live in the **same file**

### Cleanup Ordering

Always clean up in **reverse order of creation** to respect foreign key constraints:

```
Seed order:    user → class → assignment → questions → submission
Cleanup order: submission → questions → assignment → class → user
```

---

## Why Not Plain Object Factories?

Integration tests don't use `createMockClass()` style factories because:

- A plain factory returns an object with a random `teacher_id` that **doesn't exist** in the DB
- You'd always have to override the relational fields AND manually write the insert query
- Seed helpers combine "create the data shape" + "insert into DB" in one call
- When a table schema changes (new required column), you update **one seed file** instead of 30 test files
