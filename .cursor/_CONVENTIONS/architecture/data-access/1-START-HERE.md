# Data Access Conventions

DAFs are the database boundary. **Pure query wrappers — no business logic, no orchestration.**

## Core Rules

- **DAFs query, they don't decide** — no ownership checks, no conditional branching on data, no calling other DAFs
- **One function = one question** — may use multiple queries internally (cross-schema), but answers one thing
- **Never throw** — always return `{ data, error }`

## Return Shapes

| Operation              | Shape                                            |
| ---------------------- | ------------------------------------------------ |
| Single read / Create   | `{ data: T \| null; error: unknown }`            |
| List read              | `PaginatedResult<T>` (data + pagination + error) |
| Update / Delete / Bulk | `{ error: unknown }`                             |
