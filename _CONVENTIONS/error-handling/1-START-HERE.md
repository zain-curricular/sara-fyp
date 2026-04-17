# Error Handling Conventions

Governs **catching, recovering, propagating, communicating, logging, and reporting** errors.

## Decision Tree

```
Something failed →
├── Can I recover here?  Yes → Handle + log once + return result
│                        No  → Propagate (don't catch-and-rethrow without adding context)
├── User needs to know?  Yes → Vague, friendly toast/error state
│                        No  → Log for devs only
└── System boundary?     Yes → Catch everything, never let raw errors escape
                         No  → Only catch if you add value
```

## Error Flow

```
Client Hook         API Route              Service             Data Access
──────────         ─────────              ───────             ───────────
toast/setError ◄── { ok, error } ◄── { data, error } ◄── Supabase { data, error }
```

Errors flow upward as **return values**, not exceptions. Each layer transforms shape. Only final consumers (route catch-all, hook catch) convert to user-facing messages.

## Infrastructure

| Utility                     | Location                           | Purpose                            |
| --------------------------- | ---------------------------------- | ---------------------------------- |
| `serializeError()`          | `lib/utils/errorSerialization.ts`  | Convert unknown → readable string  |
| `logDatabaseError()`        | `lib/utils/logging.ts`             | Consistent DA error logging        |
| `validateRequestBody()`     | `lib/utils/validateRequestBody.ts` | Zod `.safeParse()` + pre-built 400 |
| `authenticateFromRequest()` | `lib/auth/auth.ts`                 | Auth + pre-built 401               |
| `AuthenticationError`       | `lib/utils/authenticatedFetch.ts`  | Custom class for 401 redirect      |
| `isNotFoundError()`         | `lib/supabase/errors.ts`           | PostgREST 404 detection (PGRST116) |

## Files

[Layer Strategies](./2-layer-strategies.md) → [Logging & Sentry](./3-logging-and-sentry.md) → [Patterns & Types](./4-patterns-and-types.md) → [Best Practices](./5-best-practices.md)
