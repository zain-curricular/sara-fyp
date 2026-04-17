# E2E Testing

E2E tests validate **complete user flows** through the real application — browser, server, and database together. Few, slow, high confidence.

> **Fewer is better.** Cover critical paths thoroughly, not every edge case. Push edge-case coverage down to unit/integration layers.

## What to E2E Test

- **Authentication** — login, logout, session persistence, MFA
- **Core CRUD workflows** — create / view / edit / delete
- **Multi-step processes** — upload → parse → review → publish
- **Role-based access** — teacher views, middleware guards
- **Navigation & routing** — redirects, deep links, breadcrumbs

## What NOT to E2E Test

- Validation logic → unit test the Zod schema
- API error responses → unit test the route
- Query correctness → integration test the DAL
- Component rendering → unit test or Storybook

> **Rule of thumb:** if the test can be written at a lower level without losing confidence, write it there. Good E2E tests cross multiple boundaries (Form → API → DB → UI rendering).

## Environment

**Always test against a production build**, never the dev server (HMR re-renders, slow compilation, inconsistent middleware).

```bash
supabase start          # Spin up local Supabase
npm run test:e2e        # Build, start server, seed, run all E2E tests
npm run test:e2e -- <file path>  # Run tests at specific file path
```

Additional run modes:

```bash
npm run test:e2e:ui      # Interactive UI with timeline
npm run test:e2e:headed  # Browser visible
npm run test:e2e:debug   # Playwright Inspector
```

`npm run test:e2e` handles the production build, environment variable injection, global setup/teardown, and Playwright execution — no manual setup needed.
