# Authentication & Access Control

Covers **OWASP A01 (Broken Access Control)**, **A04 (Insecure Design)**, and **A07 (Authentication Failures)**. The most common vulnerability class in web applications.

---

## Authentication Bypass

**Severity: Critical**

### What to Check

- API routes missing `authenticateFromRequest()` call
- Routes using `getSession()` instead of `getUser()` (session can be stale/forged)
- Middleware exclusions that accidentally expose protected routes
- Public endpoints that should be authenticated

### Codebase Context

Authentication uses **Supabase Auth with server-side token validation**. The middleware validates tokens on every request, and API routes re-validate via `authenticateFromRequest()`.

```typescript
// ❌ Auth bypass — missing authentication
export async function POST(request: Request) {
    const body = await request.json();
    await createResource(body); // No auth check!
}

// ❌ Auth bypass — using session instead of user
const {
    data: { session },
} = await supabase.auth.getSession();
// Session may be stale — no server-side validation

// ✅ Correct — authenticate first, fail fast
export async function POST(request: Request) {
    const authResult = await authenticateFromRequest(request);
    if (authResult.error) return authResult.error; // 401
    // ... proceed with auth.user
}
```

### Checklist

- [ ] Every API route calls `authenticateFromRequest()` as its **first operation**
- [ ] No route uses `getSession()` — always `getUser()` which validates with the auth server
- [ ] Middleware matcher doesn't accidentally exclude protected paths
- [ ] Public routes (verification, password reset) are **explicitly intentional** and rate-limited
- [ ] No authentication logic in client-side code that bypasses server validation

---

## Broken Object-Level Authorization (BOLA / IDOR)

**Severity: High**

### What to Check

- Routes that accept resource IDs without verifying ownership
- Direct database queries filtered only by resource ID (missing user scope)
- Nested resource access without verifying parent ownership chain
- Enumerable/sequential IDs that allow brute-force discovery

### Codebase Context

The ownership verification pattern: **authenticate → verify role → verify ownership → proceed**.

```typescript
// ❌ BOLA — no ownership check
export async function GET(request: Request, { params }: RouteParams) {
    const { id } = await params;
    const { data } = await getAssignment(id); // Any authenticated user can read any assignment
    return NextResponse.json({ ok: true, data });
}

// ✅ Correct — full auth chain
export async function GET(request: Request, { params }: RouteParams) {
    const { assignmentId } = await params;
    const auth = await authenticateAndAuthorizeAssignment(
        request,
        assignmentId,
    );
    if (auth.error) return auth.error; // 401, 403 (as 404), or 404
    // auth.assignment is guaranteed to belong to auth.user
}
```

### Ownership Verification Patterns

| Resource Type    | Verification Method                                                   |
| ---------------- | --------------------------------------------------------------------- |
| Class            | `authenticateAndAuthorizeClass(request, classId)`                     |
| Assignment       | `authenticateAndAuthorizeAssignment(request, assignmentId)`           |
| Submission       | Verify assignment ownership → verify submission belongs to assignment |
| Nested resource  | Walk the ownership chain from leaf to root                            |
| Collection query | Scope by `auth.user.id` in the WHERE clause                           |

### Checklist

- [ ] Every route accepting a resource ID verifies the authenticated user owns it
- [ ] Collection endpoints filter by `auth.user.id` — never return all records
- [ ] Nested resources verify the full parent chain (submission → assignment → teacher)
- [ ] 404 returned for both "not found" and "not authorised" (prevents enumeration)
- [ ] UUIDs used for resource identifiers (not sequential integers)
- [ ] No direct database queries bypassing ownership checks

---

## Privilege Escalation

**Severity: Critical**

### What to Check

- Role changes without re-authentication
- Teacher-only operations accessible to students
- Admin client usage without strict justification
- Role checks in middleware but missing from API route

### Codebase Context

Two roles: **teacher** and **student**. Middleware enforces route-level separation (`/teacher/*` vs `/student/*`). API routes enforce via `requireTeacherRole()`.

