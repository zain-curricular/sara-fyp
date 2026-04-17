# Writing Unit Tests

A guide for writing unit tests for composite services and pure functions.

> **API route handlers** are no longer unit tested — they use [API integration tests](../4-api-testing/3-writing-api-tests.md) instead.

---

## Where to Put Unit Tests

Unit tests live **next to the source files they test**, inside a `__tests__/` folder.

### Examples

**Composite service:**

```
lib/features/assignments/assignments/services/_utils/
├── updateQuestionTopicWithValidation.ts
└── __tests__/
    └── updateQuestionTopicWithValidation.test.ts
```

**Pure utility:**

```
lib/features/assignments/marking/services/_utils/
├── transformResponsesForReview.ts
└── __tests__/
    └── transformResponsesForReview.test.ts
```

### Rules

- **Add a `__tests__/` folder** inside the directory containing the source file
- **One test file per source file** — `transformResponsesForReview.ts` gets `transformResponsesForReview.test.ts`
- **File naming:** always `{sourceFileName}.test.ts`
- Tests co-locate with the code they verify — no hunting through a separate test directory

---

## Test File Structure

### Composite Service Test

```typescript
// updateQuestionTopicWithValidation.test.ts

import { describe, it, expect, vi } from "vitest";
import { updateQuestionTopicWithValidation } from "../updateQuestionTopicWithValidation";

// ── Mocks ──────────────────────────────────────────────
vi.mock("../../_data-access/questions", () => ({
    getQuestion: vi.fn(),
    updateQuestionTopicRecord: vi.fn(),
}));

vi.mock("../../_data-access/assignments", () => ({
    getAssignmentOwner: vi.fn(),
}));

import {
    getQuestion,
    updateQuestionTopicRecord,
} from "../../_data-access/questions";
import { getAssignmentOwner } from "../../_data-access/assignments";

const mockGetQuestion = vi.mocked(getQuestion);
const mockGetOwner = vi.mocked(getAssignmentOwner);
const mockUpdateTopic = vi.mocked(updateQuestionTopicRecord);

describe("updateQuestionTopicWithValidation", () => {
    it("should return 404 when question not found", async () => {
        mockGetQuestion.mockResolvedValueOnce({ data: null, error: null });
        mockGetOwner.mockResolvedValueOnce({
            data: { id: "a1", teacher_id: "t1" },
            error: null,
        });

        const result = await updateQuestionTopicWithValidation({
            questionId: "q1",
            assignmentId: "a1",
            userId: "t1",
            topicCode: "N1",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.status).toBe(404);
        }
    });

    it("should return 403 when user does not own assignment", async () => {
        mockGetQuestion.mockResolvedValueOnce({
            data: { id: "q1", assignment_id: "a1" },
            error: null,
        });
        mockGetOwner.mockResolvedValueOnce({
            data: { id: "a1", teacher_id: "other-teacher" },
            error: null,
        });

        const result = await updateQuestionTopicWithValidation({
            questionId: "q1",
            assignmentId: "a1",
            userId: "t1",
            topicCode: "N1",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.status).toBe(403);
        }
    });
});
```

### Pure Function Test

```typescript
// transformResponsesForReview.test.ts

import { describe, it, expect } from "vitest";
import { transformResponsesForReview } from "../transformResponsesForReview";

describe("transformResponsesForReview", () => {
    it("should prefer final marks over AI marks", () => {
        const raw = [
            {
                id: "r1",
                question_id: "q1",
                ai_marks: 3,
                final_marks: 5,
                ai_feedback: "AI says...",
                final_feedback: "Teacher says...",
                question: { question_number: 1 },
            },
        ];

        const result = transformResponsesForReview(raw);

        expect(result[0].marks).toBe(5);
        expect(result[0].feedback).toBe("Teacher says...");
    });

    it("should fall back to AI marks when no teacher override", () => {
        const raw = [
            {
                id: "r1",
                question_id: "q1",
                ai_marks: 3,
                final_marks: null,
                ai_feedback: "AI says...",
                final_feedback: null,
                question: { question_number: 1 },
            },
        ];

        const result = transformResponsesForReview(raw);

        expect(result[0].marks).toBe(3);
        expect(result[0].feedback).toBe("AI says...");
    });
});
```

---

## Conventions

### Describe Blocks

- **One `describe` per exported function**
- **Describe label** matches the function name: `"updateQuestionTopicWithValidation"`

### Test Names

Follow the naming conventions in [General Best Practices](../4-general-best-practices.md#naming) — describe expected behavior, not implementation.

### Mock Setup Location

- **`vi.mock()` calls** go at the **top of the file**, before imports of the mocked modules
- **`vi.mocked()` wrappers** go after the imports, in the module scope
- **`mockResolvedValueOnce()`** calls go inside each `it()` block

### Inline Test Data

If only one test needs a specific data shape, create it inline — don't add it to factories:

```typescript
it("should handle submission with no responses", async () => {
    const emptySubmission = {
        id: "s1",
        assignment_id: "a1",
        student_id: "st1",
        responses: [],
    };
    // ...
});
```

### Testing Error Branches

Test each error path that the function can return. For discriminated unions, narrow the type before asserting:

```typescript
const result = await updateQuestion(params);

expect(result.success).toBe(false);
if (!result.success) {
    expect(result.status).toBe(404);
    expect(result.error).toContain("not found");
}
```

### What NOT to Test

See [Unit Test Best Practices](./4-unit-test-best-practices.md#what-not-to-test) for the full guide on mock wiring, type correctness, and third-party library testing.

---

## Running

See [Vitest Config](../2-vitest-config.md) for all NPM scripts, configuration details, and CI workflows.

---

## Next

- [Unit Test Best Practices](./4-unit-test-best-practices.md) — mocking discipline, what not to test, error paths
