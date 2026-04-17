## Warning: These Files Are Consumed by Claude Code Skills

The subdirectories in `_CONVENTIONS/` are **dynamically injected** into Claude Code skills (`.claude/skills/`) at invocation time. File contents are read via hardcoded `cat` commands when a skill is invoked — so the skill always reflects the latest content, but relies on stable file paths.

### Rules

- **Do not rename, move, or delete files** without updating the corresponding skill SKILL.md files in `.claude/skills/`.
- **Do not restructure directories** without checking which skills reference them.
- **Editing content is fine.** Changes are picked up automatically on next skill invocation.
- **Adding new files is fine** — but they won't be injected unless you add a matching `cat` entry in the relevant skill.

### How It Works

Each skill in `.claude/skills/<name>/SKILL.md` contains lines like:

```
!`cat "_CONVENTIONS/testing/1-START-HERE.md"`
```

These are **preprocessed** before Claude sees the prompt — the command runs, and its output replaces the line. If the file path is wrong or the file is missing, that section silently becomes empty.

### Currently Active Mappings

| Convention Directory     | Skills That Consume It                     |
| ------------------------ | ------------------------------------------ |
| `testing/`               | `unit-testing`, `integration-testing`      |
| `debug/`                 | `observability`                            |
| `error-handling/`        | `error-handling`, `sentry`                 |
| `architecture/`          | None yet (architectural reference)         |
| `security/`              | `security`                                 |
| `api-routes/`            | `api-routes`                               |
| `inngest/`               | `inngest`                                  |
| `agent-tooling/`         | `agent-tooling`                            |
| `agents/system-prompts/` | `system-prompts`                           |
| `storybook/`             | `storybook`                                |
| `frontend/`              | `frontend`                                 |
| `claude/skills/`         | None yet (skills & sub-agents reference)   |

Each subdirectory should contain its own `READ-BEFORE-EDITING` with the specific file-to-skill mapping. See `testing/READ-BEFORE-EDITING` for an example.
