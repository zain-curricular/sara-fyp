# Logging & Sentry

Two systems, one rule: **log and capture at the layer closest to the cause.** That layer has the richest context — entity IDs, pipeline step, timing, retry count, batch size. By the time an error reaches the API route, most of that detail is gone.

`console.error` and `console.warn` are **always visible** in production. Sentry captures errors that need **alerting and triage** — not all errors, just ones worth investigating. For development tracing, see [Debug Logging](../debug/2-debug-logging.md).

## Severity Levels

### `console.error` — "I need to look at this today"

Unhandled exceptions, operations returning failure to user, data integrity violations, external service failures after retries, security events.

### `console.warn` — "I should look at this if it keeps happening"

Fallback behaviour activated, partial batch failures (18/20 marked), approaching resource limits, suspicious but valid input (0 questions), non-critical data issues.

### Sentry — "wake someone up"

Unrecoverable pipeline failures, data integrity risks, all retries exhausted, error boundaries. Not needed for expected failures (validation, auth, graceful fallbacks).

## Structured Context Objects

Always pass a **context object** — never just a string:

```typescript
// Good — structured, filterable
console.error("Pipeline FAILED:", {
	assignmentId: assignment.id,
	durationMs: totalDurationMs,
	error: serializeError(err),
	stack: err instanceof Error ? err.stack : undefined,
});

// Bad — unstructured, hard to filter
console.error(`Pipeline failed for ${assignment.id}: ${err}`);
```

**Always use `serializeError(err)`** — never pass raw error objects, `err.toString()`, or `String(err)` (all lose information or produce unhelpful output).

### Standard Context Fields

| Field                                        | Type     | When to Include                                             |
| -------------------------------------------- | -------- | ----------------------------------------------------------- |
| Entity IDs (`assignmentId`, `classId`, etc.) | `string` | Always                                                      |
| `error`                                      | `string` | Always for errors — use `serializeError()`                  |
| `stack`                                      | `string` | For errors — `err instanceof Error ? err.stack : undefined` |
| `step`                                       | `string` | In pipelines — which step failed                            |
| `durationMs`                                 | `number` | For timed operations                                        |
| Counts (`questionCount`, `responseCount`)    | `number` | When relevant to understanding the failure                  |

## The `logDatabaseError` Helper

For data-access layer errors, use `lib/utils/logging.ts` instead of raw `console.error`:

```typescript
import { logDatabaseError } from "@/lib/utils/logging";

if (result.error) {
	logDatabaseError(
		"analytics:getAssignmentAnalytics",
		{ assignmentId, step: "questions" },
		result.error,
	);
	return { data: null, error: result.error };
}
```

Prefix format: `module:function` — e.g. `"assignments:create"`, `"submissions:getById"`.

## Layer-Specific Behaviour

Each layer has a specific logging and Sentry role. **One log and one Sentry event per error, at the layer that owns it.**

| Layer                        | Console                | Sentry                  | Notes                                                          |
| ---------------------------- | ---------------------- | ----------------------- | -------------------------------------------------------------- |
| **Data Access**              | `logDatabaseError()`   | Never                   | Operation name + entity IDs. Never log query results or row data |
| **Service / Pipeline**       | `console.error`        | Yes, if critical        | Business context: step, counts, timing. Owns Sentry for unrecoverable failures |
| **API Route (error result)** | None                   | None                    | Service already logged + captured. Just translate to HTTP      |
| **API Route (catch-all)**    | `console.error`        | Yes — `UNEXPECTED`      | Signals a service-layer gap. Prefix both log and Sentry        |
| **`after()` (error result)** | Brief ops note         | None                    | Service already captured                                       |
| **`after()` (catch-all)**    | `console.error`        | Yes — `UNEXPECTED`      | Same as API route catch-all                                    |
| **Error Boundary**           | `console.error`        | Always                  | Terminal handler for rendering errors                          |
| **Client Hooks**             | `console.error`        | Never                   | Pair with `toast.error()` or `setError()` for user feedback    |

