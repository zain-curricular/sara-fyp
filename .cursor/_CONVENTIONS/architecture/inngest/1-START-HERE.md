# Inngest — Durable Execution

Durable execution layer for long-running background work. Replaces `after()`, hand-rolled checkpointing, and any orchestrator that exceeds Vercel's 300s serverless timeout.

## Mental Model

Long pipeline split into **steps**. Each `step.run()` is its own serverless invocation with its own 300s budget. Results checkpointed between steps — if step 5 crashes, steps 1–4 don't re-run.

```
API Route  →  inngest.send(event)  →  { jobId } in <100ms
                       ↓
               Inngest Queue Service
                       ↓
   step 1 → [HTTP] → checkpoint
   step 2 → [HTTP] → checkpoint
   step N → [HTTP] → DB write
                       ↓
          Client subscribes via Supabase realtime
```

API routes enqueue, Inngest functions execute. An orchestrator is no longer a for-loop of awaits — it's `step.run` glue over services.

## Architecture Fit

Fourth layer alongside API / Services / Data Access:

```
API Route  →  Services  →  Data Access
    ↓
inngest.send(event)
    ↓
Inngest Function (step coordinator)  →  Services  →  Data Access
```

- **API routes** — auth, validate, `inngest.send`, return `{ jobId }`.
- **Inngest functions** — thin step coordinators. `step.run` glue only, no business logic.
- **Orchestrators** — stay where they are (`services/orchestrator.ts`, `_marking-pipeline/`, etc). Called from inside `step.run`. Do not move into Inngest-specific folders.
- **Services / data access** — unchanged. Unaware they run under Inngest.

## Rules

### 1. `step.run` returns must be JSON-serialisable

Results are `JSON.stringify`'d between invocations. **Banned:** Buffers, Blobs, streams, class instances, Supabase client refs, functions, Maps, Sets.

Pattern: upload-then-return-key. Write blobs to storage inside the step, return the path.

```typescript
// BAD — buffer dies at serialisation
const pdf = await step.run("render", () => renderPdf(data));
await step.run("upload", () => uploadToStorage(pdf));

// GOOD
const pdfKey = await step.run("render-and-upload", async () => {
	const pdf = await renderPdf(data);
	return uploadToStorage(pdf); // "reports/abc123.pdf"
});
```

### 2. All side-effects inside `step.run`

Code outside `step.run` runs on every replay. Inngest replays from the top for each step, skipping cached steps but re-running everything around them.

```typescript
// BAD — db write runs N times
async ({ event, step }) => {
	await db.insertLog(event);
	await step.run("a", ...);
};

// GOOD
async ({ event, step }) => {
	await step.run("log-start", () => db.insertLog(event));
	await step.run("a", ...);
};
```

Logging is the exception — use the injected `logger`, SDK deduplicates it.

### 3. Step IDs unique and deterministic

IDs are memoisation keys. Collisions break state.

```typescript
// BAD
for (const item of items) await step.run("process", () => handle(item));

// GOOD
for (const item of items) await step.run(`process-${item.id}`, () => handle(item));
```

Renaming a step ID in a deployed function invalidates cached state for in-flight runs. If you must rename, version the function ID.

### 4. Classify errors, `NonRetriableError` for permanent failures

Existing `classifyPipelineError` / `classifyParsingError` stay. Call inside the step's catch, throw `NonRetriableError` for permanent tags.

```typescript
await step.run("extract", async () => {
	try {
		return await services.extractSegment(key);
	} catch (err) {
		const classified = classifyPipelineError(err);
		if (classified.tag === "permanent") {
			throw new NonRetriableError(classified.message, { cause: err });
		}
		throw err; // transient — retry
	}
});
```

Any `Error` → retry. `NonRetriableError` → skip retries, go to `onFailure`. `RetryAfterError` → retry after known delay (rate-limited APIs).

### 5. Parallel vs fan-out

**Parallel within one run** — `Promise.all`:

```typescript
await Promise.all(items.map((i) => step.run(`process-${i.id}`, () => handle(i))));
```

**Fan-out across runs** — `step.sendEvent`, when each item wants its own retries, concurrency slot, and failure handling:

```typescript
await step.sendEvent("fan-out", items.map((i) => ({
	name: "marking/submission.requested",
	data: { submissionId: i.id },
})));
```

Rule: minutes-long items with per-item isolation → fan out. Quick items sharing batch identity → parallelise inline.

### 6. `onFailure` writes terminal state

When retries exhaust, `onFailure` runs. Mark DB records failed here. Don't rely on the last step — it may never be reached.

```typescript
onFailure: async ({ event, error }) => {
	await dataAccess.markSubmissionFailed(event.data.submissionId, error.message);
},
```

### 7. Events co-located with their function

**No central event catalogue.** Inngest v4 killed the `<{ events: Events }>` client generic — events are now first-class values (`eventType(...)`) that live next to their consumer.

Define the event in the **same file as the function that handles it**, and export it so enqueuers can import. One file owns the event name, the schema, and the handler.

```typescript
// lib/inngest/functions/exports/feedback-pdf.ts
import { eventType, staticSchema } from "inngest";
import { inngest } from "@/lib/inngest/client";

export const feedbackPdfRequested = eventType(
	"exports/feedback-pdf.requested",
	{
		schema: staticSchema<{
			assignmentId: string;
			submissionIds: string[];
			teacherId: string;
		}>(),
	},
);

export const exportFeedbackPdf = inngest.createFunction(
	{ id: "export-feedback-pdf", triggers: [feedbackPdfRequested] },
	async ({ event }) => {
		// event.data typed from the schema above
	},
);
```

