## Warning: File Names Are Locked

The files in this directory are **dynamically injected** into Claude Code skills at invocation time.

Four skills reference these files by exact path:

- `.claude/skills/unit-testing/SKILL.md`
- `.claude/skills/integration-testing/SKILL.md`
- `.claude/skills/api-testing/SKILL.md`
- `.claude/skills/e2e-testing/SKILL.md`

### Rules

- **Do not rename or move files.** The skills use hardcoded `cat` commands against the current file names. Renaming a file will silently break injection — the skill will still invoke, but with missing content.
- **Do not add or remove files** without updating the corresponding skill SKILL.md to match.
- **Editing content is fine.** Changes are picked up automatically on next skill invocation.

### Currently Referenced Files

```
_CONVENTIONS/testing/
├── 1-START-HERE.md                                  ← all three skills
├── 2-vitest-config.md                               ← all three skills
├── 3-shared-infrastructure.md                       ← all three skills
├── 4-general-best-practices.md                      ← all three skills
├── 1-unit-testing/
│   ├── 1-unit-tests.md                              ← unit skill
│   ├── 2-factories-and-mocking.md                   ← unit skill
│   ├── 3-writing-unit-tests.md                      ← unit skill
│   └── 4-unit-test-best-practices.md                ← unit skill
├── 2-integration-testing/
│   ├── 1-integration-tests.md                       ← integration skill
│   ├── 2-shared-seed-functions.md                   ← integration skill
│   ├── 3-writing-integration-tests.md               ← integration skill
│   └── 4-integration-test-best-practices.md         ← integration skill
├── 3-e2e-testing/
│   ├── 1-e2e-tests.md                               ← e2e skill
│   ├── 2-project-structure.md                       ← e2e skill
│   ├── 3-global-lifecycle.md                        ← e2e skill
│   ├── 4-seed-system.md                             ← e2e skill
│   ├── 5-authentication.md                          ← e2e skill
│   ├── 6-page-objects-and-fixtures.md               ← e2e skill
│   ├── 7-writing-e2e-tests.md                       ← e2e skill
│   ├── 8-best-practices.md                          ← e2e skill
│   └── 9-playwright-docs-index.md                   ← e2e skill
└── 4-api-testing/
    ├── 1-api-integration-tests.md                   ← api-testing skill
    ├── 2-auth-helpers.md                            ← api-testing skill
    ├── 3-writing-api-tests.md                       ← api-testing skill
    └── 4-api-test-best-practices.md                 ← api-testing skill
```
