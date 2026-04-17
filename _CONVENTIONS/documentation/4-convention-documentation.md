# Convention Documentation

Convention files are the **source of truth** for automated review agents. They live in `_CONVENTIONS/` and are dynamically injected into Claude rules and sub-agent skills. Any drift between conventions, skills, and rules means agents enforce stale or incorrect standards.

---

## Injection Architecture

```
_CONVENTIONS/{topic}/
├── 1-START-HERE.md
├── 2-detail.md
├── 3-detail.md
└── 4-best-practices.md
        │
        │  !`cat` commands (preprocessed at runtime)
        ▼
.claude/skills/{topic}/SKILL.md          ← Sub-agent skill (loaded on demand)
.claude/rules/conventions.md             ← Global rule (loaded every conversation)
        │
        │  Automatic injection
        ▼
Agent context (system prompt)
```

### Two Injection Paths

| Path       | Mechanism                                  | Scope                          | When Loaded                |
| ---------- | ------------------------------------------ | ------------------------------ | -------------------------- |
| **Skills** | `!`cat`in`.claude/skills/{topic}/SKILL.md` | Per-agent, on skill invocation | When agent calls the skill |
| **Rules**  | `!`cat`in`.claude/rules/conventions.md`    | Global, every conversation     | Always (auto-loaded)       |

**Architecture conventions** flow through the rules path (always active). **Domain conventions** (testing, error handling, security, etc.) flow through the skills path (loaded on demand by specialist agents).

---

## Convention File Structure

Every convention topic follows this structure:

```
_CONVENTIONS/{topic}/
├── READ-BEFORE-EDITING.md      # File-to-skill mapping metadata
├── 1-START-HERE.md             # Entry point — overview, decision tree, navigation
├── 2-{aspect}.md               # Deep dive on first major concern
├── 3-{aspect}.md               # Deep dive on second major concern
└── 4-{best-practices|aspect}.md # Best practices or additional concern
```

### Naming Rules

- **Numbered prefix** — files read in order (`1-` → `2-` → `3-` → `4-`)
- **`1-START-HERE.md`** — always the entry point with overview, diagrams, and navigation links
- **Hyphenated lowercase** for multi-word names
- **4 files typical** — expand to 5–6 only when the domain genuinely requires it
- **`READ-BEFORE-EDITING.md`** — always present, documents which skills reference which files

### Content Rules

Convention files follow the same writing style as all documentation (active voice, bullets, tables, mermaid) plus:

- **Codebase-specific examples** — use real function names, file paths, and patterns from the project
- **✅/❌ code patterns** — show both correct and incorrect usage
- **Actionable checklists** — `- [ ]` items that a review agent can verify per-PR
- **Anti-pattern tables** — map bad practice → fix
- **Severity ratings** — where applicable (Critical, High, Medium, Low, Info)
- **No generic advice** — every sentence must be grounded in this project's architecture

---

## READ-BEFORE-EDITING.md

**Required in every convention directory.** Documents the coupling between convention files and skills — prevents silent breakage from renames.

### Format

```markdown
## Warning: File Names Are Locked

The files in this directory are **dynamically injected** into a Claude Code skill at invocation time.

One skill references these files by exact path:

- `.claude/skills/{topic}/SKILL.md`

### Rules

- **Do not rename or move files.** The skill uses hardcoded `cat` commands...
- **Do not add or remove files** without updating the corresponding skill...
- **Editing content is fine.** Changes are picked up automatically...

### Currently Referenced Files

​`
_CONVENTIONS/{topic}/
├── 1-START-HERE.md                  ← {topic} skill
├── 2-{aspect}.md                    ← {topic} skill
├── 3-{aspect}.md                    ← {topic} skill
└── 4-{aspect}.md                    ← {topic} skill
​`
```

---

## SKILL.md Format

Every skill that injects conventions follows this exact template:

```yaml
---
name: { topic }
description: "MANDATORY: Invoke this skill BEFORE writing, editing, reviewing, or planning any {topic} code. This loads the project's {topic} conventions which MUST be followed — never write {topic} code without loading this skill first."
user-invokable: true
---
# {Title} Conventions

The following are the project's {topic} conventions. Use these as your source of truth when {task description}.

!`cat "_CONVENTIONS/{topic}/1-START-HERE.md"`

!`cat "_CONVENTIONS/{topic}/2-{aspect}.md"`

!`cat "_CONVENTIONS/{topic}/3-{aspect}.md"`

!`cat "_CONVENTIONS/{topic}/4-{aspect}.md"`
```

