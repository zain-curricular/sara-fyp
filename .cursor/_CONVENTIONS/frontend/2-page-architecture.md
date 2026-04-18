# Page Architecture

## File Structure

Every page route follows this structure:

```
app/teacher/{feature}/
├── page.tsx              # Async RSC — auth, fetch, render shell
├── shell.tsx             # Client component — all interactivity
├── error.tsx             # Error boundary (PageErrorState + reset)
├── loading.tsx           # Skeleton (shadcn Skeleton primitives)
├── _components/          # Feature-specific components (kebab-case)
│   ├── feature-card.tsx
│   └── feature-form.tsx
└── _hooks/               # Route-scoped hooks
    └── useFeatureActions.ts
```

### Naming

- **Files:** kebab-case for all components (`class-card.tsx`, not `ClassCard.tsx`)
- **Directories:** underscore prefix for private (`_components/`, `_hooks/`)
- **Shell:** always `shell.tsx`, default export
- **Page:** always `page.tsx`, default export, async

## page.tsx — Server Component

The page does exactly three things:

1. **Authenticate** — `createClient()` + `supabase.auth.getUser()`, redirect if no user
2. **Fetch** — call a single service function, throw on error
3. **Render** — pass data to `<Shell />` as props

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/clients/serverClient";
import { getFeatureData } from "@/lib/features/{feature}/services";
import FeatureShell from "./shell";

export default async function FeaturePage({ searchParams }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/sign-in");

    const { data, error } = await getFeatureData(user.id);
    if (error || !data) throw new Error("Failed to load data");

    return <FeatureShell data={data} />;
}
```

**Rules:**

- No `"use client"` — this is a server component
- No hooks, no state, no event handlers
- Import services from server-only barrels (`/services`)
- Throw errors — they're caught by `error.tsx`

## shell.tsx — Client Component

The shell owns all interactivity. It receives server-fetched data as props and never fetches itself.

```typescript
"use client";

export default function FeatureShell({ data }: FeatureShellProps) {
    const router = useRouter();
    // hooks, state, derived values...

    return (/* JSX */);
}
```

**Rules:**

- `"use client"` at top
- Default export (imported by page.tsx)
- No data fetching — receives everything via props
- `router.refresh()` for post-mutation refresh (re-runs the RSC)
- Derived state computed inline or with `useMemo`

## error.tsx — Error Boundary

Catches errors thrown by the RSC. Receives `{ error, reset }` from Next.js.

```typescript
"use client";

import { PageErrorState } from "@/elements/dashboard";

export default function ClassesError({ reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col flex-1 min-h-0 p-10 relative overflow-auto">
            <PageErrorState
                title="Failed to load classes"
                description="Check your connection and try again."
                onRetry={reset}
            />
        </div>
    );
}
```

**Rules:**

- Must be `"use client"`
- `reset()` re-runs the server component
- Outer container matches the shell's root padding/layout
- User-friendly title and description (no technical details)

## loading.tsx — Skeleton

Renders immediately while the RSC fetches. Uses shadcn `Skeleton` primitives to mimic the page layout.

**Rules:**

- Server component (no `"use client"`)
- Matches the visual structure of the shell (same grid, same sections)
- Use `Skeleton` from `@/components/primitives/skeleton`
- Static content (headings, buttons) renders real — only data placeholders are skeletonised

## Data Flow

```
Browser request
    ↓
page.tsx          createClient() → auth → fetch → throw or render
    ↓ props
shell.tsx         hooks + state → derived values → render components
    ↓ props
_components/*     pure presentational, no data fetching
    ↓
user action       mutation hook → API call → router.refresh()
    ↓
page.tsx          re-runs server component with fresh data
```

Post-mutation pattern: hooks call `router.refresh()` on success, which re-runs the RSC and passes fresh data down through the shell.
