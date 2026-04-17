# Skeleton Loading States

`loading.tsx` renders instantly while the RSC fetches data. It must feel like a frozen frame of the real page — same layout, same spacing, same visual weight — so the transition is seamless.

## Core Principles

- **Use real components, not raw divs** — compose skeletons from the same shadcn primitives the real page uses (`Card`, `CardHeader`, `CardContent`, etc.). This guarantees spacing, padding, and border styles match automatically.
- **Extract skeleton sub-components** — each distinct card or section type gets its own named skeleton function (`StatCardSkeleton`, `ClassCardSkeleton`). This keeps the page skeleton readable and mirrors how the real page composes components.
- **Zero layout shift** — the skeleton's grid, gap, padding, and sizing must exactly match the shell. When the real data resolves, nothing should jump.

## Good vs Bad

### Bad — raw `div` + `Skeleton` everywhere

```tsx
{
    /* Mimics a stat card with manual div styling */
}
<div className="flex flex-col items-center justify-center gap-1 p-6 min-h-36 rounded-lg bg-card border border-border">
    <Skeleton className="h-9 w-14" />
    <Skeleton className="h-3.5 w-20" />
</div>;
```

Problems:

- **Duplicates styling** that already exists in `Card` / `CardHeader` / `CardContent`
- **Drifts silently** — when the real component's padding or border changes, this skeleton won't follow
- **Harder to read** — a wall of utility classes obscures the semantic structure

### Good — real primitives with `Skeleton` content

```tsx
function StatCardSkeleton() {
    return (
        <Card size="sm">
            <CardHeader>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="size-4 rounded" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-16" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-3 w-28" />
            </CardFooter>
        </Card>
    );
}
```

Benefits:

- **Structurally identical** to the real `StatCard` — same slots, same spacing
- **Self-maintaining** — if `Card` padding changes, the skeleton updates automatically
- **Readable** — the component name tells you exactly what it represents

## Rules

1. **Always use real primitives** — `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Badge`, etc. Only fall back to raw `div` for layout wrappers (grids, flex containers) that don't have a component equivalent.
2. **One skeleton function per repeated element** — if the real page renders a list/grid of a component, extract a `{Component}Skeleton` function and repeat it.
3. **Match the real page's container structure** — same `container-id` attributes, same grid columns, same gap values. Copy the outer layout from the shell, then replace content with skeletons.
4. **`Skeleton` only replaces dynamic data** — static structural elements (dividers, section wrappers) render as-is. Only text, numbers, icons, and images that come from the server become `Skeleton` blocks.
5. **Server component only** — no `"use client"`, no hooks, no state. `loading.tsx` is a pure RSC.
6. **Size skeletons realistically** — match the approximate width and height of the real content. A page title skeleton should be wider than a label skeleton. Use the real component's sizing as reference.

## File Structure

```tsx
// Imports — shadcn primitives + Skeleton
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/primitives/card";
import { Skeleton } from "@/components/primitives/skeleton";

// =============================================================================
// Sub-component skeletons (one per repeated element type)
// =============================================================================

function StatCardSkeleton() {
    /* ... */
}
function ItemCardSkeleton() {
    /* ... */
}

// =============================================================================
// Page Skeleton (default export)
// =============================================================================

export default function FeatureLoading() {
    return (
        <div className="..." container-id="feature-page-content">
            {/* Section 1 */}
            <div className="grid grid-cols-4 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>

            {/* Section 2 */}
            <div className="grid grid-cols-3 gap-4">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
                <ItemCardSkeleton />
            </div>
        </div>
    );
}
```
