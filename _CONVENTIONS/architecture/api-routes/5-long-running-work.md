# Long-Running Work — Delegate to Inngest, Not `after()`

Any operation that could exceed ~60s (marking pipelines, parsing, mark-scheme generation, bulk PDF export, any orchestrator chaining multiple phases) **must** be enqueued as an Inngest event. It must not run synchronously in the request, and it must not use `after()` to smuggle work past the response.

**Why:** Vercel serverless caps at 300s (Pro) / 900s (Enterprise). `after()` silently dies at `maxDuration` with no retry, no visibility, and half-written data. Inngest gives each step a fresh budget, automatic retries, and durable checkpointing.

## The Enqueue Pattern

Routes that trigger durable work follow the same five responsibilities — the only difference is that **Delegate** calls `inngest.send` instead of a service function, and **Respond** returns a job identifier:

```typescript
export async function POST(request: Request, { params }: RouteParams) {
    const { submissionId } = await params;
    try {
        // 1. Auth + Authorize (same as any other route — BOLA applies)
        const auth = await authenticateAndAuthorizeSubmission(request, submissionId);
        if (auth.error) return auth.error;

        // 2. Validate
        const body = await request.json().catch(() => ({}));
        const validation = validateRequestBody(body, markingRequestSchema);
        if (isValidationError(validation)) return validation.error;

        // 3. Delegate — enqueue, do NOT execute
        const { ids } = await inngest.send({
            name: "marking/submission.requested",
            data: {
                submissionId,
                teacherId: auth.user.id,
                ...validation.data,
            },
        });

        // 4. Respond — 202 Accepted + job id
        return NextResponse.json(
            { ok: true, data: { jobId: ids[0] } },
            { status: 202 },
        );
    } catch (error) {
        Sentry.captureException(error, {
            extra: { submissionId, operation: "enqueue-marking" },
        });
        return NextResponse.json(
            { ok: false, error: "Failed to start marking" },
            { status: 500 },
        );
    }
}
```

## Rules for Durable-Job Routes

- **202 Accepted**, not 200. The work hasn't finished — the route has accepted it.
- **Response payload is `{ jobId }` only.** Never return partial pipeline results from the enqueue route.
- **Authorize before enqueue.** The Inngest function runs out-of-request and cannot re-check the caller. Every BOLA check, ownership verification, and resource-existence check happens in the route, before `inngest.send`.
- **Validate before enqueue.** The event payload must be fully validated — Zod-parsed — before it goes into the queue. Garbage in the queue is garbage on retry, forever.
- **Keep the payload small and ID-based.** Send identifiers, not blobs. The function fetches what it needs from the DB.
- **No business logic between validate and send.** If you're computing things to stuff into the event, that computation belongs inside the Inngest function as a first `step.run`.
- **Clients subscribe to Supabase realtime** on the relevant status column to track progress. They do not poll a `/status` endpoint.

## Forbidden

- **`after(() => runOrchestrator(...))`** — the canonical anti-pattern this migration exists to kill. Replace with `inngest.send`.
- **Running an orchestrator synchronously in the route and hoping it finishes in time** — if it can exceed 60s, it must be enqueued.
- **Returning pipeline results from the enqueue route** — the route returns before the work starts. Return `{ jobId }`.
- **Skipping auth because "it's just enqueuing"** — the event itself is a privileged action. Full auth + authorization applies.

See [Inngest Conventions](../inngest/1-START-HERE.md) for how the function on the other side of the queue is written.
