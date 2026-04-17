# Application Hardening

Covers **OWASP A05 (Security Misconfiguration)**, **A06 (Vulnerable Components)**, **A08 (Data Integrity — deserialization)**, and **A09 (Logging & Monitoring Failures)**.

---

## Security Headers

**Severity: Medium**

### What to Check

- Missing or misconfigured security headers
- CSP in report-only mode (not enforced)
- `unsafe-inline` or `unsafe-eval` in CSP directives
- Missing `X-Frame-Options` or `X-Content-Type-Options`

### Codebase Context

Headers configured in `next.config.ts`. CSP is currently **report-only** — transition to enforcement is pending.

| Header                      | Expected Value                                 | Status         |
| --------------------------- | ---------------------------------------------- | -------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | ✅ Active      |
| `X-Frame-Options`           | `DENY`                                         | ✅ Active      |
| `X-Content-Type-Options`    | `nosniff`                                      | ✅ Active      |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`              | ✅ Active      |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`     | ✅ Active      |
| `Content-Security-Policy`   | Full directive set                             | ⚠️ Report-only |

### CSP Directives to Audit

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' [trusted domains]
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https://*.supabase.co
connect-src 'self' https://*.supabase.co [analytics/ws domains]
frame-ancestors 'none'
object-src 'none'
base-uri 'self'
```

**Known issues:** `unsafe-inline` and `unsafe-eval` in `script-src` weaken XSS protection. Required by Next.js development mode — verify production build strips these.

### Checklist

- [ ] All security headers present in `next.config.ts`
- [ ] No headers removed or weakened in PR
- [ ] CSP directives don't add new `unsafe-*` sources
- [ ] New external domains added to CSP are justified and documented
- [ ] `frame-ancestors 'none'` maintained (clickjacking prevention)
- [ ] No `Access-Control-Allow-Origin: *` on authenticated endpoints

---

## Unsafe Deserialization

**Severity: High**

### What to Check

- `JSON.parse()` on untrusted input without schema validation
- Object spread (`...`) from request body without Zod validation
- Prototype pollution via `__proto__` or `constructor` in parsed objects
- `eval()` or `Function()` on deserialised data

### Codebase Context

Request bodies are parsed with `request.json()` then validated with Zod. The risk is **skipping validation** or **parsing before validating**.

```typescript
// ❌ Unsafe — unvalidated object spread
const body = await request.json();
await supabase.from("assignments").insert(body);

// ❌ Prototype pollution — merging unvalidated input
const config = { ...defaults, ...body };

// ✅ Safe — Zod strips unknown fields
const validation = validateRequestBody(body, createAssignmentSchema);
if (isValidationError(validation)) return validation.error;
await supabase.from("assignments").insert(validation.data);
```

### Checklist

- [ ] All `request.json()` results pass through `validateRequestBody()` with a Zod schema
- [ ] No `Object.assign()` or spread from unvalidated request data
- [ ] Zod schemas use `.strict()` or default strip mode — no extra fields pass through
- [ ] No `eval()`, `Function()`, or `new Function()` on deserialised content
- [ ] No `__proto__`, `constructor`, or `prototype` keys accepted in input schemas

---

## Remote Code Execution (RCE)

**Severity: Critical**

### What to Check

- Dynamic `import()` with user-controlled paths
- `eval()`, `Function()`, `vm.runInContext()` with external input
- Spawning child processes with user-controlled arguments
- Server-side template engines with code execution capabilities

### Codebase Context

No dynamic code execution in the application. The primary RCE surface would be **dependency vulnerabilities** or **AI agent tool misuse**.

### Checklist

- [ ] No `eval()` or `Function()` anywhere in application code
- [ ] No dynamic `import()` with paths derived from user input
- [ ] No `child_process` usage with user-controlled arguments
- [ ] AI agent responses never executed as code
- [ ] Typst rendering sandboxed — no system command access

---

## Race Conditions (TOCTOU)

**Severity: Medium**

### What to Check

- Time-of-check-to-time-of-use gaps in authorization
- Resource creation without uniqueness constraints
- Concurrent requests bypassing rate limits
- Double-spend patterns (submitting twice, processing twice)

### Codebase Context

The main TOCTOU surface is **submission processing** — check if already processed, then process. Database-level constraints (`UNIQUE`, `CHECK`) are the primary defence.

```typescript
// ❌ TOCTOU — check then act without atomic guarantee
const existing = await getSubmission(id);
if (!existing.processed) {
    await processSubmission(id); // Race: two requests pass the check
}

// ✅ Safe — database-level constraint
// Use UNIQUE constraints, row locks, or atomic UPDATE ... WHERE
await supabase
    .from("submissions")
    .update({ processed: true })
    .eq("id", id)
    .eq("processed", false); // Atomic — only one wins
