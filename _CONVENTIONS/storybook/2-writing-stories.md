# Writing Stories

## File Anatomy

Every story file has five sections in this order:

```
1. File header       ← standard // ============ block
2. Mock data         ← constants used across stories
3. Helpers           ← fetch mocks, state setup functions
4. Meta              ← component, shared args, decorators
5. Stories           ← named exports grouped by view area
```

### Imports

Always import types from `@storybook/nextjs-vite` (not `@storybook/react`):

```typescript
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
```

### Meta

Use `satisfies Meta<typeof Component>` — provides type safety while preserving literal types for `StoryObj` inference:

```typescript
const meta = {
    component: AssignmentsPage,
    parameters: {
        layout: "fullscreen",
        nextjs: {
            navigation: { pathname: "/teacher/assignments" },
        },
    },
} satisfies Meta<typeof AssignmentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;
```

- **`satisfies`** instead of `as` — catches type errors without widening
- **`type Story`** derived from `typeof meta` — not from the component directly
- **`fn()`** for every callback prop — logs to the Actions panel and is spy-able in play functions

## Render the Real Page

**Always import and render the actual `page.tsx` component directly.** Never create inline "page shell" wrappers that replicate the page layout — these drift out of sync and defeat the purpose of Storybook.

```typescript
// GOOD — renders the real page
import AssignmentsPage from "./page";

const meta = {
    component: AssignmentsPage,
    parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AssignmentsPage>;
```

```typescript
// BAD — inline replica of the page layout (will drift)
function AssignmentsPageShell() {
	return (
		<div className="flex flex-col">
			<AssignmentsTable data={[]} />
		</div>
	);
}
```

Most page components in this project are server components that only compose client components without fetching data — these render in Storybook without issue via `@storybook/nextjs-vite`.

## Story Organisation — Group / View

Page story files cover **every reachable UI state** from that page. Because this produces large files, strict organisation is critical.

### Grouping Rules

1. **Group stories by view area** — tabs, dialogs, panels, sections of the page
2. **Order groups chronologically** — match the user's natural flow through the page
3. **Use flat `UpperCamelCase` names** — section headers provide grouping in the file
4. **Within a group, order stories from happy path → edge cases → error states**

### Naming Convention

Story exports use **flat `UpperCamelCase`** — no prefixes, no underscores. Group context comes from the **section header** above the export, not the export name itself:

```typescript
// -----------------------------------------------------------------------------
// Assignment Tab
// -----------------------------------------------------------------------------

/** Empty state — no assignments created yet. */
export const Empty: Story = {
    /* ... */
};

/** Many assignments with mixed statuses. */
export const ManyAssignments: Story = {
    /* ... */
};

/** API error loading assignments. */
export const Error: Story = {
    /* ... */
};

// -----------------------------------------------------------------------------
// Student Tab
// -----------------------------------------------------------------------------

/** Default student list with multiple students. */
export const StudentList: Story = {
    /* ... */
};

/** Empty class — no students enrolled. */
export const NoStudents: Story = {
    /* ... */
};

// -----------------------------------------------------------------------------
// Add Student Dialog
// -----------------------------------------------------------------------------

/** Dialog open with empty form. */
export const AddStudentDialog: Story = {
    /* ... */
};

/** Validation error — duplicate email. */
export const AddStudentDuplicateEmail: Story = {
    /* ... */
};
```

The sidebar shows flat names like "Empty", "Many Assignments", "Student List". Section headers in the file provide grouping context for the reader — Storybook's sidebar does not create sub-groups from export names.

### What to Cover

For each page, cover **all** of the following that exist:

- **Default / happy path** for each view area
- **Empty states** — no data, first-time user
- **Populated states** — realistic amounts of data
- **Loading states** — if the UI shows a skeleton or spinner
- **Error states** — API failures, validation errors
- **Dialogs and modals** — opened state for every dialog reachable from the page
- **Different component states** — expanded/collapsed, selected/unselected, disabled
- **Form states** — pristine, filled, validation errors, submitting, submitted

### What NOT to Cover

- **Toast-only differences** — if the only visible change is a toast notification (no inline UI change), don't create a story. Toasts are ephemeral overlays, not visual states of the page.

## Mock Data

Define mock data at the module level between imports and meta. Use clear section headers:

```typescript
// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: "asgn-1",
        title: "Quadratic Equations Homework",
        status: "active",
        due_date: "2026-03-25",
        student_count: 28,
    },
    {
        id: "asgn-2",
        title: "Trigonometry Quiz",
        status: "draft",
        due_date: null,
        student_count: 0,
    },
];
```

