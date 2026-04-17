# Layers in Detail

## Layer 1: API Routes

**Location:** `src/app/api/`

Thin HTTP adapters. Translate between HTTP and services — nothing more.

### Responsibilities

1. **Authenticate** — `authenticateFromRequest(request)`
2. **Parse & validate** — extract params, validate with Zod
3. **Delegate** — call a single service function
4. **Serialize** — return `{ ok, data/error }` with correct HTTP status

### Must NOT

- Contain business logic or conditionals on data
- Import `admin` or build Supabase queries
- Transform/reshape/compute data
- Orchestrate multiple service calls

Routes **may** call data-access directly (via service barrel) for **simple reads with no logic**. See API Routes conventions for canonical route pattern.

---

## Layer 2: Services

**Location:** `src/lib/features/{feature}/services/`

All **business logic and orchestration**.

```
services/
├── index.ts           # Barrel with `import "server-only"`
├── _data-access/      # Pure database queries
├── _utils/            # Orchestrators + pure business logic
├── _auth/             # Feature-specific authorization
└── _pipeline/         # AI agent orchestrators (where applicable)
```

### Responsibilities

- Orchestrate multiple data-access calls
- Validate business rules (ownership, state transitions)
- Transform data between layers
- Return typed results (discriminated unions or `{ data, error }`)

### Must NOT

- Reference `Request`, `Response`, `NextResponse`, or HTTP status codes (exception: auth services returning pre-built error responses)
- Contain raw Supabase queries — delegate to data-access
- Have `import "server-only"` in individual files — only the barrel

The barrel (`services/index.ts`) is the **only public API** for server-side code. See Feature Module conventions for barrel details.

---

## Layer 3: Data Access

**Location:** `src/lib/features/{feature}/services/_data-access/`

**Pure database wrappers.** One Supabase operation per function, return raw result.

### Responsibilities

- Execute single Supabase query (select/insert/update/delete/RPC)
- Return `{ data, error }` tuples
- Include debug logging for observability

### Must NOT

- Contain business logic, ownership checks, or conditional branching on data
- Reference HTTP concerns
- Call other data-access functions (that's orchestration)
- Interpret or throw errors — return as-is

PostgREST can't resolve cross-schema FK joins. Use **two queries merged in JS** — acceptable in data-access because the merge is structural (combining results), not logical (business decisions). See Data Access conventions for examples.
