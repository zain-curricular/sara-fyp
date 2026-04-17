# Best Practices

## Error Handling

**Distinguish not-found from real errors** with `isNotFoundError()`:

```typescript
if (error && !isNotFoundError(error)) {
    logDatabaseError("assignments:getAssignment", { assignmentId }, error);
}
return { data, error };
```

- `PGRST116` (no rows) — null data, no logging needed
- Everything else — log with `logDatabaseError()`, return error

**Pre-insert validation** is acceptable for cheap data integrity checks (e.g. marks sum mismatch) — return `{ data: null, error: new Error(...) }`.

## Performance

- **Early return on empty input** — `if (ids.length === 0) return { data: [], error: null }`
- **Deduplicate before querying** — `[...new Set(ids)]`
- **Guard arrays** from DB: `Array.isArray(row.parts) ? row.parts : []`

## Anti-Patterns

| Anti-Pattern                    | Fix                                    |
| ------------------------------- | -------------------------------------- |
| Throwing on error               | Return `{ data, error }`               |
| Business logic in DAF           | Move to service                        |
| DAF calling another DAF         | Move to service                        |
| `select("*")` on list views     | Select only needed columns             |
| `.find()` in cross-schema merge | Use `Map` for O(1)                     |
| Missing debug logging           | Add `->` entry / `<-` exit debug calls |
