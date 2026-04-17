# E2E Best Practices

## Parallel Safety

Global setup + UUID naming eliminates cross-file concerns by design. Within a file:

- **`serial` mode** when tests share `beforeAll` data and none mutate it destructively
- **`try/finally`** when tests create data dynamically — always `.catch(() => {})` on cleanup
- **Never assert on counts of global collections** — only assert on spec-owned data
- **Scope `waitForResponse`** to specific resource IDs — e.g. `/assignments/${id}` not just `/assignments`

### Assert on Unique Identifiers

Always verify your spec's **own** data — never match on "any entity that looks right":

```typescript
// ✅ Assert on the specific entity this spec created
await expect(page.getByText(m.className as string)).toBeVisible();

// ❌ Matches whatever happens to be first
await expect(page.locator("table tr").first()).toContainText("Mock Exam");
```

### Never Depend on Row Ordering

Database ordering is non-deterministic unless explicitly sorted. Always **filter or search** for your data:

```typescript
// ✅ Find the specific row by unique content
const row = page.locator("[container-id='assignment-row']", {
    hasText: m.assignmentTitle as string,
});
await expect(row).toBeVisible();

// ❌ Assumes your data is first
const firstRow = page.locator("[container-id='assignment-row']").first();
```

---

## Network & Mocking

E2E tests run against **local Supabase** (auth, database, storage) — always real. **External AI APIs** are mocked with `page.route()`.

| Service                      | Real?  | Why                                       |
| ---------------------------- | ------ | ----------------------------------------- |
| Supabase (auth, DB, storage) | Yes    | Local instance, part of system under test |
| Internal API routes          | Yes    | Part of the app                           |
| **AI APIs (Gemini)**         | **No** | External, expensive, variable latency     |

### Polling Mocks

Assert on **visible state transitions**, not poll request counts:

```typescript
let currentStatus = "pending";

await page.route(
    (url) => url.pathname === `/api/assignments/${ID}/submissions`,
    async (route) => {
        await route.fulfill({ json: fakePollResponse(currentStatus) });
    },
);

await expect(badge).toContainText("Pending");
currentStatus = "processing";
await expect(badge).toContainText("Processing", { timeout: 10_000 });
```

---

## React-Safe DOM Interaction

**NEVER `el.remove()` on React-managed DOM nodes** — breaks the fiber tree, crashes via error boundary. **Hide with CSS instead:**

```typescript
await this.page.evaluate(() => {
    document.querySelectorAll("[data-sonner-toast]").forEach((el) => {
        (el as HTMLElement).style.pointerEvents = "none";
        (el as HTMLElement).style.opacity = "0";
        (el as HTMLElement).style.position = "fixed";
        (el as HTMLElement).style.top = "-9999px";
    });
});
```

---

## Anti-Patterns

| Anti-Pattern                            | Do This Instead                                           |
| --------------------------------------- | --------------------------------------------------------- |
| `page.waitForTimeout(3000)`             | Web-first assertions or `waitForURL`                      |
| `waitUntil: "networkidle"`              | Wait for specific UI elements                             |
| `{ force: true }` on clicks             | Fix the page so the element is interactive                |
| `isVisible()` then `expect()`           | `toBeVisible()` directly                                  |
| CSS selectors / `page.$()`              | `getByRole`, `getByLabel`, `getByText`                    |
| Positional selectors (`td.nth(2)`)      | Add `container-id`, scope by attribute                    |
| `test.describe.serial` for multi-step   | `test.step()` in a single test                            |
| UI-driven data setup                    | Seed builders in `.seed.ts` files                         |
| `el.remove()` on React DOM nodes        | Hide with CSS                                             |
| Broad `waitForResponse` matchers        | Include the resource ID                                   |
| Asserting on "first row" or `.first()`  | Filter by your spec-owned entity name/title               |
| Asserting on collection counts globally | Only count within your spec-owned, filtered data          |
| Monolithic spec with unrelated flows    | Split into separate files with own seed                   |
| Seeding data in `beforeAll`             | Use seed builders in `.seed.ts` — global setup handles it |
| Inline admin client calls in specs      | Use API helpers from `helpers/api-helpers.ts`             |

---

## Flakiness Prevention

**Root causes:** race conditions, test interdependence, non-deterministic data, network timing, ambiguous locators.

**Prevention:** All the patterns above work together — UUID naming, file isolation, unique identifier assertions, row-order independence, web-first assertions, scoped `waitForResponse`, `page.route()` for external APIs, `container-id` scoping, and `navigateAuthenticated()` for middleware flakes.

**Detection:** `--repeat-each N`, trace viewer, CI retry rate tracking, failure videos.

---

## Linting

- **`@typescript-eslint/no-floating-promises`** — catches missing `await` on async assertions
- **`eslint-plugin-playwright`** — catches hard-coded timeouts, `page.$()`, non-retrying assertions

## Debugging

| Tool         | Command                               | Best For                           |
| ------------ | ------------------------------------- | ---------------------------------- |
| UI Mode      | `npm run test:e2e:ui`                 | Step through visually, time-travel |
| Headed       | `npm run test:e2e:headed`             | Watch browser in real-time         |
| Debug        | `npm run test:e2e:debug`              | Inspector with breakpoints         |
| Trace viewer | `npx playwright show-trace trace.zip` | Post-mortem analysis               |