```typescript
// ❌ Privilege escalation — no role check on mutation
export async function POST(request: Request) {
    const authResult = await authenticateFromRequest(request);
    if (authResult.error) return authResult.error;
    // Student can call this teacher-only endpoint!
    await createAssignment(authResult.user.id, body);
}

// ✅ Correct — role guard after auth
export async function POST(request: Request) {
    const authResult = await authenticateFromRequest(request);
    if (authResult.error) return authResult.error;

    const roleCheck = requireTeacherRole(authResult);
    if (roleCheck.error) return roleCheck.error; // 403

    await createAssignment(authResult.user.id, body);
}
```

### Checklist

- [ ] Teacher-only routes call `requireTeacherRole()` after authentication
- [ ] No role stored in client-side state that can be tampered with
- [ ] Admin client (`adminClient.ts`) usage is audited — only for server-side operations that **must** bypass RLS
- [ ] Role changes require re-authentication (not just a flag update)
- [ ] Middleware role checks AND API route role checks are both present (defence in depth)

---

## Session & Token Security

**Severity: High**

### What to Check

- Token storage mechanism (cookies vs localStorage)
- Token expiration and refresh logic
- Session fixation vulnerabilities
- Token leakage in URLs, logs, or error messages

### Codebase Context

Supabase SSR handles token lifecycle — tokens stored in **HTTP-only cookies** with automatic refresh via middleware.

### Checklist

- [ ] Tokens never stored in `localStorage` or `sessionStorage`
- [ ] Tokens never included in URL parameters or query strings
- [ ] Token values never logged — use user ID for log correlation
- [ ] Refresh token rotation enabled (Supabase default)
- [ ] Cookie attributes set correctly: `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] MFA enforcement in middleware for users with enrolled factors

---

## Cross-Site Request Forgery (CSRF)

**Severity: Medium**

### What to Check

- State-changing operations (POST, PUT, DELETE) without CSRF protection
- Cookie-based auth without `SameSite` attribute
- Forms that submit cross-origin

### Codebase Context

The codebase uses **Bearer token auth via Authorization header** for API routes, which is inherently CSRF-resistant (browsers don't automatically attach the header). Cookie-based auth for SSR pages relies on `SameSite=Lax`.

### Checklist

- [ ] API routes use `Authorization: Bearer` header (not cookie-only auth for mutations)
- [ ] `SameSite` attribute set on all auth cookies (Supabase SSR default)
- [ ] No GET endpoints that trigger side effects (state changes, deletions)
- [ ] Form submissions use client-side fetch with auth header, not native form POST

---

## Row Level Security (RLS)

**Severity: Critical**

### What to Check

- New tables missing RLS policies
- Policies that are too permissive (e.g. `USING (true)`)
- RLS disabled on tables containing user data
- Storage policies missing ownership checks

### Codebase Context

All Supabase tables **must** have RLS enabled. Policies enforce user-scoped access at the database level — the application layer is defence-in-depth.

```sql
-- ❌ Too permissive — any authenticated user can read all rows
CREATE POLICY "Anyone can read" ON assignments.assignments
FOR SELECT TO authenticated USING (true);

-- ✅ Correct — scoped to teacher ownership
CREATE POLICY "Teachers read own assignments" ON assignments.assignments
FOR SELECT TO authenticated USING (teacher_id = auth.uid());
```

### Storage Policies

Storage paths encode ownership: `{bucket}/{teacher_id}/{assignment_id}/{document_type}/{filename}`

```sql
-- ✅ Path-based ownership for uploads
WITH CHECK (
	bucket_id = 'assignments'
	AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Checklist

- [ ] Every new table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] SELECT policies scope to `auth.uid()` ownership
- [ ] INSERT policies verify the inserting user matches the owner column
- [ ] UPDATE/DELETE policies verify ownership before allowing mutation
- [ ] Storage policies enforce path-based ownership (`foldername(name)[1] = auth.uid()`)
- [ ] No `USING (true)` on tables containing user data
- [ ] Policies tested with different user contexts (owner, non-owner, unauthenticated)

---

## Access Control Anti-Patterns

| Anti-Pattern                            | Fix                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| Auth in middleware only, not API routes | Check in **both** — middleware for UX, routes for security |
| 403 response on missing resource        | Return **404** to prevent resource enumeration             |
| Checking role client-side               | Role check in API route with `requireTeacherRole()`        |
| Admin client for convenience            | Only for operations that **must** bypass RLS               |
| Trusting request body for ownership     | Always derive ownership from `auth.user.id`                |
| Shared resource IDs across tenants      | UUID + ownership verification on every access              |
