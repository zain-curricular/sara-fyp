# Feature Module Conventions

Every feature lives in `src/lib/features/{feature}/` with a **two-barrel pattern** and strict privacy boundaries.

## Simple Feature (Single Domain)

```
feature/
├── index.ts           # Client barrel (types, schemas, config, hooks)
├── services.ts        # Server barrel (import "server-only")
├── types.ts           # Hand-written interfaces (list views, composites)
├── schemas.ts         # Zod schemas + z.infer types
├── config.ts          # Constants, enums, thresholds
├── _data-access/      # Pure DB queries (one file per entity)
├── _auth/             # Authorization orchestrators
├── _utils/            # Service orchestrators + business logic
└── __tests__/         # Colocated tests
```

## Complex Feature (Sub-Domains)

When a feature grows beyond a single concern, split into **sub-domains** — each with its own barrel pair. A `shared/` sub-domain holds cross-cutting infrastructure.

```
feature/
├── index.ts           # Root client barrel (re-exports from sub-domains)
├── services.ts        # Root server barrel (re-exports from sub-domains)
│
├── core/              # Primary entity CRUD
│   ├── index.ts       # Sub-domain client barrel
│   ├── services.ts    # Sub-domain server barrel
│   ├── types.ts, schemas.ts, config.ts
│   └── _data-access/, _utils/
│
├── {capability}/      # Each distinct capability gets its own sub-domain
│   ├── services.ts    # Sub-domain server barrel
│   └── _internal/     # Private implementation
│
└── shared/            # Cross-cutting infrastructure (auth, storage, config)
    ├── index.ts       # Sub-domain client barrel
    ├── services.ts    # Sub-domain server barrel
    └── _auth/, _utils/, config.ts
```

## Core Rules

- **Client barrel** (`index.ts`) — safe everywhere. Types, schemas, config, hooks.
- **Server barrel** (`services.ts`) — `import "server-only"`. DAFs, auth, services.
- **`_` prefix** = private. External code imports via barrels only.
- **`import "server-only"`** goes in `services.ts` barrels and in files that use server-only APIs directly — not redundantly in every file.