Enqueuers import the event **value** (never retype the string name):

```typescript
// app/api/assignments/[assignmentId]/submissions/export/route.ts
import { feedbackPdfRequested } from "@/lib/inngest/functions/exports/feedback-pdf";

await inngest.send(
	feedbackPdfRequested.create({ assignmentId, submissionIds, teacherId }),
);
```

**Rules**
- **No `lib/inngest/events.ts` catalogue.** This was a v3 artefact — v4 makes it redundant and adds nothing but duplication.
- **Never type event names as string literals.** Always import the `eventType` value. Typos fail typecheck, not at runtime.
- **`staticSchema<T>()`** gives you type safety with zero runtime cost. Swap for a Zod schema later if you need runtime payload validation — same API.
- **One event consumed by many functions** — keep the `eventType` definition in the file of the primary producer (or a dedicated `events/<domain>.ts` if no obvious owner) and import everywhere. This is the **only** case where a separate events file is justified.

**v4 gotchas that will bite you**

Three things that break silently or loudly when people port v3 code or copy examples from the internet:

1. **Triggers live INSIDE the options object as an ARRAY — not as a second positional argument.**

	```typescript
	// ❌ v3 style — Inngest v4 SDK rejects this with
	//    "Error when function config is v3-style"
	inngest.createFunction(
		{ id: "...", retries: 3, onFailure: ... },
		{ event: "parsing/assignment.requested" },  // ← wrong, 2nd positional
		async ({ event, step }) => { ... },
	)

	// ✅ v4 style — triggers inside options, always as an array
	inngest.createFunction(
		{
			id: "...",
			triggers: [parseAssignmentRequested],  // ← typed event value
			retries: 3,
			onFailure: ...,
		},
		async ({ event, step }) => { ... },
	)
	```

	Use the array form even for single-trigger functions — consistent shape, trivial to add a second trigger later.

2. **`staticSchema<T>()` requires a `type` alias, NOT an `interface`.**

	```typescript
	// ❌ Doesn't compile — Inngest's StandardSchemaV1 generic rejects interfaces
	interface ParseAssignmentEventData {
		assignmentId: string;
		userId: string;
	}
	staticSchema<ParseAssignmentEventData>();

	// ✅ Use `type` instead
	type ParseAssignmentEventData = {
		assignmentId: string;
		userId: string;
	};
	staticSchema<ParseAssignmentEventData>();
	```

	Root cause: `staticSchema` is parameterised on `Record<string, unknown>`, and TypeScript treats `interface` declarations as "open" — they can be augmented later — which makes them incompatible with `Record<string, unknown>`. Type aliases are "closed" and pass the constraint. Inngest v4 migration guide calls this out explicitly.

3. **Imports live at the top-level `"inngest"` entry.**

	```typescript
	import { eventType, staticSchema } from "inngest";
	```

	Both symbols are re-exported from the package root — no subpath imports needed. Some internet examples use `"inngest/components/triggers"` or similar deep imports; don't copy those. Top-level only.

**Enqueuer side — use `.create()`, never raw `inngest.send({ name, data })`:**

```typescript
// ❌ Raw string event name — no type checking, no end-to-end safety
await inngest.send({
	name: "parsing/assignment.requested",
	data: { assignmentId, userId },
});

// ✅ Typed event via .create() — payload type-checked at the call site
import { parseAssignmentRequested } from "@/lib/features/assignments/parsing/orchestrator";

await inngest.send(
	parseAssignmentRequested.create({ assignmentId, userId }),
);
```

### 8. Use the injected `logger`

No `console`, no direct Pino. `logger` arg only — SDK deduplicates across replays. Inside `step.run` → once per success. Outside → once per replay.

### 9. Flow control on `createFunction`, not in steps

Concurrency, throttle, debounce, `cancelOn` — all config, not handler logic. One function = one set of flow semantics. Different limits → different functions.

Most common pattern — provider cap + per-tenant fairness:

```typescript
concurrency: [
	{ scope: "account", key: '"anthropic"', limit: 20 },     // provider cap
	{ scope: "fn", key: "event.data.teacherId", limit: 5 },  // per-teacher
],
```

Concurrency limits **executing steps**, not function runs. Sleeping / waiting don't count.

## Forbidden

- **`after()` for long work** — dies silently at `maxDuration`. Use `inngest.send`.
- **Sync orchestration in API routes** — anything >60s must be enqueued.
- **Polling a hung request** — clients subscribe to Supabase realtime, not `GET /status`.
- **Hand-rolled retry counters / checkpoint JSON columns** — Inngest owns retry state. No new `retry_count` / `segmentation_state`-style columns.
- **Business logic in function handlers** — handlers are glue. Logic lives in services.
- **DB mutations outside `step.run`** — non-deterministic side effects replay on every invocation.

## Related

- [API Route Conventions — Long-Running Work](../api-routes/5-long-running-work.md)
- [Error Handling — Layer Strategies](../../error-handling/2-layer-strategies.md)
- [Inngest docs](https://www.inngest.com/docs)
