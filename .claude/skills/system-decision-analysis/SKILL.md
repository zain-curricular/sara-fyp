---
name: system-decision-analysis
description: "Invoke this skill when the user asks for a system-level review, decision tree analysis, or edge case audit of a module or pipeline. This includes analysing what happens at each branch point, how errors propagate, what the user sees, and whether system decisions produce good outcomes."
user-invokable: true
---

# System Decision Analysis

A system decision analysis maps every decision point in a module or pipeline, traces each outcome to the user, and identifies where the system produces poor results. It is **not a code review** — it answers: **"For every possible runtime state, does the user get a good outcome?"**

---

## Phase 1: Full System Exploration

Before any analysis, **explore the entire system end-to-end**. Launch parallel Explore agents covering every layer:

### What to explore

| Layer | What to find |
|-------|-------------|
| **Frontend UI** | Pages, components, wizards, dialogs, forms. How the user interacts with the system. Validation, loading states, error displays, toasts, polling, empty states. |
| **Hooks & State** | Client-side state management, data fetching hooks, polling intervals, cache strategies, optimistic updates. |
| **API Routes** | Every endpoint involved. Request validation (Zod), auth checks, delegation to services, error responses, HTTP codes. |
| **Services** | Business logic, orchestration, AI/LLM calls, retry logic, transaction handling, background jobs (`after()`). |
| **Data Access** | DAFs, DB queries, stored procedures, cascade deletes, error tuple patterns. |
| **Types & Schemas** | Status enums, state machines, Zod schemas, discriminated unions, config constants. |
| **Utilities** | Shared helpers, error mappers, file validation, storage operations. |

### How to explore

- Launch **one Explore agent per layer** in parallel — each focused on a specific concern
- Tell each agent to **read the actual files**, not just list them
- Each agent should trace: what data enters, what decisions/branches exist, what data exits, what can go wrong
- After the first round, launch **follow-up agents** for specific areas flagged as complex or suspicious (e.g. error recovery paths, polling behaviour, state transitions after failure)

### What to extract from exploration

For every step in the pipeline, note:

- **Inputs** — what data is required, what's optional, what can be null
- **Branch points** — every `if`, `switch`, status check, or conditional path
- **Outputs** — what the user sees, what gets persisted, what gets logged
- **Failure modes** — what can go wrong, how errors propagate, what the user sees when they do

---

## Phase 2: Exhaustive Decision Path Walk

**Walk every single decision path in the entire system.** This is not sampling — it is a complete enumeration. Start at the first user action and follow every `if`, `switch`, `catch`, `??`, `?.`, ternary, early return, status check, and conditional render through every layer until you reach a terminal state.

### How to walk

1. **Start at the entry point** — the first user interaction (button click, form submit, page load)
2. **At every branch point**, fork into all possible paths. Do not skip "obvious" or "unlikely" branches — walk them all
3. **Follow each path through every layer** — frontend → hook → API route → service → data access → back up through response → hook state update → UI render
4. **Record the terminal state** — what the user sees, what's in the DB, what's in logs
5. **Number every path** — e.g. `P1`, `P2`, `P3.1`, `P3.2` for sub-branches

### What counts as a decision point

- `if` / `else` / `else if`
- `switch` / `case`
- Ternary operators (`? :`)
- Nullish coalescing (`??`) and optional chaining (`?.`)
- `try` / `catch` boundaries
- Early returns / guard clauses
- Status/state checks (e.g. `if (status === 'failed')`)
- Conditional renders in JSX (`{condition && <Component />}`)
- `.filter()`, `.map()` with conditions inside
- Promise resolution vs rejection
- HTTP status code branches in response handling

### Map every path to a frontend outcome

For **every single terminal state** of every path, document exactly what the user experiences:

| What to document | Examples |
|-----------------|----------|
| **What renders** | Which component, what text, what state variant |
| **What the user can do next** | Which buttons are available, what actions are possible, are they stuck? |
| **What feedback they received** | Toast message, inline error, loading spinner, nothing |
| **What they don't know** | Data that was silently lost, partial results shown as complete, stale state |
| **What's in the DB** | Row state after this path completes — consistent? orphaned? partial? |

### Dimensions to evaluate

| Dimension | Question |
|-----------|----------|
| **Decision completeness** | Did you walk every branch? Are there unreachable states? Missing `else` clauses? |
| **Edge cases** | What happens with empty inputs, null data, zero values, missing resources? |
| **Error propagation** | When something fails mid-pipeline, does the error surface clearly or get swallowed? |
| **Frontend accuracy** | Does what the user sees match what actually happened? |
| **Recovery options** | At every error/stuck state, can the user take an action to recover? |
| **Observability** | Can we diagnose what happened from logs alone? |
| **Data correctness** | Is the data semantically accurate, not just type-safe? |

### Classify findings by user impact

| Rating | Meaning | Examples |
|--------|---------|---------|
| **HIGH** | User receives wrong/incomplete output with no indication | Silent data loss, blank content shown as real, missing items with no warning |
| **MEDIUM** | User experience degraded but functional, or issue is hidden in logs | Fallback to "Unknown", misleading success-then-failure, missing metadata |
| **LOW** | Data semantically wrong but not visible to user yet | Misleading internal state, unnecessary computation, storage bloat |

### What to look for

**Silent failures** (highest priority):
- `if (!data) continue` — what was lost?
- `?? fallbackValue` — does the fallback mask a real problem?
- `catch (e) { }` — swallowed error with no logging or user feedback
- Non-blocking steps that are actually critical prerequisites
- Partial results presented as complete

