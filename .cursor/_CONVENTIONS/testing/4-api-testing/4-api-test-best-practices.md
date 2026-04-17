# API Test Best Practices

Practical rules for writing reliable, maintainable API integration tests.

---

## What to Assert

### Always Check Status + Envelope

```typescript
// ✅ Complete
const response = await GET(request);
const body = await response.json();
expect(response.status).toBe(200);
expect(body.ok).toBe(true);

// ❌ Incomplete — only checks data
expect(body.data.id).toBe("123");
```

### Assert on Seeded Data

Same principle as [DAL integration best practices](../2-integration-testing/4-integration-test-best-practices.md#dont-assume-an-empty-database) — don't assume an empty database. Use `expect.arrayContaining` + `expect.objectContaining` to find your specific seeded data.

### Test the Response Shape, Not Every Field

Check the fields that matter for the test's purpose — not every column on the returned row. See [DAL integration best practices](../2-integration-testing/4-integration-test-best-practices.md#dont-over-assert) for the same principle applied to data assertions.

---

## Test Coverage Per Route

Each route handler should have tests covering:

1. **Authentication** — 401 when no/invalid token
2. **Authorization** — 403 when user lacks permission (wrong role, doesn't own resource)
3. **Validation** — 400 when request body fails Zod schema (for POST/PATCH/PUT)
4. **Happy path** — success response with correct status and data shape
5. **Not found** — 404 when the target resource doesn't exist (for parameterized routes)

### What NOT to Test Here

- **Individual DAL query correctness** — already covered by DAL integration tests
- **Every Zod field permutation** — test 1-2 representative invalid payloads
- **Framework behavior** — don't test that Next.js routes requests correctly

---

## Test Isolation

Same rules as [DAL integration best practices](../2-integration-testing/4-integration-test-best-practices.md#test-isolation):

- **Each file owns its data** — seed in `beforeAll`, clean up in `afterAll`
- **Sequential execution** — enforced by Vitest config (`sequence.concurrent: false`)
- **Tests are independent** — no test should depend on another test's side effects

---

## Mocking Discipline

### Only Mock `authenticateFromRequest`

This is the **only** mock in API integration tests. See [Auth Helpers](./2-auth-helpers.md) for the full strategy.

### External Services

If a route calls an external service (AI, email, file storage), mock that service at the module level. The boundary is: mock things that reach **outside your application**, not things inside it.

---

## Migration From Unit Tests

When replacing an existing `route.test.ts` with `route.api.test.ts`:

1. **Read the existing unit test** — note every scenario it covers
2. **Write the API integration test** — cover the same scenarios, plus any that were impossible with mocks (real ownership checks, real validation)
3. **Compare coverage** — every `it()` in the old file should have an equivalent
4. **Delete the old file** — only after the API test covers all scenarios

### What Changes

| Unit Test Pattern                        | API Integration Test Equivalent                |
| ---------------------------------------- | ---------------------------------------------- |
| `vi.mock("@/lib/features/.../services")` | No mock — services run real                    |
| `mockService.mockResolvedValueOnce(...)` | Seed the data the service will query           |
| `createMockUser()` (factory)             | `seedUser()` (real DB)                         |
| `createMockClass()` (factory)            | `seedClass({ teacher_id })` (real DB)          |
| Assert `mockService` was called          | Assert the response contains the expected data |

---

## Common Anti-Patterns

| Anti-Pattern                      | Do This Instead                                                  |
| --------------------------------- | ---------------------------------------------------------------- |
| **Mocking services or DAL**       | Let everything run real except auth                              |
| **Hardcoded UUIDs in assertions** | Assert on IDs from your seeded data                              |
| **Testing every Zod field**       | Test 1-2 representative invalid payloads                         |
| **Not cleaning up writes**        | Track created IDs, clean up in `afterAll`                        |
| **Duplicating DAL test coverage** | Focus on route-level concerns (auth, validation, response shape) |
| **Giant setup blocks**            | Seed the minimum required for each describe block                |

---

## Sources

- [Testing Next.js App Router API routes — Arcjet Blog](https://blog.arcjet.com/testing-next-js-app-router-api-routes/)
- [Yoni Goldberg — JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Codepipes — Software Testing Anti-Patterns](https://blog.codepipes.com/testing/software-testing-antipatterns.html)
