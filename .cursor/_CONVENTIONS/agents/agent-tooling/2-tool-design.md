# Tool Design

Tool design is the highest-leverage activity when building an agent — more impactful than prompt engineering.

---

## Principles

### Single Responsibility

Every tool must have a **distinct, unambiguous purpose**. Build intentionally — start with a minimal toolset targeting high-impact workflows, scale based on observed failures.

### Right Granularity

| Scenario                               | Recommendation                                                            |
| -------------------------------------- | ------------------------------------------------------------------------- |
| CRUD on a resource                     | **Separate tools** — `createAssignment`, `readAssignment`, `editQuestion` |
| Different parameter shapes             | **Separate tools** — each with a focused schema                           |
| Identical parameters, different intent | **One tool with an `action` enum**                                        |
| Multi-step composite operations        | **Single tool** — consolidate always-chained steps                        |

Avoid too fine-grained (forces sequential calls, wastes tokens) or too coarse (returns irrelevant data, pollutes context).

### No Overlap

Multiple tools with similar purposes cause hesitation. If unavoidable, **explicitly disambiguate in the system prompt**.

### Scaling Limits

Setups with **< ~100 tools and < ~20 arguments per tool** are in-distribution. More tools introduce ambiguity.

---

## Naming

### Verb-Noun Pattern (`verbNoun` camelCase)

| Verb     | Meaning            | Example            |
| -------- | ------------------ | ------------------ |
| `create` | Insert new         | `createAssignment` |
| `read`   | Fetch single       | `readAssignment`   |
| `list`   | Fetch multiple     | `listAssignments`  |
| `edit`   | Partial update     | `editQuestion`     |
| `delete` | Remove             | `deleteQuestion`   |
| `search` | Query with filters | `searchCurriculum` |
| `switch` | Change state       | `switchMode`       |

### Namespacing

Group related tools with shared prefixes:

- **Requirements**: `switchMode`, `gatherRequirements`, `readCurriculum`
- **Assignments**: `listAssignments`, `readAssignment`, `createAssignment`
- **Questions**: `editQuestion`, `deleteQuestion`, `addQuestion`, `reorderQuestions`

### Parameter Naming

- **Unambiguous** — `assignmentId` not `id`, `questionNumber` not `number`
- **Domain language** — use terms teachers would use
- **Prefer `z.string().nullable()` over optional** — `nullable` yields more reliable results

---

## Descriptions

The **single most important factor** in tool performance. Apply the Intern Test: _"Can an intern correctly use this given nothing but what you gave the model?"_

### Every Description Must Cover

1. What the tool does
2. When it should / should NOT be used
3. What each parameter means
4. What it returns (and what it does NOT)
5. Important caveats or limitations
6. Specialised query formats or resource relationships

### Example

```typescript
tool({
    description:
        "Retrieves the full details of an existing assignment including all "
        + "questions, their marks, and ordering. Use this when the teacher wants "
        + "to review, edit, or discuss a specific assignment. Returns the "
        + "assignment title, type, status, class name, topics, and an ordered "
        + "list of questions with marks and content. Does NOT return submission "
        + "or marking data — use the marking tools for that. The assignment is "
        + "identified by its human-readable identifier (e.g. 'Assignment-3'), "
        + "not a UUID.",
});
```

### Additional Rules

- **Include usage boundaries** — specify when a tool should and should NOT be called
- **Embed few-shot examples** for complex parameter formats (~6% accuracy improvement):
  `z.string().describe('The human-readable identifier, e.g. "Assignment-3"')`
- **Describe every parameter** with `.describe()` on every Zod field

---

## Input Schemas

- **Keep flat** — deeply nested parameters degrade reliability
- **Use enums** to constrain valid options (prevents hallucinated values)
- **Only mark truly necessary params as required** — set sensible defaults for optional ones, document in description
- **Human-readable identifiers over UUIDs** — `Assignment-3` not a UUID. Tools resolve internally via `getAssignmentByIdentifier()`, `getClassByIdentifier()`, etc.

---

## Output Design

- **High-signal only** — no UUIDs, internal IDs, or mime types. Resolve cryptic identifiers into semantic language
- **Structured text** — headings, bullets, and tables parse better than raw JSON blobs
- **Pagination** — set restrictive defaults, steer toward many small targeted requests
- **Token budget** — keep responses **under 4,000 tokens** for routine operations

---

## Error Handling in Tools

- **Return errors to the model, never swallow them** — enables self-correction
- **Actionable guidance** — `"No assignment found with identifier 'Assignment-99'. Use listAssignments to see available assignments."`
- **Never expose internals** — no DB errors, stack traces, UUIDs, SQL, or credentials

---

## Anti-Patterns

| Anti-Pattern                | Fix                                                            |
| --------------------------- | -------------------------------------------------------------- |
| Wrapping REST APIs 1:1      | Agent-specific tools with filters and pagination               |
| Returning unbounded data    | Always implement limits with sensible defaults                 |
| Opaque identifiers (UUIDs)  | Human-readable identifiers, resolve internally                 |
| Overlapping tools           | Explicitly define boundaries in descriptions and system prompt |
| One-liner descriptions      | 3-5 sentences covering what, when, returns, limits             |
| Deeply nested schemas       | Flatten to top-level fields                                    |
| Swallowing errors           | Return descriptive error strings to the model                  |
| Promising future tool calls | System prompt: "Call it now or explain why you cannot"         |
