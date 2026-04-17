# Writing E2E Tests

## Test File Structure

```typescript
import { test, expect } from "../../fixtures";
import { readManifest } from "../../helpers/manifest";

const SPEC = "class-creation";
const AUTH_FILE = `__e2e__/.playwright/auth/${SPEC}.json`;

test.describe("Class Creation", () => {
    test.use({ storageState: AUTH_FILE });

    let m: Record<string, unknown>;

    test.beforeAll(async () => {
        m = readManifest(SPEC);
    });

    test("teacher creates a new class", async ({ classesPage, page }) => {
        await classesPage.goto();
        // ...
    });
});
```

**Key patterns:**

- **Import `test`/`expect` from `../../fixtures`** — never from `@playwright/test` directly
- **`SPEC` constant** matches the seed's `specName`
- **`AUTH_FILE`** points to the pre-generated storageState
- **`readManifest(SPEC)`** in `beforeAll` retrieves all pre-seeded IDs
- **Test names describe the user journey** — "teacher creates a new class"

## Accessing Seed Data

The manifest provides all IDs and credentials created during global setup:

```typescript
test.beforeAll(async () => {
    m = readManifest(SPEC);
});

test("example", async ({ submissionReviewPage }) => {
    const classId = m.classId as string;
    const assignmentId = m.assignmentId as string;
    const submissionId = m.submissionIds[0] as string;

    await submissionReviewPage.goto(classId, assignmentId, submissionId);
});
```

## Multi-Step Flows

Use `test.step()` for long journeys — steps appear in trace viewer and HTML report:

```typescript
test("teacher uploads and publishes an assignment", async ({ page }) => {
    await test.step("upload the assignment PDF", async () => {
        /* ... */
    });
    await test.step("review extracted questions", async () => {
        /* ... */
    });
    await test.step("publish the assignment", async () => {
        /* ... */
    });
});
```

> Prefer `test.step()` over `test.describe.serial` for multi-step flows. Serial describes create cascading failures.
>
> **Exception:** `test.describe.configure({ mode: "serial" })` is appropriate when independent tests **read** expensive shared `beforeAll` data (e.g. a class with submissions). Serial ensures one worker, so `beforeAll` fires once.

## Assertions

### Web-First (Always Use)

Auto-retry until condition met or timeout:

```typescript
// ✅ Web-first — retries automatically
await expect(page.getByText("Welcome")).toBeVisible();
await expect(page).toHaveURL("/dashboard");

// ❌ One-shot — races with the DOM
const isVisible = await page.getByText("Welcome").isVisible();
```

### Common Assertions

| Assertion                          | Use For                        |
| ---------------------------------- | ------------------------------ |
| `toBeVisible()` / `toBeHidden()`   | Element visibility             |
| `toHaveText()` / `toContainText()` | Text content (exact / partial) |
| `toHaveURL(/pattern/)`             | URL matches                    |
| `toHaveCount(n)`                   | Element count                  |
| `toBeEnabled()` / `toBeDisabled()` | Form input state               |
| `toHaveValue()`                    | Input field value              |

## Waiting

Playwright actions (`click`, `fill`) **auto-wait** for actionability. Don't add redundant waits.

When explicit waits are needed, wait for **specific conditions**:

```typescript
// ✅ Wait for network response
const responsePromise = page.waitForResponse("**/api/assignments");
await page.getByRole("button", { name: "Save" }).click();
await responsePromise;

// ✅ Retry entire block
await expect(async () => {
    const response = await page.request.get("/api/status");
    expect(response.status()).toBe(200);
}).toPass({ timeout: 30_000 });

// ❌ Never hardcoded waits
await page.waitForTimeout(3000);
```

### Timeout Guidelines

| Scenario               | Timeout | Rationale                                |
| ---------------------- | ------- | ---------------------------------------- |
| Default expect         | 10s     | Dynamic UIs with SSR regularly take 5–8s |
| Navigation waits       | 15s     | Route transitions + data loading         |
| AI processing overlays | 45s     | Variable AI response times               |
| Full test timeout      | 60s     | Generous baseline                        |

Prefer raising the **global** timeout over scattering `test.setTimeout()` per test.

## Forms

```typescript
await page.getByLabel("Title").fill("Year 11 Mock Exam");
await page.getByLabel("Subject").selectOption("Mathematics");
await page.getByLabel("Upload PDF").setInputFiles("__e2e__/data/sample.pdf");
await page.getByLabel("Include mark scheme").check();
await page.getByRole("button", { name: "Create" }).click();
```

## Dynamic Data Cleanup

Pre-seeded data is cleaned up by **global teardown** automatically. But tests that **create data dynamically** (e.g. testing a "create class" button) must clean up in `finally` blocks:

```typescript
test("teacher creates a class", async ({ classesPage, page }) => {
    let classId: string | undefined;

    try {
        await classesPage.goto();
        await classesPage.clickNewClass();
        await classesPage.createClassDialog.fillMinimumFields({
            examLevel: "GCSE",
            examBoard: "AQA",
        });
        await classesPage.createClassDialog.submit();

        // Extract ID from URL
        classId = new URL(page.url()).pathname.split("/")[4];

        await expect(
            page.locator("[container-id='class-header']"),
        ).toBeVisible();
    } finally {
        if (classId) await deleteClass(classId);
    }
});
```

> **`.catch(() => {})` on cleanup** — the test may have already deleted the entity. Without it, a 404 in `finally` masks the real failure.

## Complete Spec Example

```typescript
// tests/classes/class-creation.spec.ts
import { test, expect } from "../../fixtures";
import { readManifest } from "../../helpers/manifest";
import { deleteClass } from "../../helpers/api-helpers";

const SPEC = "class-creation";
const AUTH_FILE = `__e2e__/.playwright/auth/${SPEC}.json`;

test.describe("Class Creation", () => {
    test.use({ storageState: AUTH_FILE });

    let m: Record<string, unknown>;

    test.beforeAll(async () => {
        m = readManifest(SPEC);
    });

    test("teacher creates a class with minimum fields", async ({
        classesPage,
        page,
    }) => {
        let classId: string | undefined;

        try {
            await classesPage.goto();
            await classesPage.clickNewClass();
            await classesPage.createClassDialog.fillMinimumFields({
                examLevel: "GCSE",
                examBoard: "AQA",
            });
            await classesPage.createClassDialog.submit();

            classId = new URL(page.url()).pathname.split("/")[4];
            await expect(
                page.locator("[container-id='class-header']"),
            ).toBeVisible();
        } finally {
            if (classId) await deleteClass(classId);
        }
    });
});
```
