# Query Patterns

## Client & Schema

**Always admin client, always specify schema:**

```typescript
import { admin } from "@/lib/supabase/clients/adminClient";

await admin
    .schema("assignments")
    .from("assignments")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();
```

| Schema        | Tables                                         |
| ------------- | ---------------------------------------------- |
| `assignments` | assignments, questions, submissions, responses |
| `classroom`   | classes, class_enrollments, class_roster       |
| `ai`          | conversations, messages                        |
| `accounts`    | user_profiles                                  |
| `static`      | curriculum reference data                      |

## Selects

Fetch only needed columns — `select("*")` acceptable for detail views only:

```typescript
.select("id, teacher_id")                          // auth — minimal
.select("id, title, status", { count: "exact" })   // list — targeted
.select(`*, question:questions!inner(...)`)         // same-schema join
```

## Row Resolution

| Method           | When                                           |
| ---------------- | ---------------------------------------------- |
| `.maybeSingle()` | Zero or one row — **default for single reads** |
| `.single()`      | Exactly one row (errors if zero/multiple)      |
| _(none)_         | Array of rows                                  |

## Pagination & Filtering

Use `{ count: "exact" }` for totals. Enforce `MAX_PAGE_SIZE`. Build filters conditionally:

```typescript
const limit = Math.min(filters.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
const offset = filters.offset ?? 0;

let query = admin
    .schema("assignments")
    .from("assignments")
    .select("id, title, status", { count: "exact" })
    .order("created_at", { ascending: false });

if (filters.teacher_id) query = query.eq("teacher_id", filters.teacher_id);
if (filters.status) query = query.eq("status", filters.status);

query = query.range(offset, offset + limit - 1);
```

## Cross-Schema Joins

PostgREST can't resolve FK joins across schemas. Use **two queries + Map merge**: query both schemas independently, build a `Map` from the second result, then map over the first to merge. Use `Map` for O(1) lookups, never `.find()`.

## Write Patterns

**RPC** for atomic multi-table operations. Cast JSONB params with `as unknown as Json`:

```typescript
await admin.schema("assignments").rpc("create_assignment_with_questions", {
    p_title: assignment.title,
    p_questions: questions as unknown as Json,
});
```

**Conditional update** for optimistic locking — `.eq()` on mutable column, `.maybeSingle()` returns null if claimed:

```typescript
await admin
    .schema("assignments")
    .from("assignments")
    .update({ status: "processing" })
    .eq("id", assignmentId)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
```

**Upsert** for idempotent writes:

```typescript
await admin
    .schema("ai")
    .from("messages")
    .upsert(rows, { onConflict: "conversation_id,position" });
```
