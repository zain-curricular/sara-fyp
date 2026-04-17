# Security & Authorization

## Authentication & Authorization

See Authentication conventions for the full auth pattern (`authenticateFromRequest` + `authenticateAndAuthorize*()`).

## BOLA Prevention

**Every route accepting a resource ID must verify the authenticated user owns it.**

**Patterns:**

- **Resource routes** → use auth+authz wrapper (e.g. `authenticateAndAuthorizeClass(request, classId)`)
- **Collection routes** (no resource ID) → scope query by `auth.user.id`
- **Nested resources** → verify parent ownership (submissions inherit from assignment)
- **Auth failure on specific resource** → return **404** not 403 (hide existence)
- **Mutations** → verify ownership before any write

## Information Disclosure

- Never expose DB errors, stack traces, or internal identifiers in responses
- Error messages describe what the user tried, not why it failed internally
- Zod validation errors are safe to expose (they describe user input)
- Log full errors server-side with `serializeError()`

```typescript
// ❌ Leaks internals
{ ok: false, error: "PostgreSQL error: relation 'classes' not found" }

// ✅ Vague
{ ok: false, error: "Failed to create class" }
```

## Rate Limiting

Authentication endpoints use **per-route rate limiting** via Upstash Redis (`@upstash/ratelimit`) with a sliding window algorithm. The shared utility lives in `lib/utils/rateLimit.ts` and follows the same discriminated union pattern as `validateRequestBody`.

**Usage — 2-line guard clause after obtaining the identifier:**

```typescript
const rateCheck = await checkRateLimit(AUTH_LIMITERS.passwordReset, email);
if (isRateLimited(rateCheck)) return rateCheck.error;
```

**When to add rate limiting:**

- Unauthenticated endpoints that trigger side effects (email sends, account lookups)
- Authenticated endpoints for sensitive/irreversible actions (password change, account deletion)
- Use email as identifier for unauthenticated routes, user ID for authenticated routes

**Graceful degradation:** If Redis is unavailable, requests are allowed through — rate limiting never blocks legitimate users due to infrastructure failure.

## Response Headers

Configure globally via `next.config.js` or middleware:

| Header                      | Value                                 |
| --------------------------- | ------------------------------------- |
| `X-Content-Type-Options`    | `nosniff`                             |
| `X-Frame-Options`           | `DENY`                                |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Cache-Control`             | `no-store`                            |

## CORS

Same-origin only by default. If needed: allowlist specific origins (never `*` on auth endpoints), limit methods, export `OPTIONS` handler.
