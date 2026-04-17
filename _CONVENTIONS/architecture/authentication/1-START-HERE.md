# Authentication & Authorization

Two layers: generic identity, then feature-specific resource ownership.

```
Request
  → authenticateFromRequest()        Generic: "who is this user?"
  → authenticateAndAuthorize*()      Feature: "does this user own this resource?"
```

## Generic Auth

**Location:** `src/lib/auth/auth.ts`

Validates Bearer token via `supabase.auth.getUser()` (**never** `getSession()` — can be spoofed). Returns `{ user: { id }, error: null }` or `{ user: null, error: Response }`.

## Resource Authorization

**Location:** Each feature's `services/_auth/` directory.

Wraps generic auth + ownership verification (`resource.teacher_id === userId`) in a single call. Two overloads — **lightweight** (default, fetches `id + teacher_id`) and **full** (fetches complete row when route needs the data):

```typescript
// Lightweight — most routes
const auth = await authenticateAndAuthorizeClass(request, classId);
if (auth.error) return auth.error;

// Full — avoids redundant DB query when route needs the record
const auth = await authenticateAndAuthorizeClass(request, classId, {
    returnFullClass: true,
});
if (auth.error) return auth.error;
const classRecord = auth.classRecord;
```

**Result type** — generic over the resource shape:

```typescript
type ClassAuthResult<TClass = ClassOwner> =
    | { classRecord: TClass; user: { id: string }; error: null }
    | { classRecord: null; user: null; error: Response };
```

## Rules

- **Auth first** — check `auth.error` before reading body, params, or any data
- **Don't inline ownership checks in routes** — always delegate to `authenticateAndAuthorize*()`
- **Collection routes** (no resource ID) use `authenticateFromRequest()` and scope queries by `auth.user.id`
- **Every route authenticates** — no exceptions

## Adding Auth to a New Feature

1. Create `services/_auth/{feature}Auth.ts`
2. Implement `authenticateAndAuthorize[Resource]()` with lightweight/full overloads
3. Export from the feature's `services/index.ts` barrel
