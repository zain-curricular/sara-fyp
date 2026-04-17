# Page Objects & Fixtures

Two-phase process: audit the UI for stable identifiers, then model it. Skipping the audit leads to brittle selectors.

## Phase 1 — Audit the UI & Add Identifiers

Before writing any page object, **read every component the test will touch**.

### Step 1: Map the User Flow

Trace through the route's page component and its children. Note every element the test will interact with or assert on.

### Step 2: Check Locator Coverage

Categorise each element by locator strategy:

| Priority | Strategy           | When                                                    |
| -------- | ------------------ | ------------------------------------------------------- |
| 1        | `getByRole`        | Buttons, links, headings, tabs, dialogs, ARIA roles     |
| 2        | `getByLabel`       | Form inputs with `<label>`                              |
| 3        | `getByText`        | Visible text (use `{ exact: true }`)                    |
| 4        | `getByPlaceholder` | Inputs by placeholder only                              |
| 5        | `container-id`     | Structural containers, repeated rows, status indicators |
| 6        | `getByTestId`      | **Last resort**                                         |

```typescript
// ✅ Semantic
page.getByRole("button", { name: "Submit" });
page.getByLabel("Email address");

// ✅ Container-scoped semantic
page.locator("[container-id='submissions-header']").getByRole("button", {
    name: "Upload",
});

// ❌ CSS selectors / positional selectors
page.locator(".btn-primary");
row.locator("td").nth(2);
```

### Step 3: Add Missing Identifiers

If an element can't be reliably targeted with priorities 1–4, add `container-id` to the **source component**.

**Add when:** repeated structures (rows, cards), status indicators, action zones, structural containers (dialogs, wizard steps), ambiguous elements where role alone can't distinguish.

**Don't add when:** already targetable via role/label/text, static unique elements, internal implementation details.

**Naming:** kebab-case, domain-scoped — `submission-status`, `submission-row`, `upload-wizard-modal`.

```tsx
// Source component — add container-id to targetable elements
cell: ({ row }) => (
	<div container-id="submission-status">
		<StatusBadge status={row.original.status} config={CONFIG} />
	</div>
),
```

**Form fields** use `data-container-id` (form library constraint). Pass `containerId` prop to `FormFieldWrapper`:

```tsx
<SelectField
    control={form.control}
    name="topics"
    containerId="field-topics"
    label="Topics"
/>
```

```typescript
// Page object targets with:
this.topicSelect = page
    .locator("[data-container-id='field-topics']")
    .getByRole("combobox");
```

---

## Phase 2 — Create the Page Object

### Step 1: Create the File

Place in `__e2e__/pages/{route}/` matching the app route name. Feature-scoped dialogs go in `components/` subfolder. Shared components (nav, sidebar) go in `pages/shared/components/`.

```
pages/classes/
├── classes.page.ts
└── components/
    ├── create-class-dialog.component.ts
    └── add-student-dialog.component.ts
```

### Step 2: Define Locators & Methods

```typescript
import { type Locator, type Page } from "@playwright/test";
import { navigateAuthenticated } from "../../helpers/navigation";

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByLabel("Email address");
        this.passwordInput = page.getByLabel("Password");
        this.submitButton = page.getByRole("button", { name: "Sign in" });
    }

    async goto() {
        await this.page.goto("/login");
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}
```

**Authenticated page objects** use `navigateAuthenticated()` in their `goto()` method — this handles intermittent GoTrue middleware redirect flakes:

```typescript
async goto(classId: string) {
	await navigateAuthenticated(this.page, `/teacher/classes/${classId}`);
}
```

**Container-scoped elements** — chain container with semantic locator:

```typescript
this.uploadButton = page
    .locator("[container-id='submissions-header']")
    .getByRole("button", { name: "Upload Submissions" });
```

**Indexed rows:**

```typescript
getSubmissionRows(): Locator {
	return this.submissionsTable.locator("[container-id='submission-row']");
}
```

### Step 3: Compose Shared Components

```typescript
export class ClassDashboardPage {
    readonly navigation: NavigationComponent;
    readonly heading: Locator;

    constructor(page: Page) {
        this.navigation = new NavigationComponent(page);
        this.heading = page.getByRole("heading", { name: "Dashboard" });
    }
}
```

### Step 4: Register in Fixtures

Add to `__e2e__/fixtures/index.ts` — tests receive page objects via dependency injection:

```typescript
export const test = base.extend<CustomFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});
export { expect } from "@playwright/test";
```

Default to **test-scoped** fixtures (fresh per test). Only use `{ scope: "worker" }` for expensive shared setup.

---

## Navigation Helper

`navigateAuthenticated(page, url)` handles an intermittent middleware flake where GoTrue doesn't respond in time, causing a redirect to `/login`:

1. Navigate to target URL
2. If landed on `/login` (middleware redirect), wait for login page to detect valid session and auto-redirect
3. Retry original navigation
4. Wait for app loading overlay to disappear (30s timeout)

**Used by:** all authenticated page objects' `goto()` methods.

---

## Rules

- **One class per page or major component**
- **Locators as readonly properties** — defined in constructor
- **Methods return `void`** — never return other page objects
- **No assertions in page objects** — page objects describe _what the user can do_, tests describe _what should happen_
- **Use fixtures** — never instantiate page objects in tests
- **Use `navigateAuthenticated()`** in all authenticated page object `goto()` methods
