# Component Patterns

## Import Order

Group imports in this order, separated by blank lines:

1. React / Next.js (`useState`, `useRouter`, `redirect`)
2. Third-party (`lucide-react`, `sonner`, `react-hook-form`)
3. Feature modules (`@/lib/features/*` — types, configs, hooks)
4. Shared components (`@/components/*` — primitives, composed components)
5. Local components (relative `./` imports)

```typescript
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";

import type { ClassWithCounts } from "@/lib/features/classes";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/primitives/button";

import { ClassCard } from "./_components/class-card";
import { useClassActions } from "./_hooks/useClassActions";
```

Use `import type` for type-only imports.

## shadcn Primitive Usage

### Card Composition

Cards are assembled from semantic slots:

```typescript
<Card size="sm" className="...">
    <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Subtitle</CardDescription>
        <CardAction>{/* icon button / menu */}</CardAction>
    </CardHeader>
    <CardContent>{/* main content */}</CardContent>
    <CardFooter>{/* secondary info */}</CardFooter>
</Card>
```

- Use `size="sm"` for dashboard cards
- `CardAction` places an element top-right of the header
- Add `cursor-pointer hover:bg-accent/50` for clickable cards

### Badges

```typescript
<Badge variant="secondary">{classData.exam_board}</Badge>
<Badge variant="green">{score}% avg</Badge>
```

- `secondary` — metadata labels (exam board, exam level)
- `green` / `amber` / `red` — status indicators mapped from thresholds
- All badges use `rounded-sm` (not pills)

### Tabs (Filter Pattern)

```typescript
<Tabs value={filter} onValueChange={setFilter}>
    <TabsList variant="line">
        <TabsTrigger value="all">All</TabsTrigger>
        {options.map((opt) => (
            <TabsTrigger key={opt} value={opt}>{opt}</TabsTrigger>
        ))}
    </TabsList>
</Tabs>
```

- `variant="line"` for underline-style filter tabs
- No `TabsContent` — filtering is handled externally via state
- Tabs placed in a header row with `justify-between` and an action button

### Dropdown Menu (Card Actions)

```typescript
<CardAction>
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6"
                    onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="size-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40"
                             onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 /> Delete
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</CardAction>
```

- `stopPropagation()` on trigger **and** content to prevent parent card click
- `align="end"` for right-aligned menus
- Destructive actions use `variant="destructive"`

### Alert Dialog (Destructive Confirmations)

```typescript
<AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete <strong>{name}</strong>...
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Deleting…" : "Delete Class"}
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

- `<strong>` for entity names within descriptions
- Buttons disabled during async operations
- Button text changes to reflect loading state

## Icons

All icons from `lucide-react`, imported by name:

```typescript
import { Plus, Users, MoreHorizontal, Trash2 } from "lucide-react";
```

- `size-4` — standard icon size in buttons and badges
- `size-2` — small indicators (sidebar colour dots)
- `size-8` — large decorative icons (empty states)

## Status Badges

Map data to coloured badge variants for visual indicators:

- `green` / `amber` / `red` — for performance tiers or status
- `secondary` — for neutral metadata (no data, labels)

Use centralised threshold constants from feature config — don't hardcode thresholds in components.

## Ghost Cards (Add New)

Dashed-border cards for "add new" actions sit inside the grid alongside real cards:

```typescript
<Card
    size="sm"
    onClick={openModal}
    className="cursor-pointer items-center justify-center border border-dashed
               border-muted-foreground/25 bg-transparent text-muted-foreground
               ring-0 hover:border-muted-foreground/50 hover:text-foreground"
>
    <div className="flex flex-col items-center gap-2">
        <Plus className="size-4" />
        <span className="text-sm font-medium">Add new class</span>
    </div>
</Card>
```
