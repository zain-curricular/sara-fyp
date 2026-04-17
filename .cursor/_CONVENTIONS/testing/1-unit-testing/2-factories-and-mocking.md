# Factories & Mocking

Unit tests use two kinds of shared infrastructure: **factories** for typed test data and **mocking patterns** for isolating the layer under test.

> **The rule:** Factories provide the data shapes. `vi.mock()` isolates the layer boundaries.

---

## Data Factories (`__tests__/factories/`)

Plain object factories that return **typed data shapes**. They do **not** touch the database — that's what [seed functions](../2-integration-testing/2-shared-seed-functions.md) are for.

### File Structure

```
__tests__/factories/
├── index.ts               # Barrel — re-exports all factories
├── usersFactory.ts        # createMockUser(), createMockAuthResponse()
└── classesFactory.ts      # createMockClass()
```

**One file per entity.** File names follow the pattern `{entity}Factory.ts`.

### Pattern

Every factory follows the **overrides pattern** — sensible defaults for all fields, with optional overrides for test-specific values:

```typescript
export function createMockClass(overrides?: Partial<ClassRow>): ClassRow {
    return {
        id: crypto.randomUUID(),
        class_name: "Test Class",
        subject: "Mathematics",
        exam_board: "AQA",
        exam_level: "GCSE",
        year_group: "Year 11",
        teacher_id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...overrides,
    };
}
```

**Key points:**

- Return the **full database row type** (`ClassRow`, not `Partial<ClassRow>`)
- Defaults are **boring and predictable** — tests override only what they care about
- Use `crypto.randomUUID()` for IDs — unique per call, no counter state to manage

### What Gets a Shared Factory

Only entities used across **3+ test files**. Everything else is created inline.

**Shared (lives in `factories/`):**

- `createMockUser()` — Supabase auth user shape
- `createMockAuthResponse()` — `{ data: { user }, error: null }` wrapper
- `createMockClass()` — `classroom.classes` row

**Inline in test files:**

- `Request` objects — `new Request(url, { method, headers, body })` is already clear in 2-3 lines; no factory needed
- Agent-specific context objects
- Any shape only one or two test files need

### Auth Factories

Auth mocking is common enough to warrant dedicated helpers:

```typescript
// Creates a mock Supabase User object
export function createMockUser(overrides?: Partial<User>): User {
    return {
        id: crypto.randomUUID(),
        email: "test@example.com",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

// Wraps a user in the shape returned by supabase.auth.getUser()
export function createMockAuthResponse(user: User): {
    data: { user: User };
    error: null;
} {
    return {
        data: { user },
        error: null,
    };
}
```

### Request Objects

Route handler tests need `Request` objects. Construct these **inline** — they're simple enough that a factory adds indirection without value:

```typescript
// GET with auth
const request = new Request("http://localhost/api/classes", {
    headers: { Authorization: `Bearer ${token}` },
});

// POST with body and auth
const request = new Request("http://localhost/api/classes", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ class_name: "History" }),
});
```

---

## Mocking Patterns

### Module Mocking with `vi.mock()`

The primary pattern for isolating layers. Mock the module, then control return values per test:

```typescript
import { vi } from "vitest";
import { getClassesForTeacher } from "../_data-access/teacherDafs";

// Mock the entire module — all exports become vi.fn()
vi.mock("../_data-access/teacherDafs");

// Type the mock for autocomplete
const mockGetClasses = vi.mocked(getClassesForTeacher);

// Per-test control
it("should return classes", async () => {
    mockGetClasses.mockResolvedValueOnce({
        data: [createMockClass()],
        error: null,
    });
    // ... test the layer above
});
```

**Convention:** Always use `vi.mocked()` to get proper typing on mock functions.

### What to Mock Per Layer

| Layer Under Test      | Mock These Imports                                          |
| --------------------- | ----------------------------------------------------------- |
| **API route**         | `@/lib/features/{feature}/services` (auth + services)       |
| **Composite service** | `../_data-access/{file}` (data-access functions)            |
| **Feature auth**      | `@/lib/auth/auth` (generic auth) + `../_data-access/{file}` |
| **Pure function**     | Nothing                                                     |

### Mock Return Shapes

Match the real function's return type. Most data-access functions return Supabase tuples:

```typescript
// Success
mockGetAssignment.mockResolvedValueOnce({
    data: createMockAssignment({ teacher_id: testUser.id }),
    error: null,
});

// Not found
mockGetAssignment.mockResolvedValueOnce({
    data: null,
    error: null,
});

// Database error
mockGetAssignment.mockResolvedValueOnce({
    data: null,
    error: { message: "connection refused", code: "PGRST301" },
});
```

Auth functions return discriminated unions:

```typescript
// Success
mockAuthenticateAndAuthorize.mockResolvedValueOnce({
    user: { id: testUser.id },
    assignment: createMockAssignment(),
    error: null,
});

// Unauthorized
mockAuthenticateAndAuthorize.mockResolvedValueOnce({
    user: null,
    assignment: null,
    error: NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
    ),
});
```

---

## Server-Only Mock

The `server-only` npm package throws when imported outside a server context. Vitest aliases it to an empty stub:

```
__tests__/mocks/server-only.ts    ← empty export {}
```

**Configured in:** `vitest.config.ts` under `resolve.alias`. No per-test setup needed — it's automatic.

---

## Next

- [Writing Unit Tests](./3-writing-unit-tests.md) — file placement, test structure, conventions
