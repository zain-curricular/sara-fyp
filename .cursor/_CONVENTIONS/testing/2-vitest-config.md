# Vitest Configuration

Three separate configs — unit tests, DAL integration tests, and API integration tests. All live at the project root.

---

## NPM Scripts

### Local Development

```bash
npm test                    # Unit tests in watch mode
npm run test:all            # Unit + integration + API tests — single run
npm run test:ui             # Unit tests — browser UI
npm run test:coverage       # Unit tests — with coverage report
npm run test:changed        # Unit tests — only changed files
npm run test:integration    # DAL integration tests — all files
npm run test:api            # API integration tests — all files
```

### CI (DOTENV_KEY decrypts .env.vault, or env vars provided by the runner)

```bash
npm run test:unit:ci           # Unit tests — single run
npm run test:integration:ci    # DAL integration tests — single run
npm run test:api:ci            # API integration tests — single run
```

### Running a Single File

```bash
# Unit test
npm run test:unit:ci -- path/to/file.test.ts

# DAL integration test
npm run test:integration -- fileName.integration

# API integration test
npm run test:api -- route.api
```

---

## Unit Test Config (`vitest.config.ts`)

Runs all `*.test.ts` and `*.spec.ts` files **except** integration and API tests.

| Setting       | Value                                                                                  | Why                                                  |
| ------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `environment` | `happy-dom`                                                                            | Lightweight DOM implementation, faster than jsdom    |
| `setupFiles`  | `__tests__/setup.ts`                                                                   | Global cleanup, env loading, jest-dom matchers       |
| `globals`     | `true`                                                                                 | `describe`, `it`, `expect` available without imports |
| `include`     | `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`                                             | Standard test file patterns                          |
| `exclude`     | `**/*.integration.test.{ts,tsx}`, `**/*.api.test.{ts,tsx}` + node_modules, dist, .next | Integration and API tests have their own configs     |

**Path aliases:**

- `@` → `./src` (matches `tsconfig.json`)
- `server-only` → `./__tests__/mocks/server-only.ts` (stubs the Next.js server-only package so server modules can be imported in tests)

**Coverage:** v8 provider, reports in text + JSON + HTML.

**Plugins:** `@vitejs/plugin-react` — required for JSX transform in component tests.

---

## DAL Integration Test Config (`vitest.integration.config.ts`)

Runs **only** `*.integration.test.ts` files against a real Supabase instance.

| Setting               | Value                            | Why                                                              |
| --------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `environment`         | `happy-dom`                      | Same as unit config                                              |
| `setupFiles`          | `__tests__/setup.ts`             | Same shared setup                                                |
| `globals`             | `true`                           | Same as unit config                                              |
| `include`             | `**/*.integration.test.{ts,tsx}` | Only DAL integration tests                                       |
| `testTimeout`         | `30000` (30s)                    | Real DB queries + auth can be slow                               |
| `sequence.concurrent` | `false`                          | Sequential execution — avoids race conditions on shared DB state |

**Same path aliases and plugins** as the unit config. No coverage — integration tests validate correctness, not coverage metrics.

---

## API Integration Test Config (`vitest.api.config.ts`)

Runs **only** `*.api.test.ts` files — route handlers against a real Supabase instance with mocked JWT auth.

| Setting               | Value                    | Why                                                              |
| --------------------- | ------------------------ | ---------------------------------------------------------------- |
| `environment`         | `node`                   | Server-side only — no DOM needed                                 |
| `setupFiles`          | `__tests__/setup.ts`     | Same shared setup                                                |
| `globals`             | `true`                   | Same as other configs                                            |
| `include`             | `**/*.api.test.{ts,tsx}` | Only API integration tests                                       |
| `testTimeout`         | `30000` (30s)            | Real DB queries can be slow                                      |
| `sequence.concurrent` | `false`                  | Sequential execution — avoids race conditions on shared DB state |

**Same path aliases** as the unit config. No coverage.

---

## Environment Variables

All configs use the same `setup.ts`. Environment variables are loaded **before Vitest starts**:

| Environment                    | Env var source                                         |
| ------------------------------ | ------------------------------------------------------ |
| **Local dev**                  | Loaded from `.env` automatically                       |
| **PR CI** (ephemeral Supabase) | `DOTENV_KEY` decrypts `.env.vault` CI environment      |
| **Post-merge CI** (staging)    | `DOTENV_KEY` decrypts `.env.vault` staging environment |

Locally, `.env` is loaded automatically by Vitest/Next.js. In CI, the `DOTENV_KEY` env var triggers decryption of `.env.vault` for the target environment.

---

## CI Workflows

Two workflows run tests at different stages. See [CUR-67](https://linear.app/curricular/issue/CUR-67) for full details.

### PR Workflow (Ephemeral DB)

**File:** `.github/workflows/pr-tests.yml`
**Trigger:** PR targeting `staging`

```
PR branch (may have new migrations)
  │
  ├─ 1. npm run test:unit:ci        ← Unit tests (no DB needed)
  │
  ├─ 2. supabase start              ← Spin up Docker, apply all migrations from branch
  │
  ├─ 3. npm run test:integration:ci ← DAL integration tests against ephemeral DB
  │
  └─ 4. npm run test:api:ci         ← API integration tests against ephemeral DB
```

- **No secrets needed** — ephemeral instance uses local demo credentials
- The ephemeral DB schema **matches the PR branch** (migrations from the branch are applied), so code and schema are always in lockstep
- Unit tests run first (fast-fail before slow DB setup)
- DAL integration and API integration tests can run in parallel (separate CI steps)

### Post-Merge Workflow (Staging DB)

**File:** `.github/workflows/staging-smoke.yml`
**Trigger:** Push to `staging` (after merge)

```
staging branch (migrations already applied to real staging)
  │
  ├─ npm run test:integration:ci    ← DAL integration tests against real staging DB
  │
  └─ npm run test:api:ci            ← API integration tests against real staging DB
```

- **Secrets needed:** `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`, `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- Catches environment-specific issues that Docker can't replicate (RLS policies, real data, auth config)
