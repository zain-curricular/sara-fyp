# Barrel Exports

**Only export what external consumers actually use.** Grep before adding. Everything else stays internal.

## Client Barrel (`index.ts`)

Sections: database types, custom types, schemas, config, client utils/hooks.

```typescript
export type { Class, ClassInsert } from "@/lib/supabase/types";
export type { ClassWithCounts } from "./types";
export { createClassSchema } from "./schemas";
export { MAX_CLASS_NAME_LENGTH } from "./config";
```

## Server Barrel (`services.ts`)

Sections: data access, auth, services.

```typescript
import "server-only";
export { createClass, getClassesByTeacher } from "./_data-access/teacherDafs";
export { authenticateAndAuthorizeClass } from "./_auth/classAuth";
export { joinClassByCode } from "./_utils/joinClassByCode";
```

## Sub-Domain Barrels

Complex features have **root barrels** that re-export from sub-domain barrels. External consumers import from **root or sub-domain barrels** — never from private `_`-prefixed directories:

```typescript
// ✅ Root barrel — works for any export across the feature
import { AssignmentListItem } from "@/lib/features/assignments";

// ✅ Sub-domain barrel — for targeted imports when you know the domain
import { processAssignment } from "@/lib/features/assignments/parsing/services";

// ❌ Private directory — violates module boundary
import { createAssignmentQuestions } from "@/lib/features/assignments/parsing/_data-access/parsingDafs";
```

### Root Barrel Structure

The root `services.ts` re-exports from every sub-domain barrel, organized by section:

```typescript
import "server-only";

// Core
export { createAssignment, getAssignment, ... } from "./core/services";

// Parsing
export { processAssignment, ... } from "./parsing/services";

// Shared
export { authenticateAndAuthorizeAssignment, ... } from "./shared/services";
```

### When to Import from Root vs Sub-Domain

| Scenario | Import from |
|----------|-------------|
| External feature (analytics, reports) | Root barrel or sub-domain barrel |
| API route | Sub-domain barrel (more explicit) |
| Within the same sub-domain | Direct relative import (e.g., `./_data-access/foosDafs`) |
| Cross sub-domain (within feature) | **Sibling's barrel** (e.g., `../core/services`) |
