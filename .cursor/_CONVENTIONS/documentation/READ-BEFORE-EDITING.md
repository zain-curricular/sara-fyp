## Warning: File Names Are Locked

The files in this directory are **dynamically injected** into a Claude Code skill at invocation time.

One skill references these files by exact path:

- `.claude/skills/documentation/SKILL.md` (pending creation)

### Rules

- **Do not rename or move files.** The skill uses hardcoded `cat` commands against the current file names. Renaming a file will silently break injection — the skill will still invoke, but with missing content.
- **Do not add or remove files** without updating the corresponding skill SKILL.md to match.
- **Editing content is fine.** Changes are picked up automatically on next skill invocation.

### Currently Referenced Files

```
_CONVENTIONS/documentation/
├── 1-START-HERE.md                ← documentation skill
├── 2-inline-documentation.md      ← documentation skill
├── 3-readme-hierarchy.md          ← documentation skill
└── 4-convention-documentation.md  ← documentation skill
```
