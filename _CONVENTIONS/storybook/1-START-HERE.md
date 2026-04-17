# Storybook

Visual development environment for reviewing full-page UI in isolation — no backend, no auth, no database.

## Stack

| Concern             | Tool                                                      |
| ------------------- | --------------------------------------------------------- |
| Framework           | `@storybook/nextjs-vite` (Vite-based, App Router support) |
| Story format        | CSF3 (Component Story Format 3)                           |
| Addons              | `addon-docs`, `addon-a11y`, `@chromatic-com/storybook`    |
| Interaction testing | `storybook/test` (`fn()`, `expect`, `userEvent`)          |

## Core Principle — Page-Level Stories Only

**Never write component-level stories.** Every story file covers an entire page route. One file per page route, placed next to `page.tsx`, covering every reachable UI state from that page — all components, all modals/dialogs, all data states, all error states.

## File Locations

```
apps/main/
├── .storybook/
│   ├── main.ts                 ← Build config (addons, story globs, static dirs)
│   ├── preview.tsx             ← Rendering config (providers, styles, decorators)
│   └── preview-head.html       ← Font loading (<link> tags, CSS variables)
└── src/
    └── app/teacher/assignments/
        ├── page.tsx
        └── assignments.stories.tsx      ← named after the page route
```

### Story Placement & Naming

- **One story file per page route**, placed directly next to `page.tsx`
- **File name matches the page route exactly** — e.g., `signup.stories.tsx` for the `/signup` route, `assignments.stories.tsx` for the `/assignments` route
- **No `_stories/` folders** — the story file sits as a sibling of `page.tsx`
- **No component-level stories** — individual components are covered within the page story

## Global Setup (preview.tsx)

Every story inherits:

1. **Full app stylesheet** — `src/styles/index.css` (Tailwind + theme + component styles)
2. **ClientProviders** — Auth, Theme, Sidebar contexts + Toaster
3. **Body classes** — `bg-background text-foreground antialiased font-sans` (mirrors `layout.tsx`)
4. **App Router mode** — `nextjs.appDirectory: true`

This means stories render with the same visual environment as the real app. You do **not** need to import styles or wrap with providers in individual stories.

## Scripts

```bash
# Dev server on port 6006
pnpm --filter main storybook

# Production build
pnpm --filter main build-storybook
```

## Reading Order

| #   | File                                      | What You'll Learn                                   |
| --- | ----------------------------------------- | --------------------------------------------------- |
| 1   | **You are here**                          | Stack, file locations, global setup                 |
| 2   | [Writing Stories](./2-writing-stories.md) | CSF3 anatomy, mock data, page stories, organisation |
| 3   | [Best Practices](./3-best-practices.md)   | Rules, common patterns, gotchas                     |
