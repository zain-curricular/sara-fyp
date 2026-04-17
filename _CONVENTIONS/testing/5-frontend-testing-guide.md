# Frontend Testing Guide

A practical guide for verifying changes locally before pushing. Covers the full testing workflow from quick checks to full E2E validation.

---

## Quick Reference

```bash
# From repo root — all commands target apps/main workspace

# Unit tests (fast, no DB needed)
npm -w apps/main test                         # Watch mode
npm -w apps/main run test:changed             # Only files changed since last commit
npm -w apps/main run test:unit:ci             # Single run (CI-style)
npm -w apps/main run test:unit:ci -- path/to  # Single file or directory

# API integration tests (needs local Supabase running)
npm -w apps/main run test:api                          # All API tests
npm -w apps/main run test:api -- route.api             # Single file

# DAL integration tests (needs local Supabase running)
npm -w apps/main run test:integration                          # All integration tests
npm -w apps/main run test:integration -- fileName.integration  # Single file

# E2E tests (needs production build + local Supabase)
npm -w apps/main run test:e2e                 # Full suite (headless)
npm -w apps/main run test:e2e:headed          # Visible browser
npm -w apps/main run test:e2e:ui              # Interactive Playwright UI
npm -w apps/main run test:e2e:debug           # Playwright Inspector
```

---

## Testing Workflow by Change Type

### API Route / Auth Changes

Changes to routes, middleware, or authentication logic.

1. **Run API integration tests** for the changed route:

    ```bash
    npm -w apps/main run test:api -- src/app/api/classes
    ```

2. **Run the full API test suite** to catch cascading failures:

    ```bash
    npm -w apps/main run test:api
    ```

3. **Run E2E tests** for the affected domain:
    ```bash
    npm -w apps/main run test:e2e -- --grep "classes"
    ```

### Service Layer / Business Logic Changes

Changes to services, utilities, or pure functions.

1. **Run unit tests** for the specific module:

    ```bash
    npm -w apps/main run test:unit:ci -- src/lib/features/assignments
    ```

2. **Run the full unit suite**:
    ```bash
    npm -w apps/main run test:unit:ci
    ```

### Data Access Layer Changes

Changes to database queries or Supabase interactions.

1. **Start local Supabase** (if not running):

    ```bash
    npx supabase start
    ```

2. **Run integration tests** for the module:

    ```bash
    npm -w apps/main run test:integration -- assignmentDafs.integration
    ```

3. **Run all integration tests**:
    ```bash
    npm -w apps/main run test:integration
    ```

### UI Component Changes

Changes to React components, pages, or hooks.

1. **Start the dev server** and check visually:

    ```bash
    npm -w apps/main run dev
    ```

2. **Run unit tests** for the component:

    ```bash
    npm -w apps/main run test:unit:ci -- src/components/MyComponent
    ```

3. **Run E2E tests** for the user flow:
    ```bash
    npm -w apps/main run test:e2e:headed -- --grep "class creation"
    ```

---

## Setting Up Local Testing Environment

### Prerequisites

| Tool          | Purpose             | Install                                           |
| ------------- | ------------------- | ------------------------------------------------- |
| Node.js (20+) | Runtime             | `nvm use` (see `.nvmrc`)                          |
| Docker        | Local Supabase      | [docker.com](https://docs.docker.com/get-docker/) |
| Supabase CLI  | DB management       | `npm i -g supabase`                               |
| Playwright    | E2E browser testing | `npx playwright install chromium`                 |

### Environment Setup

1. **Install dependencies**:

    ```bash
    npm install
    ```

2. **Copy env file** (if not present):

    ```bash
    cp apps/main/.env.example apps/main/.env
    ```

3. **Start local Supabase** (needed for integration, API, and E2E tests):

    ```bash
    npx supabase start
    ```

    This outputs local credentials — they should match your `.env` file.

4. **Verify setup**:

    ```bash
    # Unit tests (no DB needed)
    npm -w apps/main run test:unit:ci

    # DAL integration tests (needs Supabase running)
    npm -w apps/main run test:integration

    # API integration tests (needs Supabase running)
    npm -w apps/main run test:api

    # E2E tests (needs build + Supabase)
    npm -w apps/main run build && npm -w apps/main run test:e2e
    ```

---

## Running E2E Tests

E2E tests use **Playwright** against a production build. They authenticate as a seeded teacher user.

### First-Time Setup

```bash
# Install browser
npx playwright install chromium

# Build the app (E2E runs against production build)
npm -w apps/main run build
```

### Running Tests

```bash
# Full suite (headless)
npm -w apps/main run test:e2e

# Specific test file
npm -w apps/main run test:e2e -- __e2e__/tests/classes/classes.spec.ts

# Filter by test name
npm -w apps/main run test:e2e -- --grep "should create a class"

# With visible browser (useful for debugging)
npm -w apps/main run test:e2e:headed

# Interactive UI mode (best for development)
npm -w apps/main run test:e2e:ui

# Debug mode with Playwright Inspector
npm -w apps/main run test:e2e:debug
```

### After Test Failures

```bash
# View the HTML report
npx playwright show-report __e2e__/.playwright/report

# Re-run only failed tests
npm -w apps/main run test:e2e -- --last-failed
```

E2E traces and screenshots are captured `on-first-retry` — check `__e2e__/.playwright/test-results/` for artifacts.

---

## Pre-Push Checklist

Before pushing changes, verify:

- [ ] **Unit tests pass**: `npm -w apps/main run test:unit:ci`
- [ ] **TypeScript compiles**: `npm -w apps/main run build`
- [ ] **Lint passes**: `npm -w apps/main run lint`
- [ ] **API integration tests pass** (if route/auth changes): `npm -w apps/main run test:api`
- [ ] **DAL integration tests pass** (if DAL changes): `npm -w apps/main run test:integration`
- [ ] **E2E tests pass** (if UI/flow changes): `npm -w apps/main run test:e2e`

The CI pipeline runs all of these automatically on PR, but catching issues locally saves time.

---

## Debugging Tips

### Unit Test Failures

```bash
# Run single test with verbose output
npm -w apps/main run test:unit:ci -- --reporter verbose path/to/file.test.ts

# Run in watch mode for rapid iteration
npm -w apps/main test -- path/to/file.test.ts
```

### API Integration Test Failures

```bash
# Check Supabase is running
npx supabase status

# Run single file with verbose output
npm -w apps/main run test:api -- --reporter verbose route.api

# Reset local DB (if state is corrupted)
npx supabase db reset
```

### DAL Integration Test Failures

```bash
# Check Supabase is running
npx supabase status

# Reset local DB (if state is corrupted)
npx supabase db reset

# Run single test with 60s timeout
npm -w apps/main run test:integration -- --testTimeout 60000 fileName.integration
```

### E2E Test Failures

```bash
# Use debug mode to step through
npm -w apps/main run test:e2e:debug -- __e2e__/tests/classes/classes.spec.ts

# Check if auth session is stale — delete cached session and re-run
rm -f __e2e__/.playwright/auth/teacher.json
npm -w apps/main run test:e2e
```

---

## Related Docs

- [Testing Conventions](./_CONVENTIONS/testing/1-START-HERE.md) — Testing pyramid and core rules
- [Vitest Config](./_CONVENTIONS/testing/2-vitest-config.md) — Config files and CI workflows
- [API Integration Testing](./_CONVENTIONS/testing/4-api-testing/1-api-integration-tests.md) — API test strategy and scope
- [E2E Testing](./_CONVENTIONS/testing/3-e2e-testing/1-e2e-tests.md) — E2E strategy and scope
