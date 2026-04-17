# Supply Chain Security

**Severity: Critical** — Supply chain attacks bypass application-layer defences entirely.

**OWASP A08: Software and Data Integrity Failures**

---

## What to Check

### Config File Integrity

Build configuration files (`*.config.js`, `*.config.mjs`, `*.config.ts`) execute at build time with full Node.js access — they are high-value RCE targets.

**Red flags in config files:**

| Pattern                                 | Risk                                       |
| --------------------------------------- | ------------------------------------------ |
| `eval(`, `Function(`, `new Function`    | Code execution / indirect eval             |
| `global[`, `globalThis[`                | Global namespace manipulation (C2 pattern) |
| `\x` hex escapes, `String.fromCharCode` | Obfuscated payloads                        |
| `atob(`, `btoa(`                        | Base64-encoded payloads                    |
| Lines > 200 characters                  | Code hidden beyond viewport scroll         |
| Code after closing `};`                 | Appended payload invisible without scroll  |

**Expected config files in this codebase:**

- `postcss.config.mjs` (root + `apps/main/`) — Tailwind plugin only
- `next.config.ts` — Next.js configuration
- `tailwind.config.ts` — Tailwind theme + content paths
- `vitest.config.ts` / `playwright.config.ts` — Test configuration
- `eslint.config.mjs` — Linting rules

> Config files should be short, declarative, and contain no dynamic code execution.

### `.gitignore` Integrity

The `.gitignore` protects secrets from accidental commits. Removal of env patterns is a supply chain attack vector — it enables credential exfiltration in subsequent commits.

**Required patterns** (verified by `scripts/check-config-integrity.sh`):

- `.env.local`, `.env*.local`, `.env.me`
- `apps/*/.env.local`, `apps/*/.env.me`
- `.env.keys`, `apps/*/.env.keys`

### Dependency Review

When reviewing PRs that modify `package.json` or `package-lock.json`:

- **`postinstall` scripts** — Check for unexpected lifecycle scripts in new dependencies
- **New packages** — Verify package name matches intent (typosquatting), check download counts and maintenance status
- **Version changes** — Major version bumps may introduce breaking or malicious changes
- **Lockfile integrity** — Unexpected registry URL changes or integrity hash modifications

### Build Pipeline Security

These files have build-time code execution and are attack surfaces:

- **PostCSS** (`postcss.config.mjs`) — Runs on every CSS file during build
- **Next.js** (`next.config.ts`) — Runs at build start, has access to env vars
- **Tailwind** (`tailwind.config.ts`) — Runs during CSS compilation
- **ESLint** (`eslint.config.mjs`) — Runs during linting, can execute arbitrary plugins

---

## Known Attack Patterns

Documented from incident commit `67eb93be`:

1. **PostCSS config injection** — Obfuscated RCE payload appended after the closing `};` in `postcss.config.mjs`, invisible without horizontal scrolling
2. **Multi-stage deobfuscation** — `global['!']` as C2 identifier, `Function()` for indirect eval, hex escapes + string shuffling to evade pattern matching
3. **`.gitignore` weakening** — Env file protection patterns removed to enable credential exfiltration
4. **Visual hiding** — Malicious code placed on extremely long lines or after seemingly-complete config objects

---

## Automated Defences

| Layer            | Tool                                | What it catches                                                                         |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| **Pre-commit**   | `scripts/check-config-integrity.sh` | Malicious patterns in config files, `.gitignore` tampering, obfuscation in staged files |
| **CI**           | `security-scan` job in PR workflows | Same config checks on every PR, plus `npm audit`                                        |
| **Code review**  | CODEOWNERS on `*.config.*` files    | Requires owner approval for config changes                                              |
| **Agent review** | Security review agent               | Supply chain patterns in PR diffs                                                       |

---

## Checklist

- [ ] Config files contain only declarative configuration — no `eval`, `Function`, or dynamic execution
- [ ] No lines exceed 200 characters in config files
- [ ] No code exists after the closing export statement in config files
- [ ] `.gitignore` contains all required env protection patterns
- [ ] New dependencies have been reviewed for `postinstall` scripts and legitimacy
- [ ] `package-lock.json` changes show expected registry URLs and integrity hashes
- [ ] `scripts/check-config-integrity.sh` passes locally before pushing
