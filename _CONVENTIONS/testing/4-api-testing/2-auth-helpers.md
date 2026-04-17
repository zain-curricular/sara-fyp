# Auth Helpers

API integration tests mock **only** `authenticateFromRequest()` — the function that verifies JWT tokens and returns the caller's identity. Everything else in the auth chain runs real.

---

## Why Mock Auth

`authenticateFromRequest()` calls `supabase.auth.getUser(token)` under the hood. Creating real JWT tokens in tests would be fragile (tied to Supabase internals), slow (network call per test), and unnecessary (we're testing _our_ code, not Supabase's JWT verification).

By mocking this single function, we control _who the caller is_ while letting all downstream authorization run real against seeded DB data.

---

## The `mockAuth` Helper

**Location:** `__tests__/api/mockAuth.ts`

```typescript
import { vi } from "vitest";
import type { UserRoleEnum } from "@/lib/supabase/types";

// ── Mock registration ─────────────────────────────────
// Must be called at module scope BEFORE importing route handlers
vi.mock("@/lib/auth/auth");

import { authenticateFromRequest } from "@/lib/auth/auth";
const mockAuthenticateFromRequest = vi.mocked(authenticateFromRequest);

// ── Helper functions ──────────────────────────────────

/** Mock a successful authentication — user is who they claim to be */
export function mockAuthenticatedUser(
    userId: string,
    role: UserRoleEnum = "teacher",
): void {
    mockAuthenticateFromRequest.mockResolvedValue({
        user: { id: userId, role },
        error: null,
    });
}

/** Mock a failed authentication — no valid token */
export function mockUnauthenticated(): void {
    mockAuthenticateFromRequest.mockResolvedValue({
        user: null,
        error: Response.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 },
        ),
    });
}
```

---

## Usage Patterns

### Shared Auth for a Describe Block

```typescript
import { mockAuthenticatedUser } from "../../../../__tests__/api"; // relative from test file location
import { seedUser, cleanupUser } from "../../../../__tests__/integration"; // relative from test file location

let teacher: SeededUser;

beforeAll(async () => {
    teacher = await seedUser({ role: "teacher" });
    mockAuthenticatedUser(teacher.id, "teacher");
});
```

The mock returns this teacher's real ID — so ownership checks against the DB match the seeded data.

### Switching Users Mid-File

When testing authorized, unauthorized, and forbidden access in the same file, set auth per test:

```typescript
describe("GET /api/classes/[classId]", () => {
    it("should return class for the owner", async () => {
        mockAuthenticatedUser(owner.id, "teacher");
        const response = await GET(request, { params });
        expect(response.status).toBe(200);
    });

    it("should return 403 for a different teacher", async () => {
        mockAuthenticatedUser(otherTeacher.id, "teacher");
        const response = await GET(request, { params });
        expect(response.status).toBe(403);
    });

    it("should return 401 when not authenticated", async () => {
        mockUnauthenticated();
        const response = await GET(request, { params });
        expect(response.status).toBe(401);
    });
});
```

---

## What Runs Real

After `authenticateFromRequest()` returns the mocked user, everything else runs real:

- **`requireTeacherRole()`** — reads the `role` from the mock result, returns 403 if not a teacher
- **`authenticateAndAuthorize*()`** — calls `authenticateFromRequest()` (mocked), then hits the **real DB** for ownership checks
- **Ownership queries** — real Supabase queries verifying the caller owns the resource

This catches real authorization bugs that unit tests missed because ownership was mocked.

---

## Next

- [Writing API Tests](./3-writing-api-tests.md) — file placement, test structure, conventions
