# Best Practices

## Security

User-facing error messages must be **vague, friendly, actionable**. Never expose table names, SQL errors, stack traces, file paths, user IDs, tokens, or environment variables.

```typescript
// CORRECT
toast.error("Failed to save. Please try again.");
return NextResponse.json(
    { ok: false, error: "Internal server error" },
    { status: 500 },
);
```

## Error Deduplication

Log once, at the layer that owns the error. See also [Logging & Sentry](./3-logging-and-sentry.md):

```
Data Access → logs via logDatabaseError(), returns { data: null, error }
Service     → does NOT re-log DB error. Only logs if adding business context.
              Captures Sentry for critical/unrecoverable failures (with rich context)
API Route   → error result: no logging, no Sentry. Just translate to HTTP
              catch-all: UNEXPECTED prefix on console.error + Sentry. Signals service gap
```

If you catch and re-throw, do **not** log at the catch site.

## Anti-Patterns

| Anti-Pattern                                       | Fix                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Swallower** — `catch (e) { }`                    | At minimum `console.warn` why it's safe to swallow                           |
| **Leaker** — `{ error: err.message }` in response  | Return vague message; log details server-side                                |
| **Re-Logger** — same error at DA + service + route | Log once at handling layer                                                   |
| **Thrower** — DA function throws                   | Always return `{ data, error }`                                              |
| **Parser** — `.parse()` in route                   | Use `.safeParse()`                                                           |
| **Optimist** — no catch-all in API route           | Always wrap handler in try/catch                                             |
| **Mute** — `catch { console.error(err) }` in hooks | Pair with `toast.error()` or `setError()`                                    |
| **Novelist** — `throw "string"`                    | Throw `Error` instances (strings lose stack traces)                          |
| **Spy** — `toast.error(response.statusText)`       | Never show raw HTTP responses                                                |
| **Cast** — `catch (err: any)`                      | Caught errors are `unknown` — narrow with `instanceof` or `serializeError()` |

## Catch Block Discipline

Narrow before using — caught errors are always `unknown`:

```typescript
catch (err) {
	if (err instanceof AuthenticationError) { redirectToLogin(); return; }
	console.error("Failed:", { error: serializeError(err), stack: err instanceof Error ? err.stack : undefined });
}
```

Only catch where **recovery is possible** (fallback value, retry, default config). Don't catch-and-rethrow — it just re-logs.

## Request Body Parsing

Always guard `request.json()` to prevent unhandled JSON parse errors:

```typescript
const body = await request.json().catch(() => ({}));
const validation = validateRequestBody(body, schema);
if (isValidationError(validation)) return validation.error;
```

## Async Hooks: AbortController

Share a single controller + timeout for parallel fetches. Abort on unmount:

```typescript
useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
}, [fetchData]);
```
