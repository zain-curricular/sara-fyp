# Seed System

Every spec has a paired `.seed.ts` file that defines what data to create and how to clean it up. Seeds run in **global setup**, not in `beforeAll`.

## The SpecSeed Interface

```typescript
interface SpecSeed {
    specName: string;
    seed: (runId: string) => Promise<Record<string, unknown>>;
    cleanup: (data: Record<string, unknown>) => Promise<void>;
}
```

| Field           | Purpose                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| `specName`      | Must match the `SPEC` constant in the paired `.spec.ts`                               |
| `seed(runId)`   | Creates all test data. Returns flat object of IDs/credentials for the manifest        |
| `cleanup(data)` | Receives the same object returned by `seed()`. Deletes everything in reverse FK order |

## Seed Builders (`seeds/builders.ts`)

Three composable builders in a dependency chain. Use these instead of calling API helpers directly — they handle the full entity graph.

### `seedTeacherOnly(spec, runId, opts?)`

Creates auth user + profile + settings.

**Returns:** `{ teacherId, email, password }`

**Options:**

| Option                | Default | Purpose                                                                 |
| --------------------- | ------- | ----------------------------------------------------------------------- |
| `onboardingCompleted` | `true`  | Set `onboarding_completed_at` (without it, app redirects to onboarding) |
| `emailConfirmed`      | `true`  | Confirm email verification                                              |

**Used by:** auth specs, settings specs, nav specs

### `seedTeacherWithClass(spec, runId, opts?)`

Calls `seedTeacherOnly`, then creates a class with roster entries.

**Returns:** `{ teacherId, email, password, classId, joinCode, rosterEntryIds? }`

**Options:**

| Option         | Default | Purpose                                             |
| -------------- | ------- | --------------------------------------------------- |
| `students`     | `0`     | Number of roster entries to create                  |
| `studentNames` | —       | Custom display names for roster entries             |
| `rosterNames`  | —       | Alternative to `studentNames`                       |
| `classOpts`    | —       | Override class defaults (subject, year group, etc.) |

> Roster entries are **display-name only** — no auth users are created (student platform is paused). Use `createRoster()` not `enrollStudents()`.

### `seedFullAssignment(spec, runId, opts)`

Calls `seedTeacherWithClass`, then creates assignment + questions + submissions + responses.

**Returns:** `{ teacherId, email, password, classId, joinCode, assignmentId, questionIds, submissionIds }`

**Options:**

| Option             | Default   | Purpose                                       |
| ------------------ | --------- | --------------------------------------------- |
| `questions[]`      | —         | Question definitions (number, text, maxMarks) |
| `submissions[]`    | —         | Submission data with responses per question   |
| `assignmentStatus` | `"ready"` | Assignment status                             |
| `assignmentTitle`  | —         | Custom title                                  |
| `uploadPdfs`       | `false`   | Upload real PDFs to storage                   |
| `pageCount`        | —         | Set question paper page count                 |

### Cleanup Functions

Each builder has a matching cleanup that deletes in **reverse FK order**:

- `cleanupTeacherOnly(data)` — deletes user (cascades profile + settings)
- `cleanupTeacherWithClass(data)` — deletes class (cascades roster), then user
- `cleanupFullAssignment(data)` — deletes assignment (cascades questions/submissions/responses), then class, then user

---

## Writing a Seed File

```typescript
// tests/classes/class-creation.seed.ts
import type { SpecSeed } from "../../seeds/types";
import { seedTeacherOnly, cleanupTeacherOnly } from "../../seeds/builders";

const SPEC = "class-creation";

const seed: SpecSeed = {
    specName: SPEC,

    seed: async (runId) => {
        return await seedTeacherOnly(SPEC, runId);
    },

    cleanup: async (data) => {
        await cleanupTeacherOnly(data);
    },
};

export default seed;
```

For more complex setups:

```typescript
// tests/submission-review/submission-review-layout.seed.ts
const seed: SpecSeed = {
    specName: SPEC,

    seed: async (runId) => {
        const base = await seedTeacherWithClass(SPEC, runId, {
            students: 5,
            studentNames: [
                "Student 1",
                "Student 2",
                "Student 3",
                "Student 4",
                "Student 5",
            ],
        });

        const assignment = await createAssignment({
            teacherId: base.teacherId,
            classId: base.classId,
            title: `${SPEC} Assignment`,
        });

        await updateAssignmentDocumentUrls(assignment.id, {
            questionPaperUrl: `assignments/${base.teacherId}/${assignment.id}/source.pdf`,
            markSchemeUrl: `assignments/${base.teacherId}/${assignment.id}/mark-scheme.pdf`,
        });

        const questions = await createQuestions(assignment.id, [
            { questionNumber: 1, questionText: "Q1", maxMarks: 5 },
            { questionNumber: 2, questionText: "Q2", maxMarks: 3 },
        ]);

        const submissions = await createSubmissions(assignment.id, [
            {
                rosterEntryId: base.rosterEntryIds![0],
                status: "ready_for_review",
            },
        ]);

        await createResponses(submissions[0].id, [
            { questionId: questions[0].id, aiMarks: 3, aiFeedback: "Good" },
            { questionId: questions[1].id, aiMarks: 2, aiFeedback: "Partial" },
        ]);

        return {
            ...base,
            assignmentId: assignment.id,
            questionIds: questions.map((q) => q.id),
            submissionIds: submissions.map((s) => s.id),
        };
    },

    cleanup: async (data) => {
        await deleteAssignment(data.assignmentId as string);
        await cleanupTeacherWithClass(data);
    },
};
```

