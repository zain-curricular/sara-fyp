# Best Practices

## File Naming

- **One DAF file per entity** — `assignmentDafs.ts`, `questionDafs.ts`
- **One auth file per entity** — `assignmentAuth.ts`, `classAuth.ts`
- **`__tests__/`** colocated at same level as the code they test
- **Config always client-safe** — `config.ts`, exported from client barrel

## Module Boundaries

### The `_` Prefix Contract

Directories prefixed with `_` are **private implementation details**. The only code that may import from a `_`-prefixed directory is code **within the same sub-domain**.

```typescript
// ✅ Within marking sub-domain — direct private import
import { getSubmissionsByStatus } from "../_data-access/submissionDafs";

// ❌ Cross sub-domain — must use barrel
import { getAssignment } from "../../core/_data-access/assignmentDafs";

// ✅ Cross sub-domain — through barrel
import { getAssignment } from "../../core/services";
```

### Cross Sub-Domain Rules

| Direction | Rule |
|-----------|------|
| Sub-domain → sibling sub-domain | **Always through sibling's barrel** (`../core/services`) |
| Sub-domain → `shared/` | **Always through `shared/services` or `shared/config`** |
| External feature → this feature | **Through root barrel or sub-domain barrel** |
| Within same sub-domain | **Direct relative imports** to private dirs are fine |

### Test Mocks Follow the Same Boundaries

When mocking in tests, mock at the barrel level — not the private file:

```typescript
// ✅ Mock the barrel the source file imports from
vi.mock("../../core/services", () => ({
	getAssignment: vi.fn(),
}));

// ❌ Mock the private file directly
vi.mock("../../core/_data-access/assignmentDafs", () => ({
	getAssignment: vi.fn(),
}));
```

## When to Split into Sub-Domains

A feature should remain flat (single domain) until it has **multiple distinct capabilities** operating on the same data. Signs you need sub-domains:

- **3+ unrelated concerns** in one `services.ts` barrel (e.g., CRUD + AI pipeline + PDF export)
- **Files that never import each other** bundled in the same directory
- **Different external consumers** for different parts of the feature

### Sub-Domain Naming

| Name | Role | When to Use |
|------|------|-------------|
| `core/` | Primary entity CRUD | Always — the foundational data layer |
| `shared/` | Cross-cutting infrastructure | When auth, config, or utilities are used by all sub-domains |
| `{capability}/` | Distinct capability | One per distinct concern (e.g., `parsing/`, `export/`, `marking/`) |

### What Goes in `shared/` vs `core/`

| `shared/` | `core/` |
|-----------|---------|
| Auth helpers | Entity CRUD |
| Storage/upload utilities | Entity-specific config |
| AI model constants | Entity types and schemas |
| Cross-cutting utilities (document formatting) | Composite services (validate + update) |
| Things used by **all** sub-domains | Things used by **external** features |

## Directory Flattening

**Flatten single-file wrapper directories.** If a private directory (`_orchestrators/`, `_utils/`, `_hooks/`, etc.) contains exactly **one file**, promote that file to the parent directory and remove the wrapper.

```
# ❌ Unnecessary wrapper — one file in _orchestrators/
student/
├── _orchestrators/
│   └── studentAnalytics.ts
└── _utils/
    ├── computeBreakdown.ts
    └── computeConsistency.ts

# ✅ Flattened — file promoted to parent
student/
├── studentAnalytics.ts
└── _utils/
    ├── computeBreakdown.ts
    └── computeConsistency.ts
```

**Keep the directory** when it contains **2+ files** — the grouping is meaningful.

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Exporting everything from barrel | Only export what consumers import |
| Types in `types.ts` used by one file | Inline where used |
| Duplicating types across sub-domains | Move to `shared/` |
| Importing from sibling's `_` directory | Import from sibling's barrel |
| Duplicating Zod schema as interface | `z.infer<typeof schema>` |
| Config inside service internals | Move to `config.ts` |
| Sub-domain for every file | Only split when there are distinct capabilities |
| `shared/` as a dumping ground | Only infrastructure — not business logic |
| Single-file wrapper directory | Promote file to parent, remove wrapper |