### Rules

- **One `!`cat` per convention file** — order matches the file numbering
- **Paths are relative to repo root** — always start with `"_CONVENTIONS/..."`
- **Silent failure on missing files** — if the path is wrong, that section becomes empty with **no error**
- **Description starts with "MANDATORY"** — ensures agents know to load before working

---

## Drift Detection

Drift occurs when convention content, skill injection, and rule injection are **out of sync**. The documentation agent must flag these scenarios.

### Drift Scenarios

| Scenario                                                   | Detection Method                                                 | Severity     |
| ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------ |
| Convention file renamed/moved                              | SKILL.md `!`cat` path references a non-existent file             | **Critical** |
| New convention file not added to SKILL.md                  | File exists in `_CONVENTIONS/` but has no `!`cat` referencing it | **High**     |
| Convention file deleted but SKILL.md not updated           | `!`cat` references deleted file                                  | **High**     |
| READ-BEFORE-EDITING.md doesn't list a referenced file      | File tree in metadata is stale                                   | **Medium**   |
| Convention content contradicts rules file                  | Convention says X, `.claude/rules/` says Y                       | **High**     |
| Multiple skills inject the same file differently           | Same convention file in different skill contexts                 | **Medium**   |
| Convention describes patterns that no longer exist in code | Code refactored, convention not updated                          | **High**     |

### Drift Checklist

- [ ] Every file in `_CONVENTIONS/{topic}/` (except `READ-BEFORE-EDITING.md`) has a matching `!`cat` line in a SKILL.md
- [ ] Every `!`cat` path in a SKILL.md points to an existing file
- [ ] `READ-BEFORE-EDITING.md` file tree matches the actual directory contents
- [ ] Architecture conventions in `.claude/rules/conventions.md` match `_CONVENTIONS/architecture/` contents
- [ ] No convention file describes patterns, functions, or file paths that no longer exist in the codebase
- [ ] Convention code examples compile and match current function signatures
- [ ] Anti-pattern examples are still relevant (not already fixed everywhere)

### Cross-Reference Validation

The agent should verify these mappings are complete and current:

```
_CONVENTIONS/{topic}/*.md  ←→  .claude/skills/{topic}/SKILL.md   (cat paths)
.claude/skills/{topic}/    ←→  .claude/agents/*-specialist.md     (skills: field)
.claude/rules/*.md         ←→  _CONVENTIONS/architecture/         (cat paths)
_CONVENTIONS/**/READ-BEFORE-EDITING.md  ←→  actual directory contents
```

---

## Adding a New Convention Topic

1. Create `_CONVENTIONS/{topic}/` directory
2. Write `READ-BEFORE-EDITING.md` using the template above
3. Write `1-START-HERE.md` with overview, decision tree, and navigation
4. Write 2–4 additional deep-dive files
5. Create `.claude/skills/{topic}/SKILL.md` with `!`cat` commands for each file
6. If a specialist agent exists, add the skill to `.claude/agents/{topic}-specialist.md`
7. If the topic applies globally, add `!`cat`commands to`.claude/rules/conventions.md`
8. Update the `description` field in any `.claude/rules/*.md` that references the topic

### Validation After Creation

- [ ] All `!`cat` paths resolve to existing files
- [ ] `READ-BEFORE-EDITING.md` lists all files and their consuming skill
- [ ] Skill `description` uses "MANDATORY" phrasing
- [ ] Skill is listed in the system prompt's available skills
- [ ] Convention examples use real codebase patterns (not generic/hypothetical)

---

## Convention Documentation Anti-Patterns

| Anti-Pattern                                            | Fix                                               |
| ------------------------------------------------------- | ------------------------------------------------- |
| Generic advice not grounded in codebase                 | Use real file paths, function names, and patterns |
| Convention file with no SKILL.md injection              | Create skill or add to existing one               |
| SKILL.md with wrong file path                           | Verify with `cat` — silent failures are invisible |
| READ-BEFORE-EDITING.md not updated after adding files   | Regenerate file tree section                      |
| Convention describes a pattern that was refactored away | Update convention to match current code           |
| Same guidance duplicated in convention + rules file     | Single source in convention, reference from rules |
| Convention has no checklist items                       | Add `- [ ]` items the review agent can verify     |
| Code examples use hypothetical names                    | Replace with actual exports from the codebase     |
