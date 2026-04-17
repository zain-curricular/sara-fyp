# Layout & Spacing

## Gap Scale

Use `gap-*` for **all** spacing. Never use `space-*` utilities or child margins.

| Token     | Use Case                                          |
| --------- | ------------------------------------------------- |
| `gap-1`   | Tight groups (section header + separator)         |
| `gap-1.5` | Badge collections, compact inline groups          |
| `gap-3`   | Section internals (tabs + grid, header + content) |
| `gap-4`   | Major sections (stats → cards, grid children)     |
| `gap-6`   | Form section separation                           |

## Root Container

Every shell has a consistent root container:

```typescript
<div
    className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto"
    container-id="feature-page-content"
>
```

- `flex-1 min-h-0` — fills available height
- `p-4` — standard page padding
- `overflow-auto` — scrolls when content overflows
- `container-id` — testing/debugging identifier

## Grid Layouts

### Stats Row

```typescript
<div className="grid grid-cols-4 gap-4">
    <StatCard ... />
</div>
```

### Card Gallery

```typescript
<div className="grid grid-cols-3 gap-4">
    {items.map((item) => <FeatureCard ... />)}
</div>
```

- Grid gap is always `gap-4`
- Column count varies by content: stats = 4, cards = 3, form fields = 2
- Tag grids with `container-id` for testing

## Flexbox Patterns

```typescript
// Vertical stack
<div className="flex flex-col gap-4">

// Header row (title left, action right)
<div className="flex items-center justify-between">

// Fill parent height
<div className="flex flex-col flex-1 min-h-0">

// Section with separator
<div className="flex flex-col gap-1">
    <h3 className="text-xs font-medium text-muted-foreground">Title</h3>
    <Separator />
</div>
```

## Container IDs

Every major layout section gets a `container-id` attribute:

```typescript
container-id="classes-page-content"
container-id="classes-stats"
container-id="classes-card-grid"
```

Used for Playwright selectors and devtools debugging. Format: `{feature}-{section}`.

## Conditional Layout

Empty states fill the parent with `flex-1 min-h-0`:

```typescript
{!hasItems ?
    <div className="flex flex-col flex-1 min-h-0">
        <EmptyState onAction={handleAction} />
    </div>
:   <div className="flex flex-col gap-4">
        {/* content */}
    </div>
}
```