```

### Checklist

- [ ] Uniqueness enforced at database level (`UNIQUE` constraints), not application level
- [ ] Critical state transitions use atomic database operations
- [ ] Rate limiting uses distributed counters (Upstash Redis), not in-memory checks
- [ ] No read-then-write patterns without row-level locks for sensitive operations
- [ ] Idempotency keys for payment or resource creation operations (if applicable)

---

## Dependency Security

**Severity: Medium–High**

### What to Check

- Known vulnerabilities in direct dependencies
- Outdated packages with security patches available
- Unnecessary dependencies increasing attack surface
- Lock file integrity (unexpected changes to `pnpm-lock.yaml`)

### Codebase Context

Monorepo uses **pnpm** with a shared `pnpm-lock.yaml`. Key security-sensitive dependencies:

| Package                       | Purpose             | Risk if Compromised         |
| ----------------------------- | ------------------- | --------------------------- |
| `@supabase/ssr`               | Auth token handling | Authentication bypass       |
| `@supabase/supabase-js`       | Database client     | Data exfiltration           |
| `@upstash/ratelimit`          | Rate limiting       | DDoS amplification          |
| `openai`, `@anthropic-ai/sdk` | AI APIs             | Prompt injection, data leak |
| `resend`                      | Email sending       | Phishing, spam              |
| `zod`                         | Input validation    | Validation bypass           |

### Checklist

- [ ] No known critical/high CVEs in direct dependencies (`pnpm audit`)
- [ ] Lock file changes reviewed for unexpected package additions
- [ ] No `postinstall` scripts in new dependencies that execute arbitrary code
- [ ] Security-sensitive packages pinned to exact versions (not ranges)
- [ ] Unused dependencies removed — smaller surface area

---

## Rate Limiting & DoS Prevention

**Severity: Medium**

### What to Check

- Public endpoints without rate limiting
- Authenticated endpoints for expensive operations without limits
- Rate limit bypass via header manipulation
- Missing rate limits on AI/LLM endpoints (cost amplification)

### Codebase Context

Rate limiting via **Upstash Redis** sliding window. Graceful degradation — if Redis is unavailable, requests pass through.

### Current Limits

| Limiter             | Window | Max Requests | Identifier |
| ------------------- | ------ | ------------ | ---------- |
| `passwordReset`     | 1h     | 3            | email      |
| `verification`      | 1h     | 3            | email      |
| `passwordChange`    | 1m     | 5            | userId     |
| `accountDeletion`   | 1h     | 3            | userId     |
| `emailChange`       | 1h     | 3            | userId     |
| `dataExport`        | 24h    | 1            | userId     |
| `assignmentProcess` | 1h     | 5            | userId     |
| `submissionMark`    | 1h     | 10           | userId     |

### Checklist

- [ ] Public endpoints that trigger side effects (email, SMS) are rate-limited
- [ ] AI/LLM endpoints have per-user rate limits (prevent cost abuse)
- [ ] Rate limit identifier cannot be spoofed (use auth'd userId, not IP alone)
- [ ] Graceful degradation logged and monitored (silent Redis failures)
- [ ] New sensitive endpoints added to `AUTH_LIMITERS` or `AI_LIMITERS`
- [ ] No rate limit solely based on `X-Forwarded-For` (easily spoofed)

---

## Security Logging & Monitoring

**Severity: Medium**

### What to Check

- Authentication failures not logged
- Missing audit trail for sensitive operations
- Log injection via user-controlled values in log statements
- Insufficient logging to detect attack patterns

### Codebase Context

Security events recorded via `insertSecurityEvent()` (fire-and-forget to `accounts.security_events`). Application errors logged with `serializeError()`.

### Events That Must Be Logged

| Event                       | Logger                      | Required Context               |
| --------------------------- | --------------------------- | ------------------------------ |
| Authentication failure      | `console.error`             | IP, user agent, error type     |
| Authorization failure (403) | `console.warn`              | userId, resource, action       |
| Rate limit triggered        | `checkRateLimit` (built-in) | identifier, limiter name       |
| Account deletion            | `insertSecurityEvent`       | userId, IP, user agent         |
| Password change             | `insertSecurityEvent`       | userId, IP                     |
| Email change                | `insertSecurityEvent`       | userId, old email (hashed), IP |
| MFA enrolment/removal       | `insertSecurityEvent`       | userId, factor type            |
| Data export                 | `insertSecurityEvent`       | userId, IP                     |

### Checklist

- [ ] All authentication failures logged with IP and user agent
- [ ] Sensitive operations use `insertSecurityEvent()` for audit trail
- [ ] No user-controlled values in log format strings (log injection)
- [ ] Error logging uses `serializeError()` — never raw `JSON.stringify` on errors
- [ ] No sensitive data (tokens, passwords, PII) in log output
- [ ] New security-sensitive endpoints include appropriate logging

---

## Application Hardening Anti-Patterns

| Anti-Pattern                         | Fix                                                         |
| ------------------------------------ | ----------------------------------------------------------- |
| CSP in report-only permanently       | Transition to enforced mode once violations resolved        |
| Adding `unsafe-eval` to CSP          | Refactor code to avoid `eval()` — use alternatives          |
| Trusting all `node_modules`          | Audit `postinstall` scripts, pin versions, run `pnpm audit` |
| Logging failures silently            | Alert on repeated auth failures, rate limit triggers        |
| Skipping Zod on "internal" endpoints | All endpoints are external — validate everything            |
| Redis failures passing all requests  | Monitor Redis health, alert on degraded rate limiting       |
