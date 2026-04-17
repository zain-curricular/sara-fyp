# Layered Architecture

All server-side features follow **three layers**: API routes → Services → Data access.

```
API Route          HTTP concerns only (parse → auth → delegate → respond)
    ↓ calls
Services           Business logic + orchestration (_utils/, _auth/, _pipeline/)
    ↓ calls
Data Access        Pure database queries (_data-access/)
```

## Why: Testability

| Layer       | Test Type   | Strategy                     |
| ----------- | ----------- | ---------------------------- |
| Data Access | Integration | Real DB via `supabase start` |
| Services    | Unit        | Mock data-access imports     |
| API Routes  | Unit        | Mock service imports         |
