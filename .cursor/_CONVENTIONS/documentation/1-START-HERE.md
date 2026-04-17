# Documentation Conventions

Every changed file must have **up-to-date documentation** at three levels: inline (in the code), README (at directory boundaries), and conventions (for agent/tooling consumption). Documentation is a first-class deliverable — not an afterthought.

## Documentation Hierarchy

```
Level 1 — Inline Documentation (every file)
│  File header block, JSDoc on exports, // logic comments
│
Level 2 — README Files (directory boundaries)
│  Module root → sub-domain → service layer → component/hook layer
│  Architecture narrows and detail increases at each depth
│
Level 3 — Convention Files (_CONVENTIONS/)
│  Injected into Claude rules and sub-agent skills
│  Source of truth for automated review agents
│
└── All three levels must stay in sync after every change
```

## Decision Tree

```
Code changed →
├── New/modified file?
│   ├── File header present and accurate?     No → Update header block
│   ├── All exports have JSDoc?               No → Add JSDoc comments
│   └── Logic blocks have // comments?        No → Add inline comments
│
├── Directory structure changed?
│   ├── Nearest README reflects new files?    No → Update README
│   ├── Parent README links still valid?      No → Fix links
│   └── New directory needs its own README?   Yes → Create one
│
├── Convention-governed pattern changed?
│   ├── Convention file reflects reality?     No → Update convention
│   ├── SKILL.md cat paths still valid?       No → Fix skill
│   └── .claude/rules still accurate?         No → Fix rule
│
└── Architecture or design changed?
    ├── Module root README updated?           No → Update architecture section
    └── Mermaid diagrams still accurate?      No → Redraw diagrams
```

## Writing Style

- **Active voice** — "Atlas processes submissions" not "Submissions are processed by Atlas"
- **Bullets over prose** — short fragments, max 2 levels of indentation
- **Bold** for terms and commands, `code` for paths and variables
- **Max 3 header levels** in any single document
- **Short paragraphs** — 3–4 sentences max, then break or switch to bullets
- **Mermaid diagrams** for architecture, data flow, state machines (ensure text contrast with colours)
- **Code before prose** — show the import/signature first, then explain
- **Links over inlining** — `See [filename](./path)` instead of copying code blocks > 10 lines

## Abstraction Principle

Documentation explains **"why" and "how things connect"** — never mirrors implementation line-by-line. The reader can open the source file.

- Code snippets **< 10 lines** — show signatures, key patterns, or usage examples only
- Never copy large blocks of source code into docs — reference the file path
- If a snippet would exceed ~10 lines, summarise the logic and link to the file

## Files

[Inline Documentation](./2-inline-documentation.md) → [README Hierarchy](./3-readme-hierarchy.md) → [Convention Documentation](./4-convention-documentation.md)