**State machine gaps:**
- Can the system reach a state with no exit? (stuck in "processing" forever)
- Are there recovery paths for every failure state? (retry, re-upload, delete)
- Do status transitions have race conditions?

**Multi-step orchestration:**
- Client-orchestrated flows where mid-sequence failure leaves inconsistent state
- Steps marked as "non-blocking" that downstream steps depend on
- Browser close / network interruption mid-flow — what state is left behind?

**Data correctness:**
- AI outputs that pass type validation but contain hallucinated values
- Partial extraction where failed items are persisted alongside successful ones
- Fallback values that skew aggregations (e.g. `max_marks: 0` for failed extractions)

**Boundary conditions:**
- Division by zero in computed denominators
- Empty arrays passed to `.reduce()`, `Promise.all()`
- Off-by-one errors in pagination or coordinate systems

---

## Phase 3: Output

Create a file called `SYSTEM_ANALYSIS.md` in the **root of the feature module** being analysed (e.g. `lib/features/assignments/SYSTEM_ANALYSIS.md`).

### Document structure

The document has **three sections**:

#### 1. Full Decision Tree (Mermaid flowchart)

A single large `flowchart TB` diagram that traces the **entire system** from first user interaction to every terminal state. This is the centrepiece of the document. **Every path walked in Phase 2 must appear in this diagram.**

**Requirements:**
- Show **every single decision point** as a `{diamond}` node — no branches omitted
- Show **every failure path** alongside happy paths
- **Every terminal node must describe the frontend outcome** — what the user sees, not just the system state (e.g. `"User sees toast: 'Assignment created' + redirects to dashboard"` not just `"Success"`)
- Label flaws inline with `"⚠️ FLAW #N: SHORT TITLE"` and a brief description
- Mark well-handled paths with `"✅"` where the system does the right thing
- Use **subgraphs** to group logical phases (e.g. "Wizard Submission", "Backend Pipeline", "Dashboard Experience")
- Apply **colour classes** to visually distinguish node types:

```
classDef flaw fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b
classDef warn fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#854d0e
classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534
classDef resolved fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
classDef action fill:#dbeafe,stroke:#2563eb,stroke-width:1px,color:#1e40af
classDef neutral fill:#f3f4f6,stroke:#6b7280,stroke-width:1px,color:#374151
```

| Class | Use for |
|-------|---------|
| `flaw` | Nodes that represent unresolved flaws (red) |
| `warn` | Nodes that are degraded but not critical (yellow) |
| `success` | Terminal success states (green) |
| `resolved` | Previously-flagged issues that have been fixed (blue) |
| `action` | Normal pipeline steps (light blue) |
| `neutral` | Benign terminal states like form validation errors (grey) |

#### 2. Frontend Outcome Map

A table mapping **every terminal path** to exactly what the user experiences. This makes visible every possible outcome the user can reach.

```markdown
| Path | Trigger | What User Sees | What User Can Do | Data State | Verdict |
|------|---------|---------------|-----------------|------------|---------|
| P1 | Happy path submit | Toast: "Saved", redirects to dashboard | View, edit, delete | Row created, status=active | ✅ Good |
| P2 | Network error on submit | Spinner hangs indefinitely | Nothing — no error shown, no retry | No row created | ⚠️ FLAW #3 |
| P3.1 | Validation fail (empty name) | Inline error on name field | Fix and resubmit | No change | ✅ Good |
| P3.2 | Validation fail (server-side) | Generic "Something went wrong" toast | Retry blindly | No change | ⚠️ FLAW #5 |
```

**Every single path from Phase 2 must appear in this table.** No path omitted. This is how we verify complete coverage.

#### 3. Flaw Detail Sections

One section per flaw, numbered to match the decision tree. Each flaw section contains:

- **A focused Mermaid diagram** — `sequenceDiagram`, `flowchart LR`, or `stateDiagram-v2` — whichever best illustrates the specific failure path. Keep these small and targeted (not the full system).
- **Frontend impact** — exactly what the user sees when this flaw triggers, what they can/can't do, and whether they know something went wrong
- **Root cause** — one paragraph explaining why this happens at the code level
- **Fix** — concrete suggestion (not vague "improve error handling")
- **Severity context** — if a flaw was partially mitigated by recent changes, note what was fixed and what remains

#### 4. Prioritised Summary Table

A single table at the end ranking all flaws:

```markdown
| # | Flaw | Impact | Effort | Description |
|---|------|--------|--------|-------------|
| 1 | **Short title** | **High** | Medium | One-line description of what goes wrong and what the user sees |
```

- **Impact:** High / Medium / Low (rated by user impact, not code severity)
- **Effort:** Trivial / Low / Medium (implementation effort to fix)
- If a flaw was resolved, strike it through and note the commit/PR

### Updating an existing analysis

When the system has changed (new commits, fixes applied):

1. Read the existing `SYSTEM_ANALYSIS.md`
2. Review the changes (git diff, read modified files)
3. Update the decision tree to reflect new paths, statuses, and recovery mechanisms
4. Move resolved flaws into a **"What Was Fixed"** section with before/after explanation
5. Re-number remaining flaws
6. Adjust severity ratings where mitigations have been applied
7. Update the summary table

---

## Anti-Patterns

- **Don't review code style** — this isn't a code review
- **Don't suggest over-engineering** — only flag issues that affect user outcomes
- **Don't flag theoretical risks** — focus on states that can actually occur given the data model
- **Don't recommend changes without impact** — every finding must trace to a user outcome
- **Don't include a pipeline overview diagram** — the feature README already has architecture diagrams; this document focuses on decision paths and flaws