- **`UPPER_SNAKE_CASE`** for mock constants
- **Typed** against the component's expected interfaces
- **Realistic values** — use plausible UK school data, not `"test"` / `"foo"`
- **Shared across stories** in the same file — each story selects what it needs via args

## Decorators

Use decorators when the page needs extra wrapping. Most pages use `fullscreen` layout and control their own width — decorators are less common for page stories.

- Define at **meta level** when all stories share the same wrapper
- Define at **story level** when only specific stories need it
- Global decorators (providers, body classes) are already handled in `preview.tsx` — don't duplicate them

## Parameters

### Layout

Page stories always use `fullscreen`:

```typescript
parameters: {
	layout: "fullscreen",
}
```

### Next.js Navigation

Mock route information for components that read from `usePathname()`, `useRouter()`, etc:

```typescript
parameters: {
	nextjs: {
		navigation: {
			pathname: "/teacher/assignments",
			query: { id: "123" },
		},
	},
},
```

## Internal States Behind API Calls

When a page has states gated behind an API call (e.g. a success screen after form submission), use **play functions + fetch mocking** to reach that state naturally.

**Pattern:** Mock `window.fetch` in `beforeEach`, then use `userEvent` in `play` to trigger the interaction — the component transitions to the state via its own logic.

```typescript
/** Mock fetch so the form submission succeeds. */
function withSuccessfulFetch() {
    const originalFetch = window.fetch;
    window.fetch = async () =>
        new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    return () => {
        window.fetch = originalFetch;
    };
}

export const SignupForm_CheckEmail: Story = {
    beforeEach: withSuccessfulFetch,
    play: async ({ canvas, userEvent }) => {
        const emailInput = canvas.getByLabelText("Email");
        await userEvent.type(emailInput, "teacher@school.ac.uk");

        const submitButton = canvas.getByRole("button", {
            name: /send reset link/i,
        });
        await userEvent.click(submitButton);
    },
};
```

**Key points:**

- **Always clean up** — return a teardown function from `beforeEach` to restore `window.fetch`
- The play function shows the state _in context_ within the real page

## State Setup with `beforeEach`

Pages often depend on client-side state (sessionStorage, localStorage). Use `beforeEach` with a helper that returns a cleanup function:

```typescript
function withWizardState(state: WizardState) {
    return () => {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));

        return () => {
            sessionStorage.removeItem(SESSION_KEY);
        };
    };
}

export const Onboarding_ProfileStep: Story = {
    beforeEach: withWizardState({
        currentStep: "profile",
        classIds: [],
        studentCounts: {},
        classInfo: {},
    }),
};
```

- **Always clean up** — return a teardown function from `beforeEach` to prevent state leaking between stories

## Unreachable States (Supabase-Dependent Views)

Some pages have internal views gated behind Supabase auth flows (e.g. MFA challenge after login). These states can't be reached via play functions because the Supabase client makes real network requests that can't be reliably mocked via `window.fetch`.

**When a state is unreachable via interaction**, render the child component directly in a `render` function using the page's layout structure:

```typescript
import { AuthHeader } from "@/components/auth-header";
import { MFAChallengeForm } from "./_components/mfa-challenge-form";

/** MFA challenge view — shown after successful password login. */
export const MFAChallenge: Story = {
    render: () => (
        <div className="bg-background flex min-h-svh flex-col">
            <AuthHeader />
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <MFAChallengeForm onVerified={fn()} onCancel={fn()} />
                </div>
            </div>
        </div>
    ),
};
```

This is an **exception** to the "render the real page" rule. It's better to show the actual component in a matching layout than to have a broken story that never reaches the state.

## File Header

Follow the project's standard header format. Include a **Dependencies** section and a **Views** section listing all groups covered:

```typescript
// ============================================================================
// Assignments Page Stories
// ============================================================================
//
// Full-page story covering the assignments dashboard. Renders the real
// page.tsx — no inline replica.
//
// Views
// -----
// 1. Assignment Tab     — empty, populated, error
// 2. Student Tab        — default, empty
// 3. Add Student Dialog — default, validation error
//
// Dependencies
// ------------
// - SessionStorage: used for filter persistence (works in Storybook)
// - next/navigation: router.push mocked by Storybook's App Router support
// - API calls (fetch): mocked in stories that need specific responses
```

The **Views** section gives the reader a table of contents at a glance. The **Dependencies** section tells them what works and what doesn't.
