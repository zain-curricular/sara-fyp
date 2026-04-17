# Debug Logging

Uses the [`debug`](https://www.npmjs.com/package/debug) npm package via pre-configured loggers in `lib/utils/debug.ts`. Logs are **off by default**, enabled per-namespace at runtime.

## Namespaces

All namespaces share the `curricular:` base prefix:

```typescript
import { debugAssignments } from "@/lib/utils/debug";
debugAssignments("-> createAssignment: starting for class=%s", classId);
```

| Logger             | Namespace                | Feature Area                     |
| ------------------ | ------------------------ | -------------------------------- |
| `debugAuth`        | `curricular:auth`        | Authentication and authorization |
| `debugAssignments` | `curricular:assignments` | Assignment and marking system    |
| `debugClasses`     | `curricular:classes`     | Class management                 |
| `debugAccounts`    | `curricular:accounts`    | Account settings, deletion       |
| `debugExport`      | `curricular:export`      | PDF/CSV export                   |

Add new loggers to `lib/utils/debug.ts` when a feature area doesn't fit existing namespaces. Use `curricular:<feature>`.

## The Entry/Exit Pattern

Every function with meaningful I/O or side effects uses **arrow markers** to trace execution:

```typescript
// -> marks entry: summarise inputs (IDs, counts)
debug("-> processSubmission: starting for submission=%s", submissionId);

// 2-space indent for intermediate steps within the function
debug(
    "  processSubmission: assignment=%s, class=%s, questions=%d",
    assignmentId,
    classId,
    questions.length,
);

// <- marks exit: always include SUCCESS/FAILED + %dms timing for I/O ops
debug("<- processSubmission: SUCCESS in %dms", totalDurationMs);

// <- exit on failure
debug(
    "<- processSubmission: FAILED after %dms - error=%s",
    totalDurationMs,
    message,
);
```

**Rules:** Always pair `->` with `<-` (no orphans). Always include entity counts. Always include `%dms` timing for I/O.

## Pipeline Logging

Multi-step pipelines use **phase separators** with independent timing per phase:

```typescript
debug("  processAssignment: === PHASE 1: Question Extraction ===");
const phase1Start = Date.now();
// ... phase 1 work ...
debug(
    "  processAssignment: Phase 1 completed in %dms, extracted %d questions",
    Date.now() - phase1Start,
    extractedQuestions.length,
);

debug("  processAssignment: === PHASE 2: Curriculum Mapping ===");
// ... etc — log input/output counts at each boundary, total duration on exit
```

Log partial failures as warnings: `"Marked 18/20 questions, 2 failed"`.

## Performance Metrics

Track timing with `Date.now()` for all I/O-bound operations. For multi-phase ops, break down per-phase so bottlenecks are visible:

```typescript
const startTime = Date.now();
// ... parallel DB queries ...
const fetchDurationMs = Date.now() - startTime;
debug(
    "  getAnalytics: fetched questions=%d responses=%d (took %dms)",
    questions.length,
    responses.length,
    fetchDurationMs,
);

// Exit with full breakdown
debug(
    "<- getAnalytics: complete (fetch=%dms aggregation=%dms total=%dms)",
    fetchDurationMs,
    aggregationDurationMs,
    totalDurationMs,
);
```

## Code Organisation: `#region debug` Blocks

Wrap **every** debug block (including single lines) in collapsible regions:

```typescript
// #region debug
debug("-> processSubmission: starting for submission=%s", submissionId);
// #endregion debug

// ... business logic ...

// #region debug
debug("<- processSubmission: SUCCESS in %dms", totalDurationMs);
// #endregion debug
```

## Client-Side Differences

Hooks and components follow the same entry/exit pattern with these adjustments:

- **No timing metrics** typically needed — browser DevTools has its own profiling
- **Pair failures with `console.error`** for production visibility (debug logs may be off)
- **Pair failures with toast notifications** for user feedback

## Format Specifiers

| Specifier | Use For                 | Example                       |
| --------- | ----------------------- | ----------------------------- |
| `%s`      | Strings, IDs            | `"user=%s"`                   |
| `%d`      | Numbers, counts, timing | `"took %dms"`                 |
| `%O`      | Objects (multi-line)    | `"result=%O"` — use sparingly |
| `%o`      | Objects (single-line)   | `"config=%o"`                 |
| `%j`      | JSON serialization      | `"data=%j"`                   |
