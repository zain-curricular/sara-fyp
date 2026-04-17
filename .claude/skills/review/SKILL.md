---
name: review
description: "Run local code review agents against a directory or module. Spawns parallel reviewers (architecture, bugs, security, error-handling, observability, GDPR, documentation, backwards-compat) and generates a consolidated report. Use when the user wants to review code quality before a PR."
user-invocable: true
---

# Local Code Review

Run the same review agents from CI (`.github/review-agents/`) locally against a target directory. Each agent runs as a parallel sub-agent, reads all files in scope, and returns findings. Results are consolidated into a single report file.

## Usage

```
/review <target-path>                         # all agents
/review <target-path> --agents security,bugs  # specific agents only
```

## Orchestration Steps

### 1. Parse Arguments

- `$0` = target path (required). Resolve relative to repo root
- `--agents` = comma-separated agent IDs to run (optional, default: all)
- If no target path provided, ask the user

### 2. Load Agent Config

Read `.github/review-agents/config.json`. For each agent (or filtered subset):

- Load the prompt from `.github/review-agents/prompts/<id>.md`
- Load all convention files listed in `conventions[]` and concatenate them with `---` separators

### 3. Spawn Parallel Review Agents

Launch **one Agent tool call per review agent**, all in a single message (parallel). Each agent gets this prompt structure:

```
# <Agent Name> Review

You are reviewing all code in `<target-path>` for issues in your domain.

## Your Review Prompt

<contents of prompts/<id>.md — with these adaptations:
  - Remove all references to PR diffs, `gh pr diff`, and `__PR_NUMBER__`
  - Remove all references to inline comments and `mcp__github_inline_comment__create_inline_comment`
  - Replace with: "Read all source files in <target-path> recursively"
>

## Conventions

<concatenated convention files>

## Scope

Review ALL files under: `<target-path>`
Use Glob to find files, Read to examine them. Follow imports to understand context.

## Output Format

Return your findings as a structured list. For each issue:

- **File**: relative path
- **Line**: line number (or range)
- **Severity**: Critical / High / Medium / Low
- **Issue**: one-line description
- **Detail**: 1-2 sentences explaining the problem

If no issues found, return "No issues found."

Keep output concise. No preamble, no summary — just the findings list.
```

Use `subagent_type: "general-purpose"` and `model: "sonnet"` for all agents (fast + capable enough for review).

### 4. Consolidate Report

After all agents return, write a report file at `<target-path>/REVIEW_REPORT.md`:

```markdown
# Code Review Report

**Target:** `<target-path>`
**Date:** <YYYY-MM-DD>
**Agents:** <comma-separated list of agents that ran>

---

## <Agent Name>

<findings from that agent, formatted as a table>

| File | Line | Severity | Issue |
|------|------|----------|-------|
| ... | ... | ... | ... |

> **Detail:** <detail for each row, below the table>

---

<repeat for each agent>

## Summary

| Agent | Critical | High | Medium | Low | Total |
|-------|----------|------|--------|-----|-------|
| ... | ... | ... | ... | ... | ... |
| **Total** | ... | ... | ... | ... | ... |
```

If an agent returned "No issues found", show that agent's section as:

```markdown
## <Agent Name>

No issues found.
```

### 5. Present Results

Tell the user:
- Where the report file was written
- Quick summary: total issues by severity across all agents
- If zero issues: "Clean review — no issues found."
