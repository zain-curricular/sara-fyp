# Function Design

## Naming

**CRUD verb + resource:**

| Operation     | Pattern                    | Example                               |
| ------------- | -------------------------- | ------------------------------------- |
| Create        | `createX`, `createXWithY`  | `createAssignment`                    |
| Read (single) | `getX`, `getXByY`          | `getAssignmentOwner`                  |
| Read (list)   | `listX`, `getXForY`        | `listAssignments`                     |
| Update        | `updateX`, `updateXStatus` | `updateSubmissionStatus`              |
| Delete        | `deleteX`, `clearX`        | `deleteAssignment`                    |
| Bulk          | `bulkUpdateX`              | `bulkUpdateQuestionTopics`            |
| Analytics     | `getXForAnalytics`         | `getCompletedSubmissionsForAnalytics` |

## Inputs

Single ID for reads, typed object for creates, filter object for lists:

```typescript
getAssignment(assignmentId: string)
createAssignment(data: AssignmentInsert)
listAssignments(filters: { teacher_id?: string; status?: AssignmentStatus; limit?: number; offset?: number })
```

## Return Types

**Narrow with `Pick<>` or scoped row types** — fetch only what the caller needs:

```typescript
// Auth check — minimal fields
getAssignmentOwner(...): Promise<{ data: Pick<Assignment, "id" | "teacher_id"> | null; error: unknown }>

// Scoped row type when shape differs from table
type CreatedQuestionRow = Pick<AssignmentQuestion, "id" | "question_number">;
```

**List operations** return `PaginatedResult<T>` with `{ data, pagination: { total, limit, offset, hasMore }, error }`.
