# RESTful API Design

## URL Naming

- **Plural nouns** for collections: `/api/classes`, `/api/assignments`
- **Singular** only for current-user context: `/api/user/account`, `/api/user/profile`
- **kebab-case** for multi-word paths: `/api/signed-urls`, not `/api/signedUrls`
- **camelCase** for query params and JSON properties: `?includeClass=true`, `{ assignmentId }`
- **Name dynamic segments after the resource**: `[classId]` not `[id]`
- **Max nesting: collection/item/collection** (3 segments after `/api/`). Flatten deeper relationships

**Action endpoints** (non-CRUD operations) use POST to a noun sub-resource:

- `POST /api/classes/join`
- `POST /api/assignments/[id]/process`

## HTTP Conventions

- **Default to PATCH** for updates — clients rarely replace entire resources
- **POST** for non-CRUD actions returns 200 (sync) or 202 (async)
- **DELETE** is idempotent — returns 204 or 404, not 500
- **Batch DELETE** on collections takes `{ ids }` in the body
- **201** for resource creation (POST)
- **404 for both not-found and unauthorized** — never 403, hide resource existence
- **409** for conflicts (duplicates, state violations)
- **429** handled by Vercel WAF — no per-route rate limiting
- **500** with vague message only — never expose internals

## Query Parameters

- **Filtering:** `?status=draft&classId=abc`
- **Sorting:** `?sort=createdAt` (prefix `-` for descending: `?sort=-createdAt`)
- **Pagination:** `?limit=25&offset=0` — always enforce max via Zod `.max()`
- **Includes:** `?includeClass=true&includeStats=true` — boolean flags for optional relations
- **All query params** must pass through a Zod schema — no raw `searchParams.get()` for business logic

## Resource Relationships

- **Nest** when the child only makes sense in the parent's context (`/assignments/[id]/questions`)
- **Flatten** when the child has independent identity or nesting exceeds 3 levels
- **Always include foreign key IDs** in responses (`assignmentId`, `classId`)
- **Optional embedding** via query params (`?includeClass=true`), not automatic
