# Project Structure

## Directory Layout

```
__e2e__/
├── .playwright/                        # Generated at runtime (gitignored)
│   ├── auth/                           # StorageState JSON files (one per spec)
│   │   ├── auth-login.json
│   │   ├── class-creation.json
│   │   └── ...
│   ├── manifest.json                   # Seed data manifest (all spec IDs)
│   ├── report/                         # HTML test report
│   └── test-results/                   # Videos, traces, screenshots
│
├── fixtures/
│   └── index.ts                        # Custom Playwright fixtures (page objects)
│
├── global-setup.ts                     # Seeds ALL specs + generates auth sessions
├── global-teardown.ts                  # Cleans up ALL seeded data
│
├── helpers/
│   ├── api-helpers.ts                  # Supabase admin API (create/delete entities)
│   ├── auth.ts                         # Headless auth, cookie injection, token extraction
│   ├── concurrency.ts                  # Async semaphore (pLimit)
│   ├── manifest.ts                     # Manifest JSON read/write
│   └── navigation.ts                   # Auth-resilient navigation helper
│
├── pages/                              # Page Object Model classes
│   ├── login/
│   │   └── login.page.ts
│   ├── classes/
│   │   ├── classes.page.ts
│   │   └── components/
│   │       ├── create-class-dialog.component.ts
│   │       └── ...
│   ├── class-dashboard/
│   ├── assignment-dashboard/
│   │   ├── assignment-dashboard.page.ts
│   │   └── components/
│   │       └── upload-wizard-dialog.component.ts
│   ├── assignment-review/
│   ├── submission-review/
│   ├── atlas/
│   ├── onboarding/
│   ├── settings/
│   ├── report-viewer/
│   ├── submit/
│   ├── collect/
│   ├── forgot-password/
│   └── shared/
│       └── components/
│           └── navigation.component.ts
│
├── seeds/
│   ├── index.ts                        # Registry — static imports of ALL .seed.ts files
│   ├── types.ts                        # SpecSeed interface
│   └── builders.ts                     # Composable seed builders
│
└── tests/                              # Test suites (seed + spec pairs)
    ├── auth/
    │   ├── auth-login.seed.ts
    │   ├── auth-login.spec.ts
    │   ├── auth-mfa-login.seed.ts
    │   ├── auth-mfa-login.spec.ts
    │   └── ...
    ├── classes/
    ├── assignment-creation/
    ├── assignment-dashboard/
    ├── assignment-review/
    ├── submission-review/
    ├── navigation/
    ├── settings/
    ├── onboarding/
    ├── collect/
    ├── atlas/
    └── exports/
```

## Seed + Spec Pairs

Every test feature consists of **two files** in the same directory:

| File                | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `{feature}.seed.ts` | Defines data creation and cleanup for global setup/teardown |
| `{feature}.spec.ts` | Contains the actual test cases                              |

The `SPEC` constant in both files **must match** — it's the key that links seed data to test execution via the manifest.

```
tests/classes/
├── class-creation.seed.ts    # specName: "class-creation"
├── class-creation.spec.ts    # SPEC = "class-creation"
├── class-dashboard.seed.ts
├── class-dashboard.spec.ts
└── ...
```

## Spec Organisation

Specs live in `__e2e__/tests/`, grouped by **product area**. **One spec per independent flow** — this enables maximum parallelism.

| Domain                  | What Goes Here                            |
| ----------------------- | ----------------------------------------- |
| `auth/`                 | Authentication, session management, MFA   |
| `classes/`              | Class management, roster, reports         |
| `assignment-creation/`  | Assignment wizard, validation             |
| `assignment-dashboard/` | Dashboard tabs, upload, analytics         |
| `assignment-review/`    | Review page layout, navigation, approvals |
| `submission-review/`    | Per-submission review, marks, feedback    |
| `navigation/`           | Sidebar, breadcrumbs                      |
| `settings/`             | Profile, password, account deletion       |
| `onboarding/`           | Onboarding wizard flows                   |
| `collect/`              | Classroom Collect mode                    |
| `atlas/`                | Atlas AI chat                             |
| `exports/`              | Data export                               |

### When to Split vs Combine

**Split into separate files** when flows don't depend on each other's mutations. The test: _"If I deleted test B, would test A still pass with no changes?"_ If yes, they belong in separate files.

**Combine in one file** only when tests share expensive setup data and none of them mutate it destructively.

```
❌ One monolithic spec (serial, slow, cascading failures):
   auth.spec.ts → signup, login, invalid login, guards, routing

✅ Split by independent flow (parallel, fast, isolated failures):
   auth-login.spec.ts
   auth-login-invalid.spec.ts
   auth-guards.spec.ts
```

## File Naming

| Type         | Convention                                     | Example                                                     |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------- |
| Spec         | `tests/{domain}/{feature}.spec.ts`             | `tests/classes/class-creation.spec.ts`                      |
| Seed         | `tests/{domain}/{feature}.seed.ts`             | `tests/classes/class-creation.seed.ts`                      |
| Page object  | `pages/{route}/{route}.page.ts`                | `pages/classes/classes.page.ts`                             |
| Component PO | `pages/{route}/components/{name}.component.ts` | `pages/classes/components/create-class-dialog.component.ts` |

- **`.spec.ts`** for E2E (differentiates from Vitest `.test.ts`)
- **Kebab-case** everywhere
- **One spec per feature/flow**

## Playwright Configuration

See `apps/main/playwright.config.ts` for full config. Key decisions:

- **Global setup/teardown** — seeds all data and authenticates all specs before any test runs
- **Production build** — `npm run build && npm run start` (no HMR flakiness)
- **Fully parallel** — 100% workers, specs run concurrently
- **Chromium only** for now
- **Retries** — 0 locally, 2 on CI
- **Timeouts** — 60s test, 10s expect
