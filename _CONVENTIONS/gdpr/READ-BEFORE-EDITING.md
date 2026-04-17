## Warning: File Names Are Locked

The files in this directory are **dynamically injected** into a Claude Code skill at invocation time.

One skill references these files by exact path:

- `.claude/skills/gdpr/SKILL.md` (pending creation)

### Rules

- **Do not rename or move files.** The skill uses hardcoded `cat` commands against the current file names. Renaming a file will silently break injection — the skill will still invoke, but with missing content.
- **Do not add or remove files** without updating the corresponding skill SKILL.md to match.
- **Editing content is fine.** Changes are picked up automatically on next skill invocation.

### Currently Referenced Files

```
_CONVENTIONS/gdpr/
├── 1-START-HERE.md                          ← gdpr skill
├── 2-personal-data-and-storage.md           ← gdpr skill
├── 3-data-flows-and-sub-processors.md       ← gdpr skill
├── 4-childrens-data.md                      ← gdpr skill
└── 5-documentation-update-triggers.md       ← gdpr skill
```
