# Planning

**NEVER use `EnterPlanMode`.** All planning in Linear.

**NEVER create Linear documents.** Plans go in **issue description** (`save_issue` with `description`). Comments for progress updates only.

## Workflow

1. Identify or create Linear issue
2. Launch **Explore agents in parallel** for codebase context
3. Write plan in issue description
4. Wait for user approval before implementing

## Writing Style

Brutally concise. Every sentence earn its place.

**Include only:** problem, solution, architecture, implementation steps, context implementer need, file organisation

**Never include:** sub-issue breakdowns (visible in Linear), "Modified Files" lists (use file trees), filler/preamble, repeated content across parent and sub-issues

**Format:** bullets over prose, short fragments over sentences, mermaid only when it clarify flow, code blocks for schemas/SQL/file trees

## Issue Structure

### Simple — single issue

1. **Design Overview** — architecture, system fit, diagrams
2. **Context** — existing patterns, schemas, constraints
3. **Organisation** — annotated file tree (`# NEW` / `# CHANGED` / `# DELETED`)
4. **Implementation** — step-by-step, all relevant layers

### Complex — parent + sub-issues

**Split sub-issues by layer, not feature.** No repeated content across parent and children.

### Parent Issue

**Only** architecture and context. No implementation steps.

- **Design Overview** — system flow (mermaid), key decisions, system fit
- **Context** — infrastructure, existing patterns, schemas, constraints

### Sub-Issue Layers

Dependency chain flow downward. Each layer block next.

```
1. Data Model  →  2. Services  →  3. API Routes  →  4. Frontend (one per UI surface)  →  5. Testing
```

## Example Issue Tree

```
CUR-665 Classroom Collect Mode                          # PARENT — Design Overview, Context
├── CUR-689 "Data Model"                                # Organisation, Implementation (SQL)
├── CUR-702 "Services — Collect Sub-Domain"             # Overview, Organisation, Implementation (per function)
├── CUR-703 "API Routes — Collect Endpoints"            # Overview, Context, Endpoint table, Implementation (per route)
├── CUR-699 "Frontend — Mobile Submit Page"             # Overview, User Flow, Organisation
│   ├── CUR-710 "Hook — useCollectSubmission"           # State shape, method signatures, transitions
│   ├── CUR-711 "Hook — useCamera"                      # Lifecycle, error states, cleanup
│   ├── CUR-712 "Component — CodeEntryStep"             # Visual layout, interaction, states
│   ├── CUR-713 "Component — NameEntryStep"             # Visual layout, interaction, states
│   └── CUR-714 "Component — CameraCapture"             # Visual layout, interaction, states
├── CUR-700 "Frontend — [AssignmentId] Dashboard"       # Overview, User Flow, Organisation
│   ├── CUR-715 "Hook — useCollectionSession"           # State shape, method signatures, polling
│   ├── CUR-716 "Component — CollectButton"             # Visual layout, interaction, states
│   └── CUR-717 "Component — WhiteboardDisplay"         # Visual layout, interaction, states
├── CUR-696 "Marking Pipeline Integration"              # Organisation, Implementation (per modified file)
└── CUR-701 "Testing"                                   # Unit + integration test groups, blocked by implementation issues
```

Frontend sections numbered — one per hook, one per component. Hooks = state shape + method signatures. Components = visual layout + interaction + states.

## Shared Rules

- **Handoff-ready** — all context included, assume zero codebase knowledge
- Never skip relevant layer
- Every sub-issue link to dependencies (blocked-by) and related issues
