# Frontend

## Component Primitives

**Every piece of frontend UI MUST be built from shadcn/ui primitives.**

- All atoms (Button, Input, Select, Dialog, Tabs, Card, Badge, etc.) come from shadcn/ui — never hand-rolled, never pulled from other component libraries
- Missing primitive → install via shadcn CLI first (`npx shadcn@latest add <component>`), then compose
- Custom components = **compositions of shadcn primitives** + Tailwind layout. Never re-implement a primitive that shadcn already ships
- Styling extensions via `className` + `cn()` helper only — never fork primitive source to restyle
- Tailwind v4 for layout, spacing (`gap-*`), colour tokens. No inline styles, no CSS modules, no styled-components

## Applies To

Both frontends — **Mobile Platform** and **Automotive Platform** — share the same shadcn primitive layer. Platform-specific surfaces compose the same atoms.
