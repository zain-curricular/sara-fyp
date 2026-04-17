# Claude Code Skills & Sub-Agents

Skills inject domain knowledge on demand. Sub-agents execute tasks in isolated contexts with that knowledge pre-loaded.

## How the System Works

```
User request arrives
├── .claude/rules/*.md          ← ALWAYS in context (quick-reference)
├── .claude/skills/*/SKILL.md   ← Description always visible; body loads on trigger
│   └── !`cat _CONVENTIONS/...` ← Preprocessor injects convention files
└── .claude/agents/*.md         ← Description always visible; spawns on delegation
    └── skills: [name]          ← Full skill content pre-loaded into agent
```

## Decision Tree

```
Need to extend Claude's behavior →
├── Always-on? (style, naming, short rules)   → .claude/rules/*.md
├── On-demand knowledge injection?             → Skill (SKILL.md)
├── Isolated task execution?                   → Sub-agent (.claude/agents/*.md)
└── Both knowledge + execution?                → Sub-agent with skills: field
```

## The Three-Layer Stack

| Layer         | Location                              | Loaded        | Purpose                                    |
| ------------- | ------------------------------------- | ------------- | ------------------------------------------ |
| **Rule**      | `.claude/rules/<domain>.md`           | Always        | Quick-reference + triggers skill/agent     |
| **Skill**     | `.claude/skills/<name>/SKILL.md`      | On demand     | Full convention injection via preprocessor |
| **Sub-agent** | `.claude/agents/<name>-specialist.md` | On delegation | Isolated executor with skill pre-loaded    |

The rule tells Claude the skill exists. The skill holds the knowledge. The sub-agent applies it.

## Naming

| Component                | Convention                                              |
| ------------------------ | ------------------------------------------------------- |
| Skill directory + `name` | `kebab-case` matching domain: `error-handling`          |
| Agent file + `name`      | Skill name + `-specialist`: `error-handling-specialist` |
| Convention directory     | `_CONVENTIONS/<domain>/`                                |
| Rule file                | `.claude/rules/<domain>.md`                             |

## Checklist: Adding a New Domain

1. Write convention files in `_CONVENTIONS/<domain>/`
2. Add `_CONVENTIONS/<domain>/READ-BEFORE-EDITING.md` with file-to-skill mapping
3. Create `.claude/skills/<name>/SKILL.md` with `cat` preprocessor commands
4. Create `.claude/rules/<domain>.md` — quick-reference + "invoke the skill" mention
5. Create `.claude/agents/<name>-specialist.md` with `skills: [<name>]`
6. Update `_CONVENTIONS/READ-BEFORE-EDITING.md` root mapping table
7. Run `/context` to verify new skill fits within description budget

## Files

[Writing Skills](./2-writing-skills.md) → [Writing Sub-Agents](./3-writing-subagents.md)
