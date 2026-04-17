# Validation & Input Handling

All data crossing the HTTP boundary is untrusted. Validate everything before passing to services.

## Validation Order

```
Auth → Extract path params → Validate path params → Parse body/query → Zod safeParse → Delegate
```

## Body Validation

Use `validateRequestBody` for all POST/PATCH/PUT/DELETE bodies:

```typescript
import {
    validateRequestBody,
    isValidationError,
} from "@/lib/utils/validateRequestBody";

const body = await request.json().catch(() => ({}));
const validation = validateRequestBody(body, createClassSchema);
if (isValidationError(validation)) return validation.error;
```

- **Always `.safeParse()`** via `validateRequestBody` — never `.parse()`
- **Catch `request.json()` failures** — `.catch(() => ({}))` converts malformed JSON to empty object that fails Zod
- **Schemas** live in `lib/features/{feature}/_types/schemas.ts` (route-specific schemas can be inline)
- **Never use `as` assertions** on request data — validate with Zod instead

## Query Parameters

Query params are strings — validate and transform through Zod:

```typescript
const { searchParams } = new URL(request.url);
const queryResult = schema.safeParse(Object.fromEntries(searchParams));
if (!queryResult.success)
    return NextResponse.json(
        { ok: false, error: "Invalid query parameters" },
        { status: 400 },
    );
```

**Common patterns:**

- Enums: `z.enum(["draft", "processing", "ready"]).optional()`
- Pagination: `z.coerce.number().int().min(1).max(100).default(20)`
- UUIDs: `z.string().uuid("Invalid ID format")`
- Booleans: `z.enum(["true", "false"]).transform(v => v === "true").optional()`

**Rules:**

- Every query param goes through a Zod schema — no raw `searchParams.get()` for business logic
- Use `z.coerce` for numeric params
- Set `.max()` on pagination to prevent resource exhaustion

## Path Parameters

- UUIDs validated implicitly — Supabase rejects non-UUIDs, auth wrappers catch the error
- Non-UUID params (join codes, slugs): validate format explicitly with Zod
- Never interpolate path params into raw SQL without validation

## Array/Batch Bounds

**Every `z.array()` in a request schema must have `.max()`.**

```typescript
// ✅ Bounded
ids: z.array(z.string().uuid()).min(1).max(50);
```

| Operation                | Max | Rationale               |
| ------------------------ | --- | ----------------------- |
| Batch delete             | 50  | UI page size            |
| Batch update (questions) | 100 | One assignment's worth  |
| File upload batch        | 10  | Practical limit         |
| ID lookup arrays         | 100 | Single-page aggregation |

Return **400** for oversized arrays (not 413).

## Storage Path Validation

Validate storage paths against expected prefix to prevent traversal and cross-tenant access:

```typescript
const expectedPrefix = `assignments/${userId}/${assignmentId}/submissions/`;
if (!document_url.startsWith(expectedPrefix))
    return NextResponse.json(
        { ok: false, error: "Invalid document path" },
        { status: 400 },
    );
```

- Include user ID and resource ID in expected prefix
- Never pass unvalidated paths to storage operations
