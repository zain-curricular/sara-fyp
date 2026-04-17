# Testing Best Practices

General best practices that apply to **all** tests — unit and integration alike.

---

## The Golden Rule

> Design tests to be **short, flat, and immediately understandable**. A developer reading a failing test should know exactly what broke without tracing through abstractions.

---

## Test Structure

### AAA Pattern

Every test has three parts. Separate them with whitespace:

```typescript
it("should return classes for the teacher", async () => {
    // Arrange — set up data and mocks
    const testClass = createMockClass({ teacher_id: testUser.id });
    mockGetClasses.mockResolvedValueOnce({ data: [testClass], error: null });

    // Act — execute the thing being tested
    const result = await getClassesForTeacher(testUser.id);

    // Assert — verify the outcome
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe(testClass.id);
});
```

**Act should be one or two lines.** If it's more, you're probably testing too much in one test.

### One Assertion Concept Per Test

Multiple `expect()` calls are fine — but they should all verify the **same concept**:

```typescript
// ✅ One concept: "the response is a valid 200 with correct shape"
expect(response.status).toBe(200);
expect(body.ok).toBe(true);
expect(body.data.id).toBe("123");

// ❌ Two concepts crammed into one test
expect(response.status).toBe(200);
expect(mockAuditLog).toHaveBeenCalled(); // ← separate test
```

---

## Naming

### Test Names Describe Behavior

Write test names as **expected behavior**, not implementation:

```typescript
// ✅ Describes what should happen
it("should return 403 when user does not own the assignment");
it("should fall back to AI marks when no teacher override");
it("should return empty array for teacher with no classes");

// ❌ Describes implementation steps
it("should call getAssignment then check teacher_id");
it("should use the nullish coalescing operator on final_marks");
```

### Describe Blocks Match the Unit

- **Functions:** `describe("updateQuestionTopic", ...)`
- **Route methods:** `describe("GET /api/assignments/[assignmentId]", ...)`
- **Components:** `describe("AssignmentCard", ...)`

---

## Test Independence

### Each Test Stands Alone

Tests must not depend on execution order. If test B only passes after test A, you have shared mutable state.

**Signs of coupling:**

- A test fails when run alone but passes in the full suite (or vice versa)
- Tests use `let` variables modified across multiple `it()` blocks
- Removing one test causes another to fail

### Clean Up After Yourself

The global `setup.ts` handles mock cleanup. For integration tests, always clean up seeded data in `afterAll`. Don't leave state for the next file.

---

## Test Scope

### Test Behavior, Not Implementation

Tests should survive refactors. If you rename an internal variable and 15 tests break, those tests were testing implementation details.

```typescript
// ✅ Tests the contract — survives internal refactors
const result = await createAssignment(input);
expect(result.data.title).toBe("Maths Exam");

// ❌ Tests the implementation — breaks if internals change
expect(service._buildInsertPayload).toHaveBeenCalledWith(input);
```

### Don't Test Unlikely Edge Cases

Focus on real user scenarios and actual error paths. If a case requires 5 things to go wrong simultaneously and can't happen in production, skip it.

```typescript
// ✅ Real scenario — user submits without auth token
it("should return 401 when no authorization header");

// ❌ Contrived — would require a bug in the HTTP spec
it("should handle request with content-length -1");
```

### Coverage Depth

Aim for **comprehensive coverage of common scenarios** — not exhaustive coverage of every conceivable edge case. Tests should give you confidence that the code works correctly for the cases users will actually hit.

**What good coverage looks like:**

- **Happy path** — the primary success scenario
- **Common failure modes** — invalid input, missing data, auth failures
- **Each discriminated union branch** — if a function returns `success | notFound | forbidden`, test all three
- **Boundary conditions that matter** — empty arrays, pagination limits, null optional fields

**What over-testing looks like:**

- Testing every permutation of optional fields when only presence/absence matters
- Writing 10 error tests when 3 cover all the distinct error _paths_
- Testing the same validation logic at multiple layers (route + service + data-access)

> **Rule of thumb:** if a new test doesn't exercise a **different code path** from existing tests, it probably isn't adding value.

---

## Assertions

### Use Specific Matchers

Vitest (and jest-dom) provide precise matchers — use them:

```typescript
// ✅ Specific and descriptive
expect(result).toHaveLength(3);
expect(result).toContainEqual(expect.objectContaining({ id: "123" }));
expect(element).toBeVisible();

// ❌ Vague — failure messages are unhelpful
expect(result.length === 3).toBe(true);
expect(!!result.find((r) => r.id === "123")).toBe(true);
```

### Avoid Snapshot Tests for Logic

Snapshots are for **UI rendering stability**, not business logic. If the expected output is knowable, assert it explicitly:

```typescript
// ✅ Explicit — clear what the test expects
expect(result.marks).toBe(5);
expect(result.feedback).toBe("Well done");

// ❌ Snapshot for logic — hides what matters, auto-updated without thought
expect(result).toMatchSnapshot();
```

---

## Readability

### Inline Over Abstraction

Three similar lines are better than a helper function that hides what the test does:

```typescript
// ✅ Readable — you see exactly what's happening
const mathsClass = await seedClass({
    teacher_id: user.id,
    subject: "Mathematics",
});
const englishClass = await seedClass({
    teacher_id: user.id,
    subject: "English",
});
const scienceClass = await seedClass({
    teacher_id: user.id,
    subject: "Science",
});

// ❌ Over-abstracted — now you have to read seedMultipleClasses to understand the test
const classes = await seedMultipleClasses(user.id, [
    "Mathematics",
    "English",
    "Science",
]);
```

### Don't Use Conditionals in Tests

Tests should have **one deterministic path**. If you need `if/else` in a test, you're testing two things:

```typescript
// ❌ Conditional test — which branch ran?
const result = await getUser(id);
if (result.data) {
	expect(result.data.email).toBe("test@example.com");
} else {
	expect(result.error).toBeDefined();
}

// ✅ Two separate tests with clear expectations
it("should return user data when found", ...);
it("should return error when not found", ...);
```
