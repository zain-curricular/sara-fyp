# Agent Environment

Orchestration patterns, safety mechanisms, error recovery, and production-readiness for Atlas.

---

## Tool Factory Pattern

Each tool is created by a factory function that pre-binds runtime context (teacherId, conversationId) into closures.

**Why**: scoped access (automatic teacher-scoping), testable (call with fixtures), composable (assemble per request), secure (UUIDs bound at creation, never exposed to model).

```typescript
export function createReadAssignmentTool(teacherId: string) {
    return tool({
        description: "...",
        inputSchema: z.object({
            /* ... */
        }),
        execute: async (input) => {
            // teacherId pre-bound — agent never sees it
            const assignment = await getAssignmentByIdentifier(
                teacherId,
                input.identifier,
            );
        },
    });
}
```

---

## Safety & Confirmation

### Risk Classification

| Category           | Gate              | Examples                                              |
| ------------------ | ----------------- | ----------------------------------------------------- |
| **Read-only**      | No gate           | `readAssignment`, `listAssignments`, `readCurriculum` |
| **Write**          | Optional          | `createAssignment`, `editQuestion`, `addQuestion`     |
| **Destructive**    | Always            | `deleteQuestion`, bulk operations                     |
| **State-changing** | Context-dependent | `switchMode` (safe), `reorderQuestions` (review)      |

Use `needsApproval: true` or conditional `needsApproval: async (args) => args.count > 3` for gated tools.

**Filter question**: _"Would I be okay if the agent did this without asking me?"_

### Principles

- **Least privilege** — tools get only the permissions they need; teacher ownership verified on every call
- **Audit trail** — log every invocation: tool name, inputs, output/error, teacher ID, conversation ID, timestamp

---

## Error Recovery

Error handling rules are defined in [Tool Design — Error Handling](./2-tool-design.md#error-handling-in-tools). Additional environment-level concerns:

- **Retry transient failures** (network, rate limits) with exponential backoff inside `execute`
- **Runaway loop prevention** — `stopWhen: stepCountIs(ATLAS_MAX_STEPS)` where `ATLAS_MAX_STEPS = 20`
- **State verification** — after mutations, verify the change took effect before returning success

---

## Client-Side Tools

Tools that render UI on the frontend instead of executing on the server.

### Flow

```
Agent calls tool → AI SDK sends invocation to frontend (no execute function)
→ Frontend renders interactive form → Teacher submits → addToolOutput()
→ sendAutomaticallyWhen triggers new stream → Agent receives result and continues
```

### When to Use

- **Interactive selection** — class lists, topic trees, file uploads
- **Rich input** — where free text would be ambiguous
- **Confirmation dialogs** — requiring review before proceeding

### Implementation

Omit the `execute` function — AI SDK pauses and waits for `addToolOutput()`:

```typescript
export function createGatherRequirementsTool() {
    return tool({
        description: "...",
        inputSchema: z.object({
            requestTypes: z.array(z.enum(["class", "topics"])),
        }),
        // No execute — frontend handles this
    });
}
```

---

## Callback Bridge

Connects server-side tool execution with frontend state updates.

**Problem**: When `createAssignment` runs on the server, the frontend preview needs to refetch.

**Solution**: Global registry:

```
Frontend mounts  → setAtlasCallbacks({ onAssignmentChanged })
Tool executes    → getAtlasCallbacks().onAssignmentChanged(assignmentId)
Frontend unmounts → clearAtlasCallbacks()
```

`hasAtlasCallbacks()` check enables headless operation (integration tests, API-only calls).

---

## Tool Display Labels

Map tool names to user-friendly text for streaming/completed/error states. Teachers should never see raw tool names.

- **Static**: `createAssignment` → "Creating assignment..." / "Assignment created" / "Failed to create assignment"
- **Dynamic**: `switchMode` reads mode name from args → `"Switching to ${mode} mode..."`

---

## Production Patterns

- **Mandatory narration** — "Always write a brief message before calling any tool." Gives teachers visibility, creates planning checkpoints, feels collaborative
- **Two-stream pattern** — `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` auto-triggers new streams for multi-step workflows
- **Context persistence** — only `mode` persisted in `conversation.metadata`; all other context lives in message history (simple, no sync bugs, but long conversations may lose early context)
- **Tools are first-class infrastructure** — tool design receives as much engineering attention as the model integration itself
