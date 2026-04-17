# Authentication

## Headless Auth in Global Setup

Authentication happens in **global setup**, not in individual specs. The `authenticateHeadless()` function calls Supabase's REST API directly — no browser needed.

```
Global Setup Phase 2:
  For each spec with email + password in manifest:
    → authenticateHeadless(email, password, outputPath)
    → Writes storageState JSON to __e2e__/.playwright/auth/{specName}.json
```

### How It Works

1. Calls Supabase token endpoint with retry logic (5 attempts, exponential backoff on 5xx)
2. Builds Supabase session cookie (base64url with `"base64-"` prefix)
3. Handles cookie chunking if URI-encoded size exceeds 3180 chars
4. Generates Playwright storageState JSON (cookies + localStorage)
5. Writes to disk — reused by all tests in that spec

### Cookie Format

The app uses `@supabase/ssr` — sessions live in **cookies**, not localStorage:

- Cookie name: `sb-{projectRef}-auth-token` (or chunked: `.0`, `.1`, etc.)
- Encoding: base64url with `"base64-"` prefix
- Cookie options: `path=/`, `SameSite=Lax`, `max-age=34560000`

> Don't write localStorage-based injection — it won't work with `@supabase/ssr`.

## Using Auth in Specs

Each spec loads its pre-generated storageState:

```typescript
const SPEC = "class-creation";
const AUTH_FILE = `__e2e__/.playwright/auth/${SPEC}.json`;

test.describe("Class Creation", () => {
    test.use({ storageState: AUTH_FILE });

    // All tests in this describe block are authenticated
});
```

## Skipping Auth

Some specs (auth flow tests, unauthenticated guards) don't need pre-authenticated sessions. Return `skipAuth: true` from the seed:

```typescript
const seed: SpecSeed = {
    specName: SPEC,
    seed: async (runId) => {
        const base = await seedTeacherOnly(SPEC, runId);
        return { ...base, skipAuth: true };
    },
    // ...
};
```

Then in the spec, use empty storageState:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });
```

## Multi-User Auth (`additionalAuth`)

For specs that need multiple authenticated users (e.g. cross-flow tests), return an `additionalAuth` array from the seed:

```typescript
seed: async (runId) => {
	// ... create teacher and student
	return {
		email: teacherEmail,
		password: teacherPassword,
		additionalAuth: [
			{ email: studentEmail, password: studentPassword, suffix: "student" },
		],
	};
},
```

Global setup generates additional storageState files:

- Primary: `__e2e__/.playwright/auth/{specName}.json`
- Additional: `__e2e__/.playwright/auth/{specName}-{suffix}.json`

Use in specs:

```typescript
const TEACHER_AUTH = `__e2e__/.playwright/auth/${SPEC}.json`;
const STUDENT_AUTH = `__e2e__/.playwright/auth/${SPEC}-student.json`;

test.describe("teacher view", () => {
    test.use({ storageState: TEACHER_AUTH });
});

test.describe("student view", () => {
    test.use({ storageState: STUDENT_AUTH });
});
```

## Auth Tokens for API Calls

When specs need to make API requests (e.g. in `beforeAll`/`afterAll` or `try/finally` cleanup), extract the Bearer token from the storageState file:

```typescript
import { getAuthToken } from "../../helpers/auth";

const token = getAuthToken(AUTH_FILE);
const headers = { Authorization: `Bearer ${token}` };
```

The helper handles both single-cookie and chunked-cookie formats.

## Re-Authentication Mid-Test

Some tests need to re-authenticate during execution (e.g. password change specs). Use `authenticateViaApi()` with a live browser:

```typescript
import { authenticateViaApi } from "../../helpers/auth";

await authenticateViaApi(page, {
    email,
    password: newPassword,
    outputPath: AUTH_FILE,
});
```

This injects cookies via `page.evaluate()`, dismisses cookie consent, and reloads the page.
