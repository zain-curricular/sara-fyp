# Integration Test Best Practices

Practical rules for writing reliable, maintainable integration tests against the data-access layer.

---

## Test Isolation

### Each File Owns Its Data

Every test file seeds its own data and cleans up after itself. No shared fixtures. See [Writing Integration Tests](./3-writing-integration-tests.md#per-file-seeding) for the full pattern with code examples.

### Don't Assume an Empty Database

Tests should work whether the database has 0 rows or 10,000. Assert on **your seeded data specifically**, not on row counts.

```typescript
// Bad — breaks if another test file left data behind
expect(result.data).toHaveLength(1);

// Good — verifies YOUR data exists in the result
expect(result.data).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: testClass.id })]),
);
```

> When row counts **are** the contract (e.g. pagination limits), filter to your seeded user first.

### Use Unique Identifiers

Seed functions should produce unique data per run. `Date.now()` suffixes in names, unique emails, and fresh UUIDs prevent collisions when tests run against a shared staging DB.

---

## What to Assert

### Test the Contract, Not the Query

You're testing that the **data-access function returns the right shape and data** — not how the SQL is structured internally.

```typescript
// Bad — testing query internals
expect(spy).toHaveBeenCalledWith("SELECT * FROM classes WHERE...");

// Good — testing the contract
const result = await getClassesForTeacher(testUser.id);
expect(result.data![0].class_name).toBe(testClass.class_name);
```

### Assert on Observable Outcomes

For **write operations** (insert, update, delete), verify the final database state — not that some internal method was called.

```typescript
// Good — verify the outcome
await updateClassName(testClass.id, "New Name");
const updated = await getClass(testClass.id);
expect(updated.data!.class_name).toBe("New Name");
```

### Don't Over-Assert

Check what matters for the test's purpose. A test for "get classes by teacher" doesn't need to assert every column on the returned row.

```typescript
// Bad — brittle, breaks when any column changes
expect(result.data![0]).toEqual({
    id: testClass.id,
    class_name: "...",
    subject: "...",
    exam_board: "...",
    // ...20 more fields
});

// Good — focused on what this test is verifying
expect(result.data![0]).toEqual(
    expect.objectContaining({
        id: testClass.id,
        class_name: testClass.class_name,
    }),
);
```

---

## Test Design

### Naming & Structure

Follow the naming and `describe` block conventions in [General Best Practices](../4-general-best-practices.md#naming). For integration tests specifically, describe what the function **should do** in a scenario — not what SQL it runs.

### Test the Realistic Scenarios

Focus on the paths your app actually exercises:

- **Happy path** — standard usage with valid data
- **Empty results** — what happens when no rows match?
- **Filtering / ordering** — if the function filters by status or sorts by date, verify that
- **Edge cases in the contract** — null columns, optional joins, pagination boundaries

Don't test absurd scenarios that can't happen (e.g. passing `undefined` when TypeScript prevents it).

### Keep Setup Proportional to the Test

If a test needs one class, seed one class. Don't build a full entity graph "just in case." Minimal setup = faster tests and clearer intent.

---

## Cleanup & Ordering

### Always Clean Up — Even on Failure

Use `afterAll` for cleanup, not `afterEach`. Vitest runs `afterAll` even when tests fail, preventing orphaned data.

### Ordering & Inline Cleanup

See [Shared Seed Functions](./2-shared-seed-functions.md#cleanup-ordering) for reverse-order cleanup conventions and [Writing Integration Tests](./3-writing-integration-tests.md#conventions) for inline seed/cleanup within single tests.

---

## Performance

### Use the Real Database Engine

Never substitute an in-memory database. The point of integration tests is to validate behaviour against the same PostgreSQL that runs in production — including its types, constraints, and query behaviour.

### Keep Tests Fast

- Seed only what you need
- Avoid unnecessary `SELECT *` in assertions — your data-access functions already return the right shape
- Run integration tests **sequentially** (no parallelism) to avoid race conditions on shared DB state

### Avoid Sleep / Polling in Tests

If you're waiting for something asynchronous, the data-access layer should return it directly. Integration tests hit the DB synchronously — there's nothing to poll.

---

## Common Anti-Patterns

| Anti-Pattern                               | Why It's Bad                                                                           | Do This Instead                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Shared global fixtures**                 | Hidden coupling; one file's cleanup breaks another                                     | Each file seeds its own data                      |
| **Asserting row counts globally**          | Breaks when other tests leave data                                                     | Assert on specific seeded records                 |
| **Mocking the DB client**                  | Defeats the purpose — you're testing the contract                                      | Use a real Supabase instance                      |
| **Testing via the system under test**      | Using `createClass()` to set up data for a `getClass()` test means you're testing both | Seed via admin client, test the function directly |
| **Verifying query internals**              | Couples tests to SQL structure; breaks on harmless refactors                           | Assert on returned data shape                     |
| **Massive entity graphs for simple tests** | Slow, noisy, hard to debug                                                             | Seed the minimum required data                    |

---

## Sources

- [Vlad Mihalcea — The Best Way to Test the Data Access Layer](https://vladmihalcea.com/test-data-access-layer/)
- [Yoni Goldberg — JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Enterprise Craftsmanship — How to Assert Database State](https://enterprisecraftsmanship.com/posts/how-to-assert-database-state/)
- [Three Dots Labs — Database Integration Testing Principles](https://threedots.tech/post/database-integration-testing/)
- [Codepipes — Software Testing Anti-Patterns](https://blog.codepipes.com/testing/software-testing-antipatterns.html)
- [Brandon Pugh — Integration Test Patterns](https://www.brandonpugh.com/better-way/development-guidelines/testing/integration-test-patterns.html)