## Registering a Seed

Every seed **must** be statically imported and added to the registry in `seeds/index.ts`:

```typescript
// seeds/index.ts
import classCreation from "../tests/classes/class-creation.seed";
import classDashboard from "../tests/classes/class-dashboard.seed";
// ... all other seeds

export const allSeeds: SpecSeed[] = [
    classCreation,
    classDashboard,
    // ... all other seeds
];
```

> **Static imports are required** — the registry must be deterministic. No dynamic `import()` or glob patterns.

---

## API Helpers (`helpers/api-helpers.ts`)

> **Always use API helpers** — never call the admin client directly in seed or spec files. If a helper doesn't exist, **add it to `api-helpers.ts`** first.

### Supabase Admin Client

Uses the **service role key** to bypass RLS. No auth file needed.

### Foundation Helpers

| Helper                             | Creates                                                                | Returns    |
| ---------------------------------- | ---------------------------------------------------------------------- | ---------- |
| `createTeacher(input)`             | Auth user + profile + settings (idempotent — deletes stale user first) | `userId`   |
| `createStudents(students[])`       | Bulk auth users with profiles                                          | `string[]` |
| `createClass(input)`               | Class record with defaults (idempotent — deletes by joinCode first)    | `classId`  |
| `createRoster(classId, entries[])` | Display-name-only roster entries (no auth users)                       | `void`     |
| `deleteClass(classId)`             | Cascade to roster/enrollments, tolerates missing rows                  | `void`     |
| `deleteUser(userId)`               | Cascade to profile/settings, tolerates missing rows                    | `void`     |

### Assignment Helpers

| Helper                                                 | Purpose                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| `createAssignment(data)`                               | Direct insert (bypasses API route)          |
| `createQuestions(assignmentId, questions[])`           | Bulk insert                                 |
| `createSubmissions(assignmentId, submissions[])`       | Bulk insert with fake document URLs         |
| `createResponses(submissionId, responses[])`           | AI marks/feedback per question              |
| `updateAssignmentStatus(assignmentId, status)`         | Set status independently                    |
| `updateAssignmentPageCount(assignmentId, count)`       | For upload wizard tests                     |
| `updateAssignmentDocumentUrls(assignmentId, urls)`     | Set question paper / mark scheme URLs       |
| `uploadToStorage(localFilePath, storagePath, bucket?)` | Direct file upload via REST API             |
| `deleteAssignment(assignmentId)`                       | Cascades to questions/submissions/responses |

### Specialised Helpers

| Helper                                                             | Purpose                               |
| ------------------------------------------------------------------ | ------------------------------------- |
| `enrollMFA(email, password)`                                       | Enroll TOTP, return base32 secret     |
| `generateTOTP(base32Secret)`                                       | Generate 6-digit TOTP code            |
| `createCollectionSession(input)`                                   | Seed active Classroom Collect session |
| `createConversation(data)`                                         | Insert into `ai.conversations`        |
| `createCurriculumTopics(assignmentId, curriculumId, topicCodes[])` | Link questions to curriculum          |
| `getSubmissionsByAssignment(assignmentId)`                         | Read submissions for verification     |

### Adding New Helpers

1. Add to `api-helpers.ts` — not inline in the seed or spec
2. Follow existing pattern: typed input, error handling, exported function
3. Use **admin client** (service role key) — bypasses RLS
4. Update the tables above

---

## UUID Naming Strategy

The `runId` (first 8 chars of UUID) is generated **once** in global setup and shared across all seeds. Combined with the spec name prefix, this guarantees global uniqueness.

| Entity        | Pattern                                | Example                                        |
| ------------- | -------------------------------------- | ---------------------------------------------- |
| Teacher email | `{spec}-teacher-{runId}@test.local`    | `class-creation-teacher-a1b2c3d4@test.local`   |
| Class name    | `{spec}-class-{runId}`                 | `class-creation-class-a1b2c3d4`                |
| Join code     | `T-{RUNID}`                            | `T-A1B2C3D4`                                   |
| Auth file     | `__e2e__/.playwright/auth/{spec}.json` | `__e2e__/.playwright/auth/class-creation.json` |

> **Why a shared `runId`?** Since seeds run once in global setup, every entity in a single test run shares the same `runId`. The spec-name prefix prevents collisions between specs. If the same suite runs again (crash, CI retry), a new `runId` prevents duplicate emails/join codes.
