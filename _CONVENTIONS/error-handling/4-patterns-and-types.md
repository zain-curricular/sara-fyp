# Patterns & Types

## Return-Based Error Handling

Each layer returns a typed result — callers handle errors without try/catch.

### Data Access: `{ data: T | null, error: unknown }`

Mirrors Supabase's native shape. `error` is `unknown` (PostgREST errors are plain objects) — use `serializeError()` when logging.

### Auth: Response-Carrying Result

```typescript
type AuthResult =
    | { user: { id: string }; error: null }
    | { user: null; error: Response }; // Pre-built NextResponse
```

Usage: `if (authResult.error) return authResult.error;`

Feature-specific auth extends this pattern (e.g. `AssignmentAuthResult` adds `assignment` field).

### Validation: Pre-Built Responses

```typescript
type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: NextResponse };
```

Usage: `if (isValidationError(validation)) return validation.error;`

## Zod Validation

### Where to Validate

| Boundary           | Tool                                |
| ------------------ | ----------------------------------- |
| API route body     | `validateRequestBody()`             |
| API query params   | Schema `.safeParse()` directly      |
| AI pipeline output | Schema `.safeParse()` in agent code |

Do **not** validate internal function calls — TypeScript handles that at compile time.

### Always `.safeParse()`, Never `.parse()`

`.parse()` throws `ZodError` — forces try/catch and mixes control flow. Use `.safeParse()` and check `result.success`.

Zod issue messages are safe in 400 responses (they describe shape violations, not internals):

```typescript
const message = result.error.issues.map((i) => i.message).join(", ");
return NextResponse.json({ ok: false, error: message }, { status: 400 });
```

## Custom Error Classes

Use **sparingly** — only for control flow based on error type.

**Current:** `AuthenticationError` — triggers login redirect on 401 in `authenticatedFetch`.

**Create when:** `instanceof` branching needed, error carries domain data (e.g. `retryAfterMs`), multiple catch sites distinguish it.

**Don't create when:** only used for logging, only one catch site, or string check suffices.

### Stack Trace Preservation

Always preserve cause chain: `throw new Error("msg", { cause: err });`

## Error Serialization

Always use `serializeError()` from `@/lib/utils/errorSerialization` — handles Error instances, Supabase objects, strings, unknown.

```typescript
console.error("Operation failed:", {
    error: serializeError(err),
    stack: err instanceof Error ? err.stack : undefined,
});
```

Never use `err.toString()`, `JSON.stringify(err)`, `String(err)`, or raw `err` — they lose info, leak sensitive data, or produce `[object Object]`.

## PostgREST Error Detection

Use `isNotFoundError()` for expected 404s (e.g. existence checks before auth):

```typescript
if (isNotFoundError(error)) {
    return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
    );
}
if (error) {
    logDatabaseError("resource:get", { id }, error);
    return NextResponse.json(
        { ok: false, error: "Internal server error" },
        { status: 500 },
    );
}
```
