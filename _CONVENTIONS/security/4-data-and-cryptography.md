# Data Protection & Cryptography

Covers **OWASP A02 (Cryptographic Failures)** and **A08 (Data Integrity Failures)**. Applies to any code that handles secrets, PII, student data, or cryptographic operations.

---

## Hardcoded Secrets

**Severity: Critical**

### What to Check

- API keys, tokens, passwords, or connection strings in source code
- Secrets in configuration files committed to git
- `.env` files with production credentials in the repository
- Base64-encoded secrets (obfuscation is not encryption)
- Private keys or certificates in source

### Codebase Context

Secrets are managed via `dotenv-vault` — encrypted `.env.vault` file committed, plaintext `.env.local` gitignored. The `DOTENV_KEY` environment variable decrypts at build time.

```typescript
// ❌ Hardcoded secret
const API_KEY = "{your-api-key-here}";

// ❌ Secret in config object
const config = { apiKey: "{your-resend-key-here}" };

// ✅ Environment variable
const API_KEY = process.env.ANTHROPIC_API_KEY;

// ✅ Validated at startup
if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
```

### Secret Patterns to Flag

| Pattern                                   | Severity     |
| ----------------------------------------- | ------------ |
| `sk-`, `sk-ant-`, `sk-proj-`              | **Critical** |
| `re_` (Resend)                            | **Critical** |
| `sb_secret_` (Supabase service role)      | **Critical** |
| `AIzaSy` (Google API)                     | **Critical** |
| `-----BEGIN PRIVATE KEY-----`             | **Critical** |
| `password`, `secret`, `token` as literals | **High**     |
| Base64 strings > 40 chars in source       | **Medium**   |

### Checklist

- [ ] No API keys, tokens, or passwords in source files
- [ ] `.env.local` is in `.gitignore`
- [ ] Only `NEXT_PUBLIC_*` variables are safe for client exposure
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client code
- [ ] Secrets imported via `process.env` only — never imported from config files
- [ ] `server-only` import guard on files accessing secrets

---

## Sensitive Data Exposure

**Severity: High**

### What to Check

- PII (names, emails, phone numbers) in logs, error messages, or API responses
- Student data exposed beyond necessary scope
- Database error messages leaking schema information
- Debug logging in production exposing sensitive context
- Full objects logged instead of selected fields

### Codebase Context

Error responses use **generic messages** (`"Internal server error"`, `"Failed to create resource"`). Detailed errors logged server-side only via `serializeError()`.

```typescript
// ❌ PII in logs
console.error("Failed for user:", user.email, user.name);

// ❌ Full object logged — may contain sensitive fields
console.error("Auth failed:", JSON.stringify(authResult));

// ✅ Safe — only identifiers in logs
console.error("Failed for user:", { userId: user.id });

// ✅ Safe — error serialization strips sensitive data
console.error("Route failed:", { error: serializeError(error) });
```

### Checklist

- [ ] No PII (email, name, phone) in log statements
- [ ] Error responses never contain stack traces, SQL, or internal identifiers
- [ ] API responses return only the fields the client needs (no `SELECT *` leakage)
- [ ] Student data scoped to teacher ownership — never cross-tenant
- [ ] Audit trail (`insertSecurityEvent`) used for sensitive operations
- [ ] `console.log` not used for production logging — structured logging only

---

## Personal Data Handling (GDPR)

**Severity: High**

### What to Check

- New fields collecting personal data without DPIA consideration
- Data stored beyond necessary retention period
- Cross-border data transfers without safeguards
- Third-party services receiving user data without sub-processor agreement

### Codebase Context

GDPR compliance documented in `compliance/`. The codebase handles **children's data** (students) — elevated obligations under UK Children's Code.

### Checklist

- [ ] New personal data fields documented in DPIA (`compliance/dpia/DPIA.md`)
- [ ] Data minimisation — only collect what's necessary for the feature
- [ ] New external service integrations added to sub-processor registry
- [ ] Data export includes new fields (`exportUserData` service)
- [ ] Account deletion cascades to new data (`CASCADE` triggers or explicit cleanup)
- [ ] No student PII sent to AI/LLM APIs without anonymisation

