# Writing Skills

## SKILL.md Format

```yaml
---
name: error-handling # kebab-case, must match directory name
description: "..." # THE routing signal — see Descriptions
user-invocable: true # false = hidden from /menu, Claude-only
disable-model-invocation: false # true = manual /command only, description removed from context
allowed-tools: [] # Tools allowed without approval when active
context: ~ # "fork" = runs in isolated subagent context
---
# [Domain] Conventions

The following are the project's [domain] conventions.
Use these as your source of truth when [task].

!`cat "_CONVENTIONS/path/to/1-START-HERE.md"`
!`cat "_CONVENTIONS/path/to/2-detail.md"`
```

The `!`command``preprocessor executes shell commands **before Claude sees anything** — output replaces the line inline. If a file is missing, that section silently becomes empty. Arguments are available as`$ARGUMENTS` / `$0`, `$1`, `$N`.

---

## Writing Descriptions

### How Routing Works

Routing is **pure LLM semantic judgment**. No regex, no keyword scoring. Claude reads all skill descriptions alongside the user's request and reasons about relevance.

- **Descriptions are always in context** — Claude sees every skill description at all times
- **Body loads only on trigger** — full content appears only when invoked
- The description must be self-sufficient for routing decisions

### Description Budget

All descriptions share a **hard budget: ~2% of context window** (~16,000 chars fallback).

| Metric                   | Value                                                          |
| ------------------------ | -------------------------------------------------------------- |
| Per-skill overhead       | ~109 chars XML structure                                       |
| Hard cap per description | 1,024 chars                                                    |
| Truncation               | **Silent** — dropped skills are completely invisible to Claude |

| Skills installed | Target description length |
| ---------------- | ------------------------- |
| 60+              | ≤130 chars                |
| 40–60            | ≤150 chars                |
| <40              | ≤200 chars                |

Run `/context` to check. Override: `SLASH_COMMAND_TOOL_CHAR_BUDGET=30000 claude`.

### What Makes Descriptions Effective

Research-backed findings ranked by impact:

1. **Scenario enumeration** (highest impact) — List 3–5 concrete task types. Broadens matching surface more than any other technique
2. **Imperative phrasing** — "Use when..." triggers more reliably than "Handles..." because Claude is making an instruction-following decision
3. **Front-load distinctive keywords** — Budget truncation clips from the end. Domain signal in first ~50 chars
4. **Routing-only content** — Never mix behavioral instructions into descriptions. They waste budget and don't improve routing

### Description Formula

```
[Imperative trigger] + [specific domain] + [task enumeration]
```

```yaml
# Weak — vague, no trigger conditions
description: Helps with testing

# Strong — imperative, scoped, enumerated
description: "Load the project's unit testing conventions as context
for writing, debugging, or reviewing unit tests"
```

### Routing Control

| Configuration                    | User invokes | Auto-triggers | In context  |
| -------------------------------- | ------------ | ------------- | ----------- |
| Default                          | Yes          | Yes           | Always      |
| `disable-model-invocation: true` | Yes          | **No**        | **Removed** |
| `user-invocable: false`          | **No**       | Yes           | Always      |

Use `disable-model-invocation` for skills with side effects (deploy, commit).
