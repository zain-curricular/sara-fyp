# Types & Schemas

## Where Types Live

| Category | Location | In barrel? |
|----------|----------|------------|
| Zod schemas + inferred types | `schemas.ts` | Yes |
| Shared custom types (list views, composites) | `types.ts` | If used externally |
| Single-consumer types | **Inline where used** | No |
| DB types (from Supabase) | Re-export in client barrel | If used externally |

**Rule:** If a type is only used in one file, define it there. Promote to `types.ts` only when shared across multiple files.

## Schemas as Source of Truth

Derive types with `z.infer` — never manually duplicate a schema as an interface:

```typescript
export const createClassSchema = z.object({
	name: z.string(),
	year: z.number(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;
```

Domain schemas compose from shared primitives in `lib/validation`:

```typescript
import { uuidValidation, paginationSchema } from "@/lib/validation";
export const querySchema = z.object({
	classId: uuidValidation.optional(),
	...paginationSchema.shape,
});
```

## schemas.ts vs types.ts

- **`schemas.ts`** — Zod objects + `z.infer` types. Anything that gets validated at runtime.
- **`types.ts`** — Hand-written interfaces for non-validated shapes: list views, joins, composites.

## Sub-Domain Type Ownership

In complex features with sub-domains, each sub-domain owns its own types:

| Rule | Example |
|------|---------|
| Types specific to a sub-domain live in that sub-domain | `parsing/types.ts` owns `AssignmentProcessingInput` |
| Types shared across sub-domains live in `shared/` | `shared/schemas.ts` owns `McqQuestionData` |
| Types only consumed externally still live where they're defined | `core/types.ts` owns `AssignmentListItem` (used by analytics, reports) |

**Never duplicate types across sub-domains.** If two sub-domains need the same type, move it to `shared/`.
