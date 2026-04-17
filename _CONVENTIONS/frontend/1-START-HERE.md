# Frontend Conventions

All teacher-facing pages follow the **RSC + Shell** pattern with shadcn primitives and Next.js boundaries.

```
page.tsx (async RSC)       Auth + data fetch, throws on error
    ↓ passes props
shell.tsx ("use client")   All interactivity, hooks, state
    ↓ renders
_components/*.tsx           Feature-specific UI components
```

## Boundaries

| File          | Role                        | Component Type |
| ------------- | --------------------------- | -------------- |
| `page.tsx`    | Auth, fetch, pass props     | Server (async) |
| `shell.tsx`   | State, hooks, orchestration | Client         |
| `error.tsx`   | Error boundary              | Client         |
| `loading.tsx` | Streaming skeleton          | Server         |

## Primitives

**All UI components use shadcn primitives** from `@/components/primitives/`. No legacy `@/elements/` imports in new code.

Shared composed components (e.g. `StatCard`, `GalleryView`) live in `@/components/` and wrap shadcn primitives.

## Files

[Page Architecture](./2-page-architecture.md) → [Layout & Spacing](./3-layout-and-spacing.md) → [Component Patterns](./4-component-patterns.md) → [Forms & Dialogs](./5-forms-and-dialogs.md) → [Skeleton Loading States](./6-skeleton-loading-states.md)
