# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **shared Supabase backend** powering two AI-powered marketplace frontends — one for **mobile phones** and one for **cars**. Both platforms share the same database, auth, storage, and business logic (listings, auctions, escrow, chat, warranty). Product-specific differences (specs, inspection criteria, categories) are handled via a `platform` enum and JSONB `details`/`specs` columns — not separate tables.

## Commands

### Development

```bash
npm run dev                  # Next.js dev server
npm run build                # Production build
npm run lint                 # ESLint
npm run format               # Prettier (all files)
```

### Supabase

```bash
npm run supabase:start       # Start local Supabase (Docker)
npm run supabase:stop        # Stop local Supabase
npm run supabase:reset       # Reset DB (re-run migrations + seed)
npm run supabase:gen-types   # Regenerate database.types.ts
```

### Testing

```bash
# Unit tests (no DB needed)
npm run test                                 # Watch mode
npm run test -- --run path/to/file.test.ts   # Single file

# Integration tests (requires running Supabase)
npm run test:integration

# API integration tests
npm run test:api

# E2E tests (requires dev server + Supabase)
npm run test:e2e
npm run test:e2e:ui                          # Interactive UI mode

# Storybook
npm run storybook                            # Dev server on port 6006
```

### Installing Dependencies

```bash
npm install <package>
npm install -D <package>
```

## Architecture

### Project Layout

```
src/                # Next.js app — all product code, API routes, tests
supabase/           # Migrations, config, seed data
_CONVENTIONS/       # Architecture & convention docs (loaded by skills)
```

### App Structure (`src/`)

- **`app/`** — Next.js App Router pages and API routes. Route groups: `(auth)`, `(public)`, `(legal)`, `seller/`, `buyer/`, `admin/`
- **`lib/features/`** — Feature modules (domain logic). Each follows the two-barrel pattern (see below)
- **`lib/supabase/`** — Supabase client setup and generated types
- **`lib/auth/`** — Authentication utilities
- **`elements/`** — Shared UI components (shadcn/ui primitives + custom)
- **`middleware.ts`** — Next.js middleware

### Three-Layer Server Architecture

```
API Route  →  Services  →  Data Access
(HTTP)        (Logic)      (DB queries)
```

- **API Routes** (`app/api/`): Thin HTTP adapters — auth, validate, delegate, respond. No business logic.
- **Services** (`lib/features/{feature}/services/`): Business logic, orchestration, authorization.
- **Data Access** (`lib/features/{feature}/services/_data-access/`): Single Supabase query per function, returns `{ data, error }`.

### Feature Module Pattern

Every feature in `lib/features/{feature}/` uses **two barrels**:

- **`index.ts`** (client barrel) — types, schemas, config, hooks. Safe to import anywhere.
- **`services/index.ts`** (server barrel) — has `import "server-only"`. DAFs, auth, services.
- **`_` prefix** on subdirectories = private. External code imports via barrels only.

Active features: `listings`, `auctions`, `escrow`, `device-testing`, `ai-engine`, `product-catalog`, `messaging`, `notifications`, `profiles`, `search`, `favorites`, `reviews`, `warranty`, `admin`, `subscriptions`, `onboarding`

### Key Technology

- **Next.js 15** with App Router
- **Supabase** (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`)
- **Zod v4** for validation
- **AI SDK** (`ai` package) with Anthropic/OpenAI providers — descriptions, ratings, recommendations
- **Vitest** for unit/integration tests, **Playwright** for E2E
- **Storybook 10** for component development

## Git Workflow

- **`staging`** — integration branch. All feature branches branch from here.
- **`main`** — production. Only updated by promoting staging.
- **Always branch from `staging`**, always target PRs to `staging`.

## Key Conventions

- **Tabs** for indentation, not spaces
- **Path alias**: `@/*` resolves to `src/*`
- **`_CONVENTIONS/`** contains detailed architecture, testing, error handling, security, and other convention docs — these are loaded automatically by Claude Code skills when relevant
- **DB schema**: use `supabase` CLI to dump local schema — never read migrations directly
- **Environment files** live in the repo root

## Test Configuration

Three Vitest configs in the project root:

| Config                         | Purpose           | DB Required |
| ------------------------------ | ----------------- | ----------- |
| `vitest.config.ts`             | Unit tests        | No          |
| `vitest.integration.config.ts` | Integration tests | Yes         |
| `vitest.api.config.ts`         | API route tests   | Yes         |

Playwright config: `playwright.config.ts`

## Architecture Conventions

The following are the project's architecture conventions from `_CONVENTIONS/architecture/` and apply to **all** code written in this project.

### Core Architecture

!`cat "_CONVENTIONS/architecture/1-START-HERE.md"`

!`cat "_CONVENTIONS/architecture/2-layers-in-detail.md"`

!`cat "_CONVENTIONS/architecture/3-best-practices.md"`

### API Routes

!`cat "_CONVENTIONS/architecture/api-routes/1-START-HERE.md"`

!`cat "_CONVENTIONS/architecture/api-routes/2-restful-api-design.md"`

!`cat "_CONVENTIONS/architecture/api-routes/3-security-and-authorization.md"`

!`cat "_CONVENTIONS/architecture/api-routes/4-validation-and-input-handling.md"`

!`cat "_CONVENTIONS/architecture/api-routes/5-long-running-work.md"`

### Authentication

!`cat "_CONVENTIONS/architecture/authentication/1-START-HERE.md"`

!`cat "_CONVENTIONS/architecture/authentication/2-client-side-auth.md"`

### Data Access

!`cat "_CONVENTIONS/architecture/data-access/1-START-HERE.md"`

!`cat "_CONVENTIONS/architecture/data-access/2-function-design.md"`

!`cat "_CONVENTIONS/architecture/data-access/3-query-patterns.md"`

!`cat "_CONVENTIONS/architecture/data-access/4-best-practices.md"`

### Feature Modules

!`cat "_CONVENTIONS/architecture/feature-modules/1-START-HERE.md"`

!`cat "_CONVENTIONS/architecture/feature-modules/2-barrel-exports.md"`

!`cat "_CONVENTIONS/architecture/feature-modules/3-types-and-schemas.md"`

!`cat "_CONVENTIONS/architecture/feature-modules/4-best-practices.md"`