## When Sentry Auto-Captures (No Code Needed)

| Scenario                               | Mechanism                                       |
| -------------------------------------- | ----------------------------------------------- |
| Unhandled client-side exceptions       | `@sentry/nextjs` global error handler           |
| Unhandled Server Component exceptions  | `onRequestError = Sentry.captureRequestError`   |
| Unhandled middleware/edge exceptions    | Edge config + `onRequestError`                  |
| Unhandled promise rejections (client)  | Browser global handler                          |
| Performance traces (routes, API calls) | `withSentryConfig` + `tracesSampleRate`         |

## When You MUST Call Sentry Explicitly

Any error that is **caught** (try/catch, error boundary, `.catch()`) is invisible to Sentry unless you explicitly report it. Catching an error = taking responsibility for reporting it.

### Error Boundaries

React catches the error and renders fallback UI — Sentry never sees it. Every `error.tsx` must call `captureException`:

```tsx
"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {

	useEffect(() => {
		Sentry.captureException(error);
		console.error("Teacher error boundary caught an error:", {
			error: serializeError(error),
			digest: error.digest,
			stack: error instanceof Error ? error.stack : undefined,
		});
	}, [error]);

	return <PageErrorState reset={reset} />;
}
```

### Service/Pipeline Critical Failures

Not every service error needs Sentry — only **unrecoverable failures** or **data integrity risks** worth an alert:

```typescript
// YES — pipeline failed, assignment stuck in bad state
Sentry.captureException(error, {
	extra: { assignmentId, durationMs, operation: "pipeline-processing" },
});

// YES — all retries exhausted, data may be inconsistent
Sentry.captureException(error, {
	extra: { assignmentId, operation: "status-revert-exhausted" },
});

// NO — single validation failure in a batch, handled gracefully
// console.warn is sufficient
```

### API Route / `after()` Catch-All — Unexpected Throws Only

The catch-all exists for **unexpected throws the service didn't handle**. When it fires, the service has a gap. Capture with `UNEXPECTED` prefix:

```typescript
} catch (error) {
	Sentry.captureException(error, {
		extra: { assignmentId, operation: "unexpected-route-error" },
	});
	console.error("UNEXPECTED: POST /api/assignments:", {
		assignmentId,
		error: serializeError(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
}
```

**Do not** add Sentry when translating a service error result to HTTP — the service already captured it.

## Pairing Console + Sentry

When both are needed, they serve different purposes. **Always pair them**:

```typescript
// Sentry — alerting, triage dashboard, issue tracking
Sentry.captureException(error, {
	extra: { assignmentId, operation: "pipeline-processing" },
});

// Console — detailed operational context for log investigation
console.error("Pipeline processing failed:", {
	assignmentId,
	durationMs: totalDurationMs,
	error: serializeError(error),
	stack: error instanceof Error ? error.stack : undefined,
});
```

## captureException vs captureMessage

| Function             | When                                             | Example                                               |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `captureException()` | You have an Error object with stack trace         | Caught exception in try/catch                         |
| `captureMessage()`   | No Error object, but something worth alerting on  | Pipeline returned `{ success: false, error: "..." }`  |

## Sentry Context

Always pass an `extra` object with enough context to triage **without reading logs**:

```typescript
Sentry.captureException(error, {
	extra: {
		assignmentId,              // Entity being processed
		operation: "content-extraction", // What was happening
		submissionCount: 5,        // Scale/scope of failure
		durationMs: 12340,         // How long before failure
		step: "batch-extract",     // Pipeline step (if applicable)
	},
});
```

| Field       | Type     | When                                        |
| ----------- | -------- | ------------------------------------------- |
| `operation` | `string` | **Always** — describes what was happening   |
| Entity IDs  | `string` | **Always** — `assignmentId`, `submissionId` |
| `durationMs`| `number` | Timed operations (pipelines, retries)       |
| `step`      | `string` | Multi-step pipelines                        |
| Counts      | `number` | Batch operations (`questionCount`, etc)     |
| `lastError` | `string` | After retry exhaustion                      |

