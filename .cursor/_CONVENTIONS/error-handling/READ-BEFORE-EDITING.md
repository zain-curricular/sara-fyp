## Warning: File Names Are Locked

The files in this directory are **dynamically injected** into Claude Code skills at invocation time.

Two skills reference these files by exact path:

- `.claude/skills/error-handling/SKILL.md`
- `.claude/skills/sentry/SKILL.md`

### Rules

- **Do not rename or move files.** The skills use hardcoded `cat` commands against the current file names. Renaming a file will silently break injection — the skill will still invoke, but with missing content.
- **Do not add or remove files** without updating the corresponding skill SKILL.md files to match.
- **Editing content is fine.** Changes are picked up automatically on next skill invocation.

### Currently Referenced Files

```
_CONVENTIONS/error-handling/
├── 1-START-HERE.md                                  ← error-handling skill
├── 2-layer-strategies.md                            ← error-handling skill
├── 3-logging-and-sentry.md                          ← error-handling skill
├── 4-patterns-and-types.md                          ← error-handling skill
└── 5-best-practices.md                              ← error-handling skill
```
