# Writing Sub-Agents

## Agent File Format

```yaml
# .claude/agents/<name>.md — frontmatter (config) + body (system prompt)
---
name: unit-test-specialist        # kebab-case, becomes subagent_type for Task tool
description: "..."                # THE routing signal — see Descriptions
tools: Bash, Glob, Grep, Read, Edit, Write
model: sonnet                     # haiku | sonnet | opus | inherit
skills:
  - unit-testing                  # Full skill content pre-loaded (not just description)
---

# [Agent Name]

You are an expert [role]. Your conventions have been loaded
via the `[skill]` skill — follow them exactly.

## Workflow
### 1. Load Context — [what to read first]
### 2. Understand the Code — [analysis steps]
### 3. Execute Task — [numbered steps]
### 4. Validate — [verification steps]

[Boundary: what NOT to do]
```

### Key Frontmatter Fields

| Field             | Notes                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| `tools`           | Allowlist. Inherits all if omitted. Least-privilege: only grant what's needed   |
| `disallowedTools` | Denylist — removes from inherited set                                           |
| `skills`          | **Full** skill body injected at startup. Only preload what agent actually needs |
| `model`           | `haiku` for read-only, `sonnet` for coding, `opus` for complex reasoning        |
| `maxTurns`        | Hard cap on agentic turns                                                       |
| `memory`          | `user` / `project` / `local` for persistent cross-session notes                 |

---

## Writing Agent Descriptions

### How Delegation Routing Works

Same mechanism as skills — **pure LLM semantic judgment**. Claude reads agent descriptions and decides whether to delegate or handle inline.

**What drives routing:**

- `description` — the sole automatic signal
- `.claude/rules/` — loaded into main context, can explicitly instruct delegation

**What does NOT drive routing:** agent `name`, `tools`, `model` — these affect capability, not selection.

### Auto-Delegation Is Unreliable

Community testing consistently shows: **auto-delegation from descriptions alone is inconsistent.** Claude often handles tasks inline rather than spawning an agent.

The reliable pattern is **double redundancy**:

```
.claude/rules/<domain>.md   ← "When writing X, use the X-specialist agent"
.claude/agents/<name>.md    ← description reinforces the same trigger
```

Rules are **more authoritative** — they load into Claude's primary context as direct instructions. Descriptions are fallback/reinforcement.

### What Makes Descriptions Effective

Research-backed patterns ranked by impact:

1. **Scenario enumeration** (highest impact) — List 3–5 concrete task types. Broadens matching surface more than any other technique

2. **Imperative delegation language** — Tell Claude to hand off, don't describe capabilities

| Weak                     | Strong                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| "Handles error handling" | "Use this agent whenever the user asks you to write or review error handling code" |
| "An expert in testing"   | "WHENEVER writing unit tests, hand the task off to this agent"                     |

3. **Urgency signals** — `WHENEVER`, `ALWAYS`, `proactively` raise delegation probability (no guarantee)

4. **"When NOT to use" boundaries** — Critical for overlapping agents. Without this, routing between similar agents is non-deterministic

5. **Front-load distinctive keywords** — Budget truncation clips from the end

6. **Routing-only content** — Never put behavioral instructions in descriptions. They waste characters and don't improve routing. Workflow/constraints belong in the body

### Description Formula

```
[Imperative trigger] + [scope enumeration] + [urgency reinforcement]
```

```yaml
description: >
    Use this agent whenever the user asks you to write or review error
    handling code. This includes try/catch blocks, return-based error
    patterns, API route error responses, Zod validation, or fixing
    anti-patterns. WHENEVER writing or editing error handling logic,
    hand the task off to this agent.
```
