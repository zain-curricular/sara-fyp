# API Route Conventions

Routes are the HTTP boundary — where untrusted input enters and trusted output leaves. **Routes are thin wrappers. They NEVER contain business logic.**

```
Client → API Route (Parse→Auth→Validate→Delegate→Respond) → Service / DAF → Data Access
```

## Core Rule

**Routes delegate — they don't compute.** A route's job is to translate between HTTP and the service/data layer. If you're writing conditional logic, data transformation, or orchestration inside a route, it belongs in a service.

**Delegation targets:**

- **Service function** — when the operation involves business logic, orchestration, or multi-step workflows
- **DAF (Data Access Function) directly** — when the operation is simple CRUD with no intermediate logic (e.g. a basic fetch or insert)

## Five Responsibilities

1. **Authenticate** — verify caller identity
2. **Authorize** — verify caller can access the resource
3. **Validate** — parse all input with Zod
4. **Delegate** — call a single service function or DAF
5. **Respond** — return the standard envelope

## Canonical Shape

```typescript
export async function POST(request: Request, { params }: RouteParams) {
    const { resourceId } = await params;
    try {
        // 1. Auth
        const auth = await authenticateFromRequest(request);
        if (auth.error) return auth.error;

        // 2. Validate
        const body = await request.json().catch(() => ({}));
        const validation = validateRequestBody(body, createSchema);
        if (isValidationError(validation)) return validation.error;

        // 3. Delegate — service already logged + Sentry if this fails
        const { data, error } = await createResource(
            auth.user.id,
            validation.data,
        );
        if (error)
            return NextResponse.json(
                { ok: false, error: "Failed to create resource" },
                { status: 500 },
            );

        // 4. Respond
        return NextResponse.json({ ok: true, data }, { status: 201 });
    } catch (error) {
        // UNEXPECTED: service didn't handle this — flag it
        Sentry.captureException(error, {
            extra: { resourceId, operation: "unexpected-route-error" },
        });
        console.error("UNEXPECTED: POST /api/resource:", {
            resourceId,
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

### Error Handling in Routes

Routes have **two distinct error paths** — don't conflate them:

1. **Service returns error result** — the service already logged with rich context and captured to Sentry if critical. The route **just translates to HTTP**. No logging, no Sentry.
2. **Unexpected throw hits catch-all** — something the service didn't handle. Log and capture with `UNEXPECTED` prefix. This signals a gap in the service layer that needs fixing.

**If you're adding rich context (pipeline step, timing, batch counts) to a route catch block, that context belongs in the service layer instead.**

See [Error Handling — Layer Strategies](../../error-handling/2-layer-strategies.md) and [Logging & Sentry](../../error-handling/3-logging-and-sentry.md) for full conventions.

## Response Envelope

```typescript
{ ok: true, data: T }   // success
{ ok: false, error: string }  // error — vague message, never internals
```

## Long-Running Work

Any operation that could exceed ~60s must be enqueued to Inngest, not run synchronously and not smuggled through `after()`. See [Long-Running Work](./5-long-running-work.md).
