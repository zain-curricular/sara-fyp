# Unit Test Best Practices

Patterns and anti-patterns specific to unit testing with Vitest and `vi.mock()`.

---

## Mock Discipline

### Mock Only the Layer Below

Each layer mocks its **direct dependencies** — nothing deeper:

```typescript
// ✅ Service test mocks the data-access layer
vi.mock("../_data-access/assignments");

// ❌ Service test mocks a deeper layer it doesn't call directly
vi.mock("../../other-feature/services/_data-access/users");
```

If a service test mocks something two layers deep, you're no longer testing that the service calls its direct dependencies correctly.

> **Note:** Route handlers are no longer unit tested — they use [API integration tests](../4-api-testing/1-api-integration-tests.md) instead.

### Don't Over-Mock

If you're mocking so much that the test is just verifying `if/else` branches with predetermined outcomes, the test isn't telling you anything useful. Good unit tests still exercise **real logic** — validation, transformation, orchestration — with only the I/O layer faked.

```typescript
// ✅ Mocks data-access, tests real validation logic in the service
mockGetQuestion.mockResolvedValueOnce({ data: null, error: null });
const result = await updateQuestionTopic(params);
expect(result.success).toBe(false);

// ❌ Mocks so much that you're just testing the mock wiring
mockValidate.mockReturnValue(true);
mockAuth.mockReturnValue({ user: mockUser });
mockService.mockReturnValue({ ok: true });
// ...what logic is even left to test?
```

### Prefer `vi.mock()` Over `vi.spyOn()` for Module Mocking

`vi.spyOn()` creates **partial mocks** — half real, half fake. This makes tests harder to reason about because some calls go to the real implementation and some don't.

```typescript
// ✅ Full module mock — all exports are vi.fn()
vi.mock("../_data-access/assignments");

// ❌ Partial spy — easy to forget which methods are real vs mocked
vi.spyOn(assignmentsModule, "getAssignment");
```

### No Top-Level Variables in `vi.mock()` Factories

`vi.mock()` is **hoisted** to the top of the file — it runs before any imports or variable declarations. Referencing top-level variables inside the factory will throw.

```typescript
// ❌ Breaks — mockData doesn't exist yet when vi.mock() runs
const mockData = { id: "123" };
vi.mock("../service", () => ({
    getData: vi.fn().mockReturnValue(mockData),
}));

// ✅ Use vi.hoisted() for shared mock references
const { mockGetData } = vi.hoisted(() => ({
    mockGetData: vi.fn(),
}));
vi.mock("../service", () => ({
    getData: mockGetData,
}));
```

### Use `mockResolvedValueOnce` by Default

`mockResolvedValueOnce` is consumed after one call — each test sets up exactly what it needs, and the global `afterEach` in `setup.ts` clears everything between tests. Only use `mockResolvedValue` (persistent) when a single test makes multiple calls to the same mock.

---

## What Not to Test

### Don't Test Mock Wiring

Asserting that a mock was called with exact arguments is only useful when **the call itself is the behavior** (e.g., verifying a delete). Don't assert call args just to prove your mock setup works.

```typescript
// ✅ The point IS that we called delete with the right ID
expect(mockDeleteAssignment).toHaveBeenCalledWith("assignment-123");

// ❌ Just proving the mock wiring — the return value assertion already covers this
expect(mockGetAssignment).toHaveBeenCalledWith("assignment-123");
expect(result.data.id).toBe("assignment-123"); // ← this is sufficient
```

### Don't Test TypeScript or Third-Party Libraries

TypeScript enforces types at compile time. Zod validates at runtime. Neither needs unit tests:

```typescript
// ❌ Testing that Zod works
it("should reject invalid email format", () => {
    const result = emailSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
});

// ✅ Testing that YOUR code handles the validation result correctly
it("should return 400 when body fails validation", async () => {
    const request = createPostRequest(url, { email: "not-an-email" });
    const response = await POST(request);
    expect(response.status).toBe(400);
});
```

### Don't Test Internal State

Test **observable behavior** (return values, side effects), not internal variables:

```typescript
// ❌ Testing internal implementation
expect(service._cache.size).toBe(1);

// ✅ Testing observable behavior
const result = await service.getData("key");
expect(result).toEqual(expectedData);
```

---

## Error Path Testing

### Test Every Discriminated Union Branch

Our codebase uses discriminated unions for error handling. Each branch represents a real user-facing scenario — test them all:

```typescript
// Service returns: { success: true, data } | { success: false, error, status }

it("should return 404 when question not found", async () => { ... });
it("should return 403 when user does not own assignment", async () => { ... });
it("should return updated question on success", async () => { ... });
```

### Narrow Before Asserting

TypeScript won't let you access `.error` on a success branch. Narrow first:

```typescript
expect(result.success).toBe(false);
if (!result.success) {
    expect(result.status).toBe(404);
    expect(result.error).toContain("not found");
}
```

---

## Performance

### Keep Tests Fast

Unit tests should run in **milliseconds**, not seconds. If a unit test is slow:

- You're probably hitting real I/O that should be mocked
- Or creating unnecessarily large test data

### Avoid `beforeEach` for Static Data

If test data doesn't change between tests, declare it in the module scope:

```typescript
// ✅ Static data — declared once
const testUser = createMockUser({ id: "teacher-1" });

describe("getAssignment", () => {
    it("should return assignment", async () => {
        // testUser is reused, not recreated
    });
});

// ❌ Unnecessary recreation every test
let testUser: User;
beforeEach(() => {
    testUser = createMockUser({ id: "teacher-1" });
});
```
