# Layer Strategies

Each layer has a specific error-handling role. Errors gain user-friendliness and lose technical detail as they flow up.

## Choosing Where to Log and Capture

**Log at the layer closest to the cause.** That layer has the richest context — entity IDs, pipeline step, timing, retry count, batch size. By the time an error reaches the API route catch-all, most of that detail is gone.

```
Data Access    → knows: table, query, entity IDs
Service        → knows: pipeline step, duration, batch counts, retry state
API Route      → knows: HTTP method, endpoint — but NOT why the service failed
```

### Rules

- **Log where you have the most context**, not where you catch
- **Never re-log the same error at multiple layers** — see [Error Deduplication](./5-best-practices.md#error-deduplication)
- **If a service catches and returns an error result**, the service logs it (with full context). The API route just returns the HTTP response — no additional logging needed for that error
- **If a service doesn't catch** (error throws through to the API route), the route catch-all logs it — but this is a fallback, not the intended path. Consider whether the service should have caught it
- **Sentry follows the same rule** — capture at the layer with the richest context. See [Deduplication](./3-logging-and-sentry.md#deduplication)

### Example: Pipeline Error

```typescript
// Service — catches with full context. This is where logging belongs.
async function processAssignment(assignment) {
	try {
		const result = await extractQuestions(assignment);
		// ...
	} catch (error) {
		console.error("Pipeline processing failed:", {
			assignmentId: assignment.id,
			durationMs: Date.now() - startTime,
			step: "extraction",
			questionCount: questions.length,
			error: serializeError(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		Sentry.captureException(error, {
			extra: { assignmentId: assignment.id, durationMs, step: "extraction", operation: "pipeline-processing" },
		});
		return { success: false, error: serializeError(error) };
	}
}

// API Route after() — two distinct paths
after(async () => {
	try {
		const result = await processAssignment(assignment);
		if (!result.success) {
			// Service already logged + Sentry — just note for ops
			console.error("Pipeline failed (background):", { assignmentId, error: result.error });
		}
	} catch (error) {
		// UNEXPECTED: service didn't catch this — flag it
		Sentry.captureException(error, {
			extra: { assignmentId, operation: "unexpected-background-error" },
		});
		console.error("UNEXPECTED: background processing threw:", {
			assignmentId,
			error: serializeError(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
	}
});
```

## Data Access

**Location:** `services/_data-access/`
**Rule:** Never throw. Always return `{ data, error }`.

```typescript
export async function getAssignment(
    assignmentId: string,
): Promise<{ data: Assignment | null; error: unknown }> {
    const { data, error } = await admin
        .schema("assignments")
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .single();

    if (error)
        logDatabaseError("assignments:getAssignment", { assignmentId }, error);

    return { data, error };
}
```

**Rules:**

- Return Supabase shape directly — `{ data: T | null, error: unknown }`
- Log with `logDatabaseError()` — prefix `module:function` (e.g. `"submissions:create"`)
- Never transform, swallow, or throw the error
- Expected 404s are business cases — use `isNotFoundError()` to distinguish

## Service / Pipeline

**Location:** `services/` orchestrators, business logic
**Rule:** Propagate or handle. Never re-log errors already logged downstream.

```typescript
export async function processAssignment(
    assignmentId: string,
): Promise<ProcessResult> {
    const { data: assignment, error } = await getAssignment(assignmentId);
    if (error || !assignment)
        return { success: false, error: "Assignment not found" };

    const result = await runPipeline(assignment);
    if (!result.success) {
        console.error("Pipeline FAILED:", {
            assignmentId,
            step: result.failedStep,
            durationMs: result.durationMs,
            error: serializeError(result.error),
        });
    }

    return result;
}
```

**Rules:**

- Do NOT re-log errors `logDatabaseError()` already captured
- DO log when adding business context (pipeline step, timing, counts)
- Return typed results — discriminated unions or `{ success, error? }`
- Catch only when recovery is possible (partial batch failures, retries, fallbacks)

## API Route

**Location:** `app/api/` route handlers
**Rule:** Catch everything. Never let raw errors escape. But don't duplicate work the service layer already did.

API routes have two distinct error paths:

### 1. Service returns error result (normal path)

The service already logged and (if critical) captured to Sentry with rich context. The API route **just translates to HTTP** — no logging, no Sentry.

```typescript
const { data, error } = await createResource(validation.data);
if (error)
    return NextResponse.json(
        { ok: false, error: "Failed to create resource" },
        { status: 500 },
    );
```

### 2. Unexpected throw hits catch-all (service bug)

Something threw that the service didn't handle. This is a **safety net, not the normal path**. Log and capture to Sentry with `UNEXPECTED` prefix — this signals a gap in the service layer that needs fixing.

```typescript
} catch (error) {
    Sentry.captureException(error, {
        extra: { assignmentId, operation: "unexpected-route-error" },
    });
    console.error("UNEXPECTED: POST /api/resource:", {
        assignmentId,
        error: serializeError(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
        { ok: false, error: "Internal server error" },
        { status: 500 },
    );
}
```

**If you find yourself adding rich context (pipeline step, timing, counts) to an API route catch block, that context belongs in the service layer instead.**

### Full Example

```typescript
export async function POST(request: Request, { params }: RouteParams) {
    const { assignmentId } = await params;
    try {
        const authResult = await authenticateFromRequest(request);
        if (authResult.error) return authResult.error;

        const body = await request.json().catch(() => ({}));
        const validation = validateRequestBody(body, createSchema);
        if (isValidationError(validation)) return validation.error;

        // Service already logged + Sentry if this fails — just translate to HTTP
        const { data, error } = await createResource(validation.data);
        if (error)
            return NextResponse.json(
                { ok: false, error: "Failed to create resource" },
                { status: 500 },
            );

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        // UNEXPECTED: service didn't handle this — flag it
        Sentry.captureException(error, {
            extra: { assignmentId, operation: "unexpected-route-error" },
        });
        console.error("UNEXPECTED: POST /api/resource:", {
            assignmentId,
            error: serializeError(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { ok: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
```

### Response Envelope

```typescript
{ ok: true, data: T, ...additionalFields }  // success
{ ok: false, error: string }                 // error
```

### Status Codes

| Code  | Meaning               | Error Message                                      |
| ----- | --------------------- | -------------------------------------------------- |
| `400` | Validation failure    | Zod issue messages (safe to expose)                |
| `401` | Missing/invalid token | `"Unauthorized"`                                   |
| `403` | Authorization failed  | `"Forbidden"` or `"Not found"` (hide existence)    |
| `404` | Resource missing      | `"Not found"`                                      |
| `500` | Unexpected exception  | `"Internal server error"` / `"Failed to <action>"` |

**Rules:**

- Wrap entire handler in try/catch — catch-all is the safety net for unexpected throws
- Auth first → validation second → business logic
- User-facing messages must be **vague** — never expose DB errors/stack traces
- **Service returns error result** → no logging, no Sentry. Just translate to HTTP response
- **Catch-all fires** → `UNEXPECTED` prefix on both `console.error` and Sentry. This signals a service-layer gap
- Rich context (pipeline step, timing, batch counts) in a catch block = wrong layer. Move it to the service

## Client Hooks

**Location:** `_hooks/`, React components
**Rule:** Set error state for UI. Toast for transient feedback. Log for diagnostics.

```typescript
const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await authFetch(`/api/resource/${id}`);
        if (!response.ok) {
            setError(
                response.status === 404 ? "Resource not found"
                : response.status === 403 ? "You don't have access"
                : "Failed to load resource",
            );
            return;
        }
        const { ok, error, data } = await response.json();
        if (!ok) {
            toast.error(error || "Failed to load resource");
            return;
        }
        setData(data);
    } catch (err) {
        console.error("fetchData failed:", serializeError(err));
        setError("Something went wrong. Please try again.");
    } finally {
        setIsLoading(false);
    }
}, [authFetch, id]);
```

**Rules:**

- **Critical fetches** → `setError()` (blocks page)
- **Non-critical fetches** → `console.warn` (continue without data)
- **Mutations** → `toast.error()` / `toast.success()`
- Always pair `console.error` with user feedback (`toast` or `setError`)
- Map status codes: 403 → "access denied", 404 → "not found", else → generic
