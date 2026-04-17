# Best Practices

## Do

### Keep Routes Thin

Readable in under 30 seconds. If it has logic, extract to a service.

### Skip Wrappers for Simple CRUD

Don't create pass-through services. Call data-access directly via service barrel for simple reads.

### Extract to Service When Logic Appears

Create a service when a route needs:

- Multiple dependent data-access calls
- Ownership/authorization checks beyond simple auth
- Data transformation (merge, compute, reshape)
- Conditional branching on data values
- Side effects (storage cleanup, notifications)

### One DAF = One Question

One logical DB operation per function. Can use multiple queries internally (e.g. cross-schema), but answers one question.

---

## Don't

### Don't Put Business Logic in Data Access

Data-access returns data. Services decide what it means.

### Don't Build Queries in Routes

Routes call the service barrel, never import `admin`.

### Don't Chain Data-Access Within Data Access

If one DAF calls another, that's orchestration — move to a service.

### Don't Throw in Data Access

Always return `{ data, error }`. Never throw.

---

## Quick Reference

| Question                               | Answer                                             |
| -------------------------------------- | -------------------------------------------------- |
| Where does auth happen?                | Route (simple) or auth service (complex ownership) |
| Where does validation happen?          | Route (Zod schema)                                 |
| Where does business logic go?          | Services (`_utils/`, `_auth/`, `_pipeline/`)       |
| Where do DB queries go?                | `_data-access/`                                    |
| Can a route call data-access directly? | Yes, for simple reads (via service barrel)         |
| Can a DAF call another DAF?            | No — orchestration belongs in service              |
| Data-access return shape?              | `{ data, error }` tuples                           |
| Service return shape?                  | Discriminated unions or `{ data, error }`          |
| Route return shape?                    | `{ ok: true, data }` or `{ ok: false, error }`     |