---

## Cryptographic Weaknesses

**Severity: Medium–High**

### What to Check

- Weak hashing algorithms (MD5, SHA-1 for security purposes)
- Insecure random number generation (`Math.random()` for tokens/IDs)
- Custom encryption implementations (don't roll your own crypto)
- Missing HTTPS enforcement
- Weak or missing HSTS headers

### Codebase Context

Password hashing handled by **Supabase Auth** (bcrypt). Token generation by Supabase. The application code should **never** implement custom crypto.

```typescript
// ❌ Insecure randomness for tokens
const token = Math.random().toString(36).substring(2);

// ❌ MD5 for anything security-related
import { createHash } from "crypto";
const hash = createHash("md5").update(password).digest("hex");

// ✅ Cryptographically secure randomness
import { randomBytes } from "crypto";
const token = randomBytes(32).toString("hex");

// ✅ UUID generation (crypto-secure via Supabase/PostgreSQL)
const id = crypto.randomUUID();
```

### Checklist

- [ ] No `Math.random()` for tokens, session IDs, or security-sensitive values
- [ ] No MD5 or SHA-1 for password hashing or integrity checks
- [ ] No custom encryption — delegate to Supabase Auth and platform crypto
- [ ] HSTS header set with `max-age=63072000; includeSubDomains; preload`
- [ ] All external communication over HTTPS (no HTTP fallbacks)
- [ ] `crypto.randomUUID()` or `randomBytes()` for ID and token generation

---

## File & Storage Security

**Severity: Medium–High**

### What to Check

- File upload validation (MIME type, size, content)
- Path traversal via filename manipulation
- Signed URL expiration times
- Public vs private bucket configuration
- File content not matching declared MIME type

### Codebase Context

File uploads use **Supabase Storage** with signed URLs. Validation via `validateDocument()` checks MIME whitelist and size limits.

```typescript
// ❌ Path traversal — unsanitised filename in storage path
const path = `assignments/${teacherId}/${req.body.filename}`;

// ❌ Missing MIME validation
await supabase.storage.from("assignments").upload(path, file);

// ✅ Safe — validated and sanitised
const validation = validateDocument(file, ASSIGNMENT_DOCUMENT_OPTIONS);
if (!validation.valid) return error(validation.code);
const safeName = sanitizeFilename(file.name);
const path = `assignments/${auth.user.id}/${assignmentId}/${safeName}`;
```

### MIME Type Whitelist

| Context              | Allowed Types        | Max Size |
| -------------------- | -------------------- | -------- |
| Assignment documents | PDF, DOCX, PNG, JPEG | 50 MB    |
| Submissions          | PDF, JPEG, PNG, WebP | 20 MB    |

### Checklist

- [ ] All uploads validated with `validateDocument()` before storage
- [ ] Filenames sanitised with `sanitizeFilename()` — no `../`, no special chars
- [ ] Storage paths use `{userId}/{resourceId}/` prefix — enforced by RLS
- [ ] Signed URLs have short expiration (15–60 minutes)
- [ ] MIME type validated against whitelist, not just `Content-Type` header
- [ ] No public storage buckets containing user data
- [ ] File content validated against magic bytes (not just file extension)

---

## Data Protection Anti-Patterns

| Anti-Pattern                               | Fix                                                      |
| ------------------------------------------ | -------------------------------------------------------- |
| Logging full user objects                  | Log only `userId` — never email, name, or role           |
| Returning `SELECT *` from API              | Explicit column selection matching client needs          |
| `Math.random()` for security values        | `crypto.randomUUID()` or `randomBytes()`                 |
| Secrets in source code                     | Environment variables via `dotenv-vault`                 |
| Client-side access to service role key     | `server-only` import guard + `SUPABASE_SERVICE_ROLE_KEY` |
| Permanent signed URLs                      | Short-lived (15–60 min) with re-generation on access     |
| PII sent to third-party AI without consent | Anonymise or pseudonymise before sending                 |
