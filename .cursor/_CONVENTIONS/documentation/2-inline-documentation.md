# Inline Documentation

Every TypeScript file requires three layers of inline documentation: a **file header**, **JSDoc on exports**, and **logic comments** throughout.

---

## File Header Block

**Required on every file.** Gives the reader a complete mental model before they read any code.

### Format

```typescript
// ============================================================================
// File Name (Human-Readable)
// ============================================================================
//
// One-paragraph overview of what this file does and why it exists.
//
// Section Name
// ------------
// Explanation of a key concern — integrations, architecture decisions,
// data flow, constraints, or anything the reader needs before diving in.
//
// Another Section
// ------------
// Additional context as needed. Keep to 2-3 sections max.

import { something } from "./somewhere";
```

### Rules

- **Title line** matches the file's conceptual name, not necessarily the filename
- **Overview paragraph** covers: what the file does, where it fits in the system, key dependencies
- **Subsections** (with `// ----` underlines) explain non-obvious concerns: integration points, error handling strategy, design decisions, constraints
- **Two blank lines** between the header block and the first import
- **Keep concise** — 10–25 lines typical. If the header grows beyond 30 lines, the file may need splitting

### What to Include

| File Type        | Header Must Cover                                               |
| ---------------- | --------------------------------------------------------------- |
| API route        | Endpoint method + path, auth requirements, what it delegates to |
| Service function | Business operation, orchestration flow, which DAFs it calls     |
| Data access      | Database table(s), query pattern, return shape                  |
| React component  | Visual purpose, key props, where it's used                      |
| Hook             | State it manages, methods it exposes, data flow                 |
| Utility          | What problem it solves, where it's consumed                     |
| Schema/types     | Domain it models, relationship to other schemas                 |
| Config           | What it configures, environment dependencies                    |

### Checklist

- [ ] Every file has the `// ====` header block
- [ ] Overview explains what + why, not just what
- [ ] Subsections cover integration points and non-obvious decisions
- [ ] No stale references to renamed files, moved functions, or deleted dependencies
- [ ] Header is concise (< 30 lines)

---

## JSDoc Comments

**Required on every exported symbol.** This is the API surface — consumers read JSDoc, not implementation.

### Format

```typescript
/**
 * Processes a student submission through the two-pass marking pipeline.
 *
 * Pass 1 identifies the student via vision analysis. Pass 2 extracts and
 * marks answers via text analysis. Results are written to the submissions
 * table with confidence scores.
 *
 * @param assignmentId - The assignment this submission belongs to
 * @param submissionId - The specific submission to process
 * @returns Processing result with pass/fail status and confidence scores
 */
export async function processSubmission(
	assignmentId: string,
	submissionId: string,
): Promise<ProcessResult> {
```

### Rules

- **First line** is a single-sentence summary (imperative mood: "Processes...", "Returns...", "Validates...")
- **Body** explains behaviour, side effects, and important constraints (2–4 sentences max)
- **`@param`** for every parameter — describe what it represents, not just the type
- **`@returns`** when the return value isn't obvious from the function name
- **`@throws`** only if the function actually throws (most should return errors)
- **Skip JSDoc on internal (non-exported) functions** unless the logic is non-obvious

### What Needs JSDoc

| Symbol Type             | Required | What to Document                              |
| ----------------------- | -------- | --------------------------------------------- |
| Exported function       | **Yes**  | Purpose, params, return, side effects         |
| Exported type/interface | **Yes**  | What domain concept it models                 |
| Exported constant       | **Yes**  | What it configures and valid values           |
| Exported component      | **Yes**  | Visual purpose, key props behaviour           |
| Exported hook           | **Yes**  | State managed, methods returned               |
| Internal function       | No       | Add `//` comment only if logic is non-obvious |
| Re-export (barrel)      | No       | Documented at source                          |

### Checklist

- [ ] Every exported symbol has a `/** */` comment
- [ ] First line is imperative single-sentence summary
- [ ] `@param` present for every parameter
- [ ] No stale `@param` referencing renamed/removed parameters
- [ ] JSDoc matches current implementation (not a previous version)

---

## Logic Comments

**Required at the top of each logical block.** These are `//` comments that narrate the flow of a file — a reader should understand the structure by reading only the comments.

### Format

```typescript
export async function createAssignment(input: CreateInput): Promise<Result> {
    // Validate the teacher owns the target class
    const auth = await authenticateAndAuthorizeClass(request, input.classId);
    if (auth.error) return auth.error;

    // Build the assignment record with defaults for optional fields
    const record = {
        title: input.title,
        class_id: input.classId,
        teacher_id: auth.user.id,
        status: "draft",
    };

    // Persist and return the created assignment
    const { data, error } = await insertAssignment(record);
    if (error) return { success: false, error: "Failed to create assignment" };

    return { success: true, data };
}
```

### Rules

- **One comment per logical block** — a block is 2–8 lines that accomplish one thing
- **Starts with a verb** — "Validate...", "Build...", "Persist...", "Extract...", "Transform..."
- **Explains intent, not mechanics** — "Validate the teacher owns the target class" not "Call authenticateAndAuthorizeClass"
- **Placed above the block**, not inline at the end of a line
- **No comments on self-evident code** — `const name = input.name` doesn't need a comment
- **Empty line before each commented block** to create visual rhythm

### When to Add More Detail

- **Complex conditionals** — explain the business rule, not the boolean expression
- **Regex patterns** — always explain what the pattern matches
- **Magic numbers** — explain the value's origin or meaning
- **Error handling branches** — explain what went wrong and why this recovery strategy
- **Performance-sensitive code** — explain why this approach over the obvious one

### Checklist

- [ ] Every function body has `//` comments at logical block boundaries
- [ ] Comments explain intent ("why"), not mechanics ("what")
- [ ] No commented-out code left in the file
- [ ] Comments match current logic (not stale from a previous refactor)
- [ ] Self-evident one-liners are not over-commented

---

## Inline Documentation Anti-Patterns

| Anti-Pattern                             | Fix                                                      |
| ---------------------------------------- | -------------------------------------------------------- |
| No file header                           | Add `// ====` block with overview + key subsections      |
| Header describes old version of the file | Rewrite to match current implementation                  |
| JSDoc says "TODO" or "FIXME"             | Fix the issue or create a Linear ticket and reference it |
| `@param` missing on exported function    | Add `@param` for every parameter                         |
| Comment restates the code                | Rewrite to explain intent/business rule                  |
| Commented-out code blocks                | Delete — git history preserves old code                  |
| Wall of comments (10+ lines)             | Split into subsections or move to README                 |
| No comments in a 50+ line function       | Add `//` blocks at logical boundaries                    |
