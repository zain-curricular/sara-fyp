# Security Conventions

OWASP-aligned security checklist for the Curricular codebase. Tailored to **Next.js 15 + Supabase + TypeScript** — covers every category a security review agent must check on every PR.

## Severity Framework

| Severity     | Definition                                                  | Example                                    |
| ------------ | ----------------------------------------------------------- | ------------------------------------------ |
| **Critical** | Exploitable now, data breach or RCE likely                  | Hardcoded service role key, SQL injection  |
| **High**     | Exploitable with moderate effort, significant impact        | BOLA/IDOR, auth bypass, XSS in user input  |
| **Medium**   | Exploitable under specific conditions, limited blast radius | Missing rate limit, CSP bypass, CSRF       |
| **Low**      | Defence-in-depth gap, unlikely to be exploited alone        | Verbose error message, missing header      |
| **Info**     | Best practice suggestion, no direct vulnerability           | Deprecated crypto API, outdated dependency |

## OWASP Top 10 Mapping

```
OWASP Category                          Convention File
──────────────────────────────────────  ─────────────────────────────────
A01 Broken Access Control               3-authentication-and-access.md
A02 Cryptographic Failures              4-data-and-cryptography.md
A03 Injection                           2-injection-and-validation.md
A04 Insecure Design                     3-authentication-and-access.md
A05 Security Misconfiguration           5-application-hardening.md
A06 Vulnerable Components               5-application-hardening.md
A07 Auth Failures                       3-authentication-and-access.md
A08 Data Integrity Failures             4-data-and-cryptography.md, 6-supply-chain.md
A09 Logging & Monitoring Failures       5-application-hardening.md
A10 SSRF                                2-injection-and-validation.md
```

## Review Decision Tree

```
Changed file →
├── Accepts user input?        → Check injection (2-injection-and-validation.md)
├── Touches auth/middleware?    → Check auth bypass (3-authentication-and-access.md)
├── Accesses data by ID?       → Check BOLA/IDOR (3-authentication-and-access.md)
├── Handles secrets/PII?       → Check data protection (4-data-and-cryptography.md)
├── Modifies headers/config?   → Check hardening (5-application-hardening.md)
├── Modifies config/build files? → Check supply chain (6-supply-chain.md)
├── Changes .gitignore?        → Check supply chain (6-supply-chain.md)
├── Adds dependency?           → Check supply chain (6-supply-chain.md)
└── Processes external data?   → Check deserialization (5-application-hardening.md)
```

## Codebase Security Architecture

```
Client (Browser)
│
├── Middleware (middleware.ts)
│   ├── Token validation via getUser() — NOT getSession()
│   ├── Role-based routing (teacher/student)
│   ├── MFA enforcement (aal1 → aal2)
│   └── Onboarding gate
│
├── API Routes (app/api/**)
│   ├── authenticateFromRequest() → Bearer token extraction
│   ├── requireTeacherRole() → 403 guard
│   ├── validateRequestBody() → Zod validation
│   ├── checkRateLimit() → Upstash Redis sliding window
│   └── Generic error responses (no internal leakage)
│
├── Services (lib/features/**/services/)
│   ├── Business logic + orchestration
│   └── Return-based error propagation
│
├── Data Access (services/_data-access/)
│   ├── Supabase client with RLS
│   ├── Admin client (bypasses RLS — restricted use)
│   └── { data, error } return pattern
│
└── Database (Supabase PostgreSQL)
    ├── Row Level Security on all tables
    ├── Storage policies (path-based ownership)
    └── Cascading deletes via triggers
```

## Key Security Infrastructure

| Component                   | Location                           | Purpose                               |
| --------------------------- | ---------------------------------- | ------------------------------------- |
| `authenticateFromRequest()` | `lib/auth/auth.ts`                 | Bearer token validation → user object |
| `requireTeacherRole()`      | `lib/auth/auth.ts`                 | Role guard returning 403              |
| `validateRequestBody()`     | `lib/utils/validateRequestBody.ts` | Zod safeParse + pre-built 400         |
| `checkRateLimit()`          | `lib/utils/rateLimit.ts`           | Upstash Redis sliding window          |
| `serializeError()`          | `lib/utils/errorSerialization.ts`  | Safe error serialization for logging  |
| `insertSecurityEvent()`     | `lib/features/users/services/`     | Audit trail (fire-and-forget)         |
| `escapeTypst()`             | `lib/features/export/services/`    | Template injection prevention         |
| `sanitizeFilename()`        | Upload utilities                   | Path traversal prevention             |
| Admin client                | `lib/supabase/clients/adminClient` | RLS bypass — **audit every usage**    |
| Security headers            | `next.config.ts`                   | HSTS, X-Frame-Options, CSP, etc.      |

## Files

[Injection & Validation](./2-injection-and-validation.md) → [Authentication & Access](./3-authentication-and-access.md) → [Data & Cryptography](./4-data-and-cryptography.md) → [Application Hardening](./5-application-hardening.md) → [Supply Chain](./6-supply-chain.md)
