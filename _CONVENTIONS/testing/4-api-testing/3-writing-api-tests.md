# Writing API Tests

A guide for writing API integration tests that exercise route handlers against a real database.

---

## Where to Put API Tests

API tests live **directly next to the route file** — no `__tests__/` folder. Each API route directory contains only one source file (`route.ts`), so there's no ambiguity.

### Examples

```
app/api/classes/
├── route.ts
└── route.api.test.ts

app/api/classes/[classId]/
├── route.ts
└── route.api.test.ts
```

### Rules

- **Co-located with the route** — `route.api.test.ts` sits next to `route.ts` in the same directory
- **One API test file per route file** — `route.ts` gets `route.api.test.ts`
- The `*.api.test.ts` pattern is picked up by `vitest.api.config.ts` and excluded from the unit test config

---

## Architecture

### Direct Handler Invocation

Next.js App Router handlers are plain async functions: `(Request, context?) => Response`. Call them directly — no HTTP server, no framework emulation:

```typescript
import { GET, POST } from "./route";

const response = await GET(request);
const body = await response.json();
```

### Seeding & Cleanup

API tests reuse the same seed/cleanup helpers as DAL integration tests. Each file seeds its own data in `beforeAll` and cleans up in `afterAll`. See [Shared Seed Functions](../2-integration-testing/2-shared-seed-functions.md) for the full architecture.

**Key points for API tests:**

- **Import from the barrel** — `import { seedUser, seedClass, cleanupUser, cleanupClass } from "../../../../__tests__/integration"`
- **Seed functions have dummy defaults** — you only pass relational IDs and fields the test cares about
- **Relational IDs are required** — `seedClass` requires `teacher_id`, `seedAssignment` requires `teacher_id` + `class_id`, etc.
- **Cleanup in reverse creation order** — respects foreign key constraints

```
Seed order:    user → class → assignment → question
Cleanup order: question → assignment → class → user
```

**Common entity chains for API tests:**

```typescript
// Classes route — just a teacher + class
teacher = await seedUser({ role: "teacher" });
testClass = await seedClass({ teacher_id: teacher.id });

// Assignments route — teacher + class + assignment
teacher = await seedUser({ role: "teacher" });
testClass = await seedClass({ teacher_id: teacher.id });
assignment = await seedAssignment({
    teacher_id: teacher.id,
    class_id: testClass.id,
});

// Authorization tests — two teachers, one class
owner = await seedUser({ role: "teacher" });
otherTeacher = await seedUser({ role: "teacher" });
ownerClass = await seedClass({ teacher_id: owner.id });
```

**Write operations create new data** — track IDs for cleanup:

```typescript
describe("POST /api/classes", () => {
    const createdIds: string[] = [];

    afterAll(async () => {
        for (const id of createdIds) await cleanupClass(id);
    });

    it("should create a class", async () => {
        // ...
        createdIds.push(body.data.id);
    });
});
```

---

## Request Builder

**Location:** `__tests__/api/requestBuilder.ts`

```typescript
/** Build a GET request */
export function buildRequest(path: string, options?: RequestInit): Request {
    return new Request(`http://localhost${path}`, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    });
}

/** Build a request with a JSON body (POST, PATCH, PUT) */
export function buildJsonRequest(
    path: string,
    body: unknown,
    method: string = "POST",
): Request {
    return buildRequest(path, { method, body: JSON.stringify(body) });
}
```

### Handling Parameterized Routes

Next.js 15+ uses `Promise<{ param: string }>` for route params:

```typescript
const response = await GET(buildRequest("/api/classes/abc-123"), {
    params: Promise.resolve({ classId: testClass.id }),
});
```

> The URL path is for construction only — the handler reads the ID from `params`. Always use the real seeded ID in the params object.

---

## Test File Structure

```typescript
// route.api.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
    seedUser,
    seedClass,
    cleanupUser,
    cleanupClass,
} from "../../../../__tests__/integration"; // relative from test file location
import {
    mockAuthenticatedUser,
    mockUnauthenticated,
    buildRequest,
    buildJsonRequest,
} from "../../../../__tests__/api"; // relative from test file location
import { GET, POST } from "./route";

// ── Seed Data ─────────────────────────────────────────
let teacher: SeededUser;
let testClass: ClassRow;

beforeAll(async () => {
    teacher = await seedUser({ role: "teacher" });
    testClass = await seedClass({ teacher_id: teacher.id });
});

afterAll(async () => {
    await cleanupClass(testClass.id);
    await cleanupUser(teacher.id);
});

// ── GET /api/classes ──────────────────────────────────
describe("GET /api/classes", () => {
    it("should return 401 when not authenticated", async () => {
        mockUnauthenticated();

        const response = await GET(buildRequest("/api/classes"));

        expect(response.status).toBe(401);
    });

    it("should return classes for the authenticated teacher", async () => {
        mockAuthenticatedUser(teacher.id, "teacher");

        const response = await GET(buildRequest("/api/classes"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.ok).toBe(true);
        expect(body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: testClass.id }),
            ]),
        );
    });
});

// ── POST /api/classes ─────────────────────────────────
describe("POST /api/classes", () => {
    const createdIds: string[] = [];

    afterAll(async () => {
        for (const id of createdIds) await cleanupClass(id);
    });

    it("should return 400 with invalid body", async () => {
        mockAuthenticatedUser(teacher.id, "teacher");

        const response = await POST(
            buildJsonRequest("/api/classes", { class_name: "" }),
        );
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.ok).toBe(false);
    });

    it("should create a class and return 201", async () => {
        mockAuthenticatedUser(teacher.id, "teacher");

        const response = await POST(
            buildJsonRequest("/api/classes", {
                class_name: "API Test Class",
                subject: "Mathematics",
                year_group: "Year 11",
                graduation_year: 2027,
            }),
        );
        const body = await response.json();

        expect(response.status).toBe(201);
        expect(body.ok).toBe(true);
        expect(body.data.class_name).toBe("API Test Class");

        createdIds.push(body.data.id);
    });
});
```

---

## Conventions

- **One `describe` per HTTP method** — `"GET /api/classes"`, `"POST /api/classes"`, `"GET /api/classes/[classId]"`
- **Test names** describe behavior — same conventions as [General Best Practices](../4-general-best-practices.md#naming)
- **Auth setup** — per test when testing multiple scenarios, in `beforeAll` when all tests share one user
- **Cleanup for writes** — POST/PATCH tests track created IDs in an array, clean up in `afterAll`
- **Always assert status + envelope** — `response.status` and `body.ok` together

---

## Running

```bash
npm run test:api              # All API integration tests
npm run test:api -- route.api # Single file
```

See [Vitest Config](../2-vitest-config.md) for full configuration details and CI workflows.

---

## Next

- [API Test Best Practices](./4-api-test-best-practices.md) — isolation, assertions, anti-patterns