## What NOT to Log or Capture

Applies to both console logging and Sentry `extra`:

- **No PII** — no emails, names, student data
- **No tokens/secrets** — no JWTs, API keys, connection strings
- **No large payloads** — Sentry rejects oversized events (HTTP 413)
- **No request/response bodies** — log IDs and counts only
- **No query results or row data** — log operation names and entity IDs

## Where NOT to Use Sentry

| Scenario                              | Why Not                                | Use Instead       |
| ------------------------------------- | -------------------------------------- | ----------------- |
| Expected validation failures (400s)   | User error, not system error           | Return HTTP 400   |
| Auth failures (401/403)               | Expected flow, not alertable           | Return HTTP error |
| Rate limiting (429)                   | Working as designed                    | Return HTTP 429   |
| Graceful fallbacks                    | System handled it                      | `console.warn`    |
| Debug/development tracing             | Noise in production                    | `debug()` logger  |
| Non-critical supplementary operations | Thumbnail fail ≠ pipeline fail         | `console.warn`    |

## Deduplication

**One log and one Sentry event per error.** The layer that handles the error owns both calls.

```
Data Access → logs via logDatabaseError(), returns { data: null, error }
Service     → does NOT re-log DB error. Only logs if adding business context.
              Captures Sentry for critical/unrecoverable failures (with rich context)
API Route   → error result: no logging, no Sentry. Just translate to HTTP
              catch-all: UNEXPECTED prefix on console.error + Sentry. Signals service gap
```

Choose based on **who has the richest context**:

- **Service has richer context** (durationMs, step, counts, retry state) → service captures, route/`after()` just translates
- **Service is a thin wrapper** (no internal try/catch) → caller captures
- **Both layers catch the same throw** → only the inner layer captures. Outer layer logs without Sentry

### The Service-Calls-From-After() Pattern

```typescript
// Service — captures internally with rich context (durationMs, step, counts)
async function processAssignment(assignment, topics) {
	try {
		// ... pipeline work
	} catch (error) {
		Sentry.captureException(error, {
			extra: { assignmentId: assignment.id, durationMs, operation: "pipeline-processing" },
		});
		return { success: false, error: serializeError(error) };
	}
}

// API Route after() — two distinct paths
after(async () => {
	try {
		const result = await processAssignment(assignment, topics);
		if (!result.success) {
			// Service already captured to Sentry — just note for ops
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

## Sentry Infrastructure

### Configuration Files

| File                        | Runtime          | Key Settings                            |
| --------------------------- | ---------------- | --------------------------------------- |
| `sentry.server.config.ts`   | Node.js server   | DSN, environment, tracesSampleRate      |
| `sentry.edge.config.ts`     | Edge/middleware   | DSN, environment, tracesSampleRate      |
| `instrumentation-client.ts` | Browser          | DSN, environment, replay, tracesSample  |
| `instrumentation.ts`        | Server bootstrap | Loads server/edge config, `onRequestError` |
| `next.config.ts`            | Build            | `withSentryConfig` — source maps, tunnel |

### Environment Routing

```typescript
const vercelEnv = process.env.VERCEL_ENV;
const sentryEnvironment = vercelEnv === "preview" ? "staging" : vercelEnv;

enabled: vercelEnv === "production" || vercelEnv === "preview",
environment: sentryEnvironment,
```

- `VERCEL_ENV=production` → Sentry environment `"production"`
- `VERCEL_ENV=preview` → Sentry environment `"staging"`
- Local dev → Sentry **disabled**

### Privacy

`sendDefaultPii: false` across all configs — Sentry will NOT collect IP addresses, cookies, or request headers. Required for children's data compliance. See `compliance/sub-processors/sentry/sentry-privacy-decisions.md`.
