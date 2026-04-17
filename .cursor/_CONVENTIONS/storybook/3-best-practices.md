# Best Practices

## Rules

1. **Page-level stories only.** Never write component-level stories. Every story file covers an entire page route. One file, one page, all states.

2. **Every reachable UI state gets a story.** Empty, loading, populated, error, dialogs open, form validation — if the user can see it from this page, it's a story.

3. **Stories are declarative data, not code.** Prefer `args` over custom `render` functions. Only use `render` when you need to compose multiple components or add wrapper markup that isn't a decorator.

4. **Use `fn()` for all callbacks.** Never use `action()` — `fn()` from `storybook/test` logs to Actions panel _and_ works as a spy in play functions.

5. **Always spread args in render functions.** If you use a custom `render`, spread args onto the component to preserve the Controls panel:

    ```typescript
    render: (args) => (
    	<div className="special-wrapper">
    		<MyComponent {...args} />
    	</div>
    ),
    ```

6. **Don't duplicate global setup.** `preview.tsx` already handles providers, styles, and body classes. Individual stories should never import `index.css` or wrap with `ClientProviders`.

7. **Document limitations.** When a page depends on APIs or Supabase that aren't mocked, note this in the file header. Explain what renders correctly and what doesn't.

8. **Never duplicate component markup in stories.** If a component has an internal state you need to preview (e.g. a success screen behind an API call), use play functions with fetch mocking to reach the state naturally. Never copy the parent's layout into the story file. See [Internal States Behind API Calls](./2-writing-stories.md#internal-states-behind-api-calls).

9. **Render the real page.** Always import the actual `page.tsx` default export — never create inline "page shell" wrappers that replicate the layout.

10. **Keep groups chronological.** Order story groups to match the user's natural journey through the page. Within a group, go from happy path to edge cases to errors.

11. **No toast-only stories.** If the only visual difference is a toast notification, don't create a story — the page layout is identical and toasts are ephemeral.

12. **Render child components for unreachable states.** When internal states are gated behind Supabase auth flows that can't be mocked, render the child component directly in a `render` function using the page's layout structure. This is better than a broken story.

## Naming

| Type           | Convention                 | Examples                                            |
| -------------- | -------------------------- | --------------------------------------------------- |
| Story file     | `{route-name}.stories.tsx` | `signup.stories.tsx`, `assignments.stories.tsx`     |
| Story export   | Flat `UpperCamelCase`      | `Default`, `FilledIn`, `MFAChallenge`, `NoStudents` |
| Section header | `// --- Group Name ---`    | `// --- Login Form ---`, `// --- MFA Challenge ---` |
| Mock constants | `UPPER_SNAKE_CASE`         | `MOCK_ASSIGNMENTS`, `MOCK_STUDENTS`                 |

## What to Write Stories For

### Good candidates

- **Any page route** with a `page.tsx` — every page gets a story

### Poor candidates

- **Individual components** — covered within the page story, not in isolation
- **Server components that fetch data** at render time (async data loading won't execute)
- **Layout components** that only add padding/margins

> **Note:** Server components that only _compose_ client components (no `async`, no data fetching) render fine in Storybook. Most page components in this project fall into this category — always render the real page, don't create replicas.

## Managing Large Story Files

Page stories get big. These practices keep them maintainable:

1. **File header with a Views section** — list every group as a numbered table of contents
2. **Section headers between groups** — use `// ---` separator blocks so you can scan the file
3. **Chronological group order** — matches the user's journey, not alphabetical
4. **Consistent naming** — flat `UpperCamelCase` throughout, no mixing conventions
5. **Mock data at the top** — all `MOCK_*` constants in one section before meta
6. **Helpers after mock data** — `withSuccessfulFetch()`, `withWizardState()` etc.
7. **One concern per story** — don't combine "empty tab + dialog open" into one story

## Mocking Boundaries

Storybook runs in the browser. Some things work automatically, others don't:

| Works in Storybook                                      | Doesn't work                          |
| ------------------------------------------------------- | ------------------------------------- |
| `next/navigation` (auto-mocked)                         | Supabase client queries               |
| `next/image` (auto-handled)                             | Server actions                        |
| `next/font` (Google Fonts loaded via preview-head.html) | Server-side `cookies()` / `headers()` |
| `sessionStorage` / `localStorage`                       | Database access                       |
| Client context providers (via `preview.tsx`)            |                                       |
| `fetch` (mockable via `beforeEach` — see below)         |                                       |

**When a page needs data from the server:**

- If the component accepts the data as **props** — mock the data in story args. This is the preferred approach.
- If the component fetches data **internally via `fetch`** — mock `window.fetch` in `beforeEach` and use a play function to trigger the interaction. See [Internal States Behind API Calls](./2-writing-stories.md#internal-states-behind-api-calls).
- If the component uses **Supabase client queries** — document the limitation in the file header. The component will render its loading/empty state.

## Decorator Chain Must Match the Real Layout

Story decorators must replicate the **exact wrapper hierarchy** from the app's layout files — including structural `div` wrappers with layout classes, not just providers. Mismatched wrappers cause broken flex layouts, missing height constraints, and incorrect rendering.

**How to get it right:** Open the real layout file (e.g. `app/teacher/layout.tsx`) and copy the nesting order into the decorator. Include every provider, every structural `div` with its `className`, and every `container-id`.

**Teacher page example** (matches `app/teacher/layout.tsx`):

```typescript
decorators: [
    (Story) => (
        <BreadcrumbProvider>
            <Suspense>
                <AtlasConversationProvider>
                    <FeatureFlagProvider>
                        <div className="flex flex-col h-screen" container-id="teacher-layout">
                            <div className="flex-1 min-h-0">
                                <AppShell config={teacherConfig}>
                                    <Story />
                                </AppShell>
                            </div>
                        </div>
                    </FeatureFlagProvider>
                </AtlasConversationProvider>
            </Suspense>
        </BreadcrumbProvider>
    ),
],
```

**Common mistakes:**

- Skipping structural `div` wrappers (e.g. the `h-screen` flex container) — causes flex children to lose height constraints
- Forgetting `FeatureFlagProvider` — feature-flagged tabs/buttons silently don't render
- Wrong nesting order — providers must match the real layout's order exactly

## Common Patterns

### Composing story args

Build on previous stories to avoid repetition:

```typescript
export const AssignmentTab_Error: Story = {
    args: {
        ...AssignmentTab_Default.args,
        error: "Failed to load assignments",
    },
};
```

### Reusing mock data across stories

Select subsets from a shared mock object:

```typescript
export const AssignmentTab_Single: Story = {
    args: {
        assignments: [MOCK_ASSIGNMENTS[0]!],
    },
};

export const AssignmentTab_Many: Story = {
    args: {
        assignments: MOCK_ASSIGNMENTS,
    },
};
```

## Section Headers

Use the project's standard dashed separator between groups in story files:

```typescript
// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Meta
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Assignment Tab
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Student Tab
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Add Student Dialog
// -----------------------------------------------------------------------------
```

This keeps large story files scannable and consistent with the rest of the codebase.
