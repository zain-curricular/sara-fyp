---
name: roadmap-creator
description: "MANDATORY: Invoke this skill BEFORE writing, drafting, or restructuring any implementation roadmap under docs/<track>-roadmap/. Loads the verified INDEX.md + phase-file format (preamble, how-to-read, inventory tables, phase→PR map, dependency graph, task index, conventions, open decisions, verification) and the seven-section per-Task template that feeds ClickUp. Invoke whenever the user describes a body of work — or hands over an audit, plan, spec, or set of files — and wants it turned into a phased roadmap."
user-invokable: true
---

# Implementation Roadmap Conventions

This format is reverse-engineered from the two roadmaps that already work
end to end and that ClickUp tickets are generated from:

- `docs/cost-roadmap/` — INDEX 664 lines, 12 phases across 3 tracks, subfoldered
- `docs/distillation-roadmap/` — INDEX 352 lines, 19 phases, flat

Match them. Do not invent a new shape. The downstream consumer is the
**`task-creator`** skill, which transcribes phase files into ClickUp tasks — so
anything missing here becomes something invented there.

---

## 0 — Where roadmaps live

**Workspace root, not the service repo.** Verified: both existing roadmaps sit
in `/Users/iamcaptain/Desktop/Github/getPlus/docs/`, one level above
`protectplus-services-csai/`, because a track routinely spans several repos
(backend + merchants-app + admin-app).

```
docs/<track>-roadmap/
├── INDEX.md                  # the hub — always
├── PROGRESS.md               # running log, appended as work lands
├── phase-0-<slug>.md         # flat layout (single track)
├── phase-1-<slug>.md
└── …
```

Multi-track work subfolders by track and prefixes the phase id:

```
docs/cost-roadmap/
├── INDEX.md · PROGRESS.md · RUNBOOK-<topic>.md
├── shared/   phase-0-…md … phase-5-…md      # S0…S5
├── merchant/ phase-1-…md … phase-3-…md      # M1…M3
└── admin/    phase-1-…md … phase-3-…md      # A1…A3
```

Naming: `<track>` is a lowercase noun (`cost`, `distillation`, `rag`).
Phase files are `phase-<n>-<kebab-slug>.md`. Optional siblings when the work
warrants them: `RUNBOOK-<topic>.md`, `phase-N-manual-testing-guide.md`,
`phase-N-e2e-runbook.md`, fixture CSVs.

---

## 1 — Intake: before writing a single line

The user will hand over source material — a written explanation, an audit doc,
a plan, a spec, or several files. Work in this order:

1. **Read every source file completely.** Not excerpts.
2. **Ask the three questions the format needs and the source usually omits:**
   - Which repos does this touch, and where is the code's home (a new module? an
     existing service)?
   - Is it one track or several (e.g. shared foundation + two dashboards)?
   - Is there prior art already shipped that this completes rather than replaces?
3. **Do the grounding pass.** For every claim you intend to write under
   *Current state (verified)*, open the file and confirm it. Record real
   `file:line` anchors. Note absences explicitly — *"`src/modules/cost/` **does
   not exist**"* is a finding, not a gap in your notes.
4. **Fix a grounding date** and state it in the preamble. Every current-state
   note in the document must reflect a read on that date.
5. **Draft the phase split in chat and get confirmation** before writing files.
   The phase boundaries are the one decision that is expensive to change later.

**The hard rule:** *"Current state is verified, not assumed."* A roadmap whose
current-state notes are guessed is worse than no roadmap — it launders a guess
into a ticket into a PR. If you could not verify something, write
**⚠️ Flag** and route it to the open-decisions section.

---

## 2 — INDEX.md structure

Sections are numbered `## 0.` upward and cross-referenced as `INDEX §N`
throughout the phase files, so **the numbering is load-bearing** — fix it before
phase files start citing it.

### Required, in this order

**Title + preamble blockquote**

```markdown
# <System Name> — Implementation Roadmap (INDEX)

> **What this is.** <2–4 sentences: the outcome, phrased as the contract the
> system must satisfy. Name the sibling roadmap whose structure it mirrors.>
>
> **Target repo (backend):** `<repo>` — <why there>. **Home:** `<path>`.
> **Frontends:** `<repo>` (<surface>) …
> **Status:** planning/documentation only — **no source code is written from
> this roadmap until each phase is approved.**
> **Grounding date:** <YYYY-MM-DD> (every "Current state" note reflects a direct
> read of the repo on this date).
> **Prior art it builds on:** <what already shipped that this completes>.
```

**`## 0. How to read this roadmap`** — bullets, always covering:
- **Phase = PR.** State the id scheme (`S0…S5` / `0…12`) and that each phase is
  green on `npm run typecheck && npm run lint && npm test` before the next.
- **Order / dependency posture** — straight chain, or which tracks fan out.
- **"Current state" is verified, not assumed** — collisions become **⚠️ Flag**
  and are centralized in the open-decisions section.
- **Where shared conventions live** (§N here, or inherited from a sibling
  roadmap by link — do not restate them).
- **The North Star invariant**, if the work has one: a single sentence every
  phase can be justified against.

**`## N. <Domain> inventory`** — the evidence layer. Tables with a real
`file:line` per row and a status legend
(`✅ = handled today · ⚠️ = partially · ❌ = not at all`), grouped by subsystem.
Close with a `### Where it's currently broken/uncovered` subsection. This is
what makes the roadmap arguable instead of assertable.

**`## N. Target module tree (canonical)`** — the exact folder tree in a fence,
plus `### Files edited OUTSIDE the module (minimal, unavoidable live wiring)`.
Phase tasks cite this section instead of repeating the tree.

**`## N. The live seam (what the module reuses, verified)`** — a table of
existing primitives the work wraps **unchanged**. This is what stops phases
rewriting what already works.

**`## N. Phase → PR map`** — one table per track:

```markdown
| Phase | File | PR | Scope (one line) | Gap(s) | Depends on |
|---|---|---|---|---|---|
| **0** | [Scaffold & contracts](phase-0-scaffold-and-contracts.md) | 0 | <one line> | — | — |
```

followed by `### Dependency graph` — an ASCII graph in a fence, then a short
paragraph explaining what can ship in parallel and what genuinely blocks.

```
S0 ─▶ S1 ─┬─▶ S2 ─┐
          ├─▶ S3 ─┼─▶ S4 ─▶ S5 ─▶ A1 ─▶ A2 ─▶ A3
          └───────┴─▶ M1 ─▶ M2 ─▶ M3
```

**`## N. Task index`** — every task in the programme, one line each, so the
whole scope is readable without opening a phase file. Two styles, both fine:

```markdown
Legend: **[T]** = has explicit testing criteria · **[—]** = scaffold/docs only.

- **Phase 0 — Scaffold & contracts**
  - 0.1 Module skeleton (layered slice + READMEs) **[T]**
  - 0.2 Module-owned models — `IngestionSource`, … **[T]**
```
or the compact `·`-separated form:
```markdown
- **S0 Scaffold** — 0.1 module skeleton · 0.2 ledger + rollup models · 0.3 DTOs/types **[all T]**
```

**`## N. Clean-island conventions`** and **`## N. Comment & code conventions`** —
either inherit by link from a sibling roadmap and list only the additions, or
state them. Cover: layered slice, module-owned models, ≤500-line files, README
per folder, the single public seam, import grouping + `.js` ESM extensions,
`/** … */` file headers, `CSAIError` dotted codes, structured log prefixes.

**`## N. Resolved decisions & open items`** — every judgement call, one
subsection each:

```markdown
### N.1 <Topic> — ✅ RESOLVED (<the decision in four words>)
<why, and what it implies for which phase>

### N.6 <Topic> — ⚠️ OPEN (decision needed, targeted <phase>)
<the trade-off, who decides, what is blocked until they do>
```

Never leave a judgement call implicit in a phase file. If two phases could
reasonably disagree, it belongs here.

**`## N. Verification (every phase)`** — the exact commands, plus any
programme-wide identity that must hold (e.g. a reconciliation equation).

### Domain-specific sections

Insert as needed between the architecture and conventions sections — e.g. cost
has `## 10. Cache accounting model` and `## 11. Pricing & tokenizer model`.
Anything a phase would otherwise restate three times goes here once.

**Size:** 350–670 lines. Below ~300 the evidence layer is usually missing.

---

## 3 — Phase file structure

```markdown
# Phase <ID> — <Title>

> **PR <ID>** · **Depends on:** <phase or "nothing"> · **Unblocks:** <what>.
> **Goal:** <one paragraph. The concrete artifact. End with the safety promise —
> "with **zero runtime behavior**. `dev` stays green.">
>
> **Shared references:** module tree = [INDEX §4](../INDEX.md#4-target-module-tree-canonical);
> conventions = [INDEX §8–§9](../INDEX.md#8-clean-island-conventions).

---

## Task <N>.<M> — <Title>

### What it is
<1–2 sentences.>

### Current state (verified)
- <what exists NOW, with `file:line`>
- <what does NOT exist, said plainly>
- <the proven pattern to copy, named>

### Implementation approach
1. <numbered step>
2. <numbered step>

### Code changes
| File | Change |
|---|---|
| `path/to/file.ts` | new — <what> |
| `path/to/other.ts` | edit — <what> |

### Folder structure (this task)
<fence, or "Exactly the tree in [INDEX §4](../INDEX.md#…)">

### Comment conventions (this task)
<header format, log prefix, import grouping — cite INDEX §N.>

### Acceptance criteria
- [ ] <objective and checkable>
- [ ] `npm run typecheck && npm run lint && npm test` green

### Testing criteria
- **Engineer:** <commands + what the test asserts>
- **Non-technical:** <Success = "<plain-English outcome>">

---
```

Rules:

- **The seven `###` sections are the contract.** *What it is · Current state
  (verified) · Implementation approach · Code changes · Folder structure ·
  Comment conventions · Testing criteria.* Never drop one to save space; write
  one line instead (*"Exactly the tree in INDEX §4"*).
- **`### Acceptance criteria` is an addition to the existing format** — the two
  live roadmaps omit it, which forces `task-creator` to invent the ClickUp
  `## Acceptance Criteria` block. Include it so the ticket is a pure
  transcription. Flag it to the user the first time on a given track.
- **Include a code fence when the shape is the deliverable** — a stub signature,
  a schema, a wire payload, a folder tree. Never a full implementation.
- **Testing criteria always has both lines.** The non-technical one is a single
  sentence a PM or QA can sign off. For scaffolding, say so: *"Nothing changes
  for anyone."*
- **Tasks are `<phase>.<n>`, sequential, no gaps**, and must match the INDEX
  task index and the parent ClickUp task's `**Subtasks:**` line exactly.
- Target 5–8 tasks per phase. More than 8 means the phase is more than one PR.

**Size:** 80–550 lines; 110–250 is typical.

---

## 4 — PROGRESS.md

Created empty-ish with the roadmap; appended as work lands, not up front.

```markdown
# <Track> — Implementation Progress

Running log of completed work, one heading per ClickUp phase. Each subtask's
plain-English summary is appended as it lands; each phase gets a closing summary
when the parent task moves to review. Code lives on the `<branch>` branch of
`<repo>` (branched from `dev` @ `<sha>`, <date>).

---

## <Track> Phase <N> — <Title> (PPLUS-<id>)

### <N>.<M> — <Title> (PPLUS-<id>)

<plain-English paragraph: what was built, what it means, what is still dark.>
```

A closing `## ✅ FINAL OVERALL SUMMARY` goes at the **top** once the programme
completes, covering: what exists end to end, phase→ClickUp mapping, verification
evidence, decisions taken autonomously, deferred/blocked items, ops actions
before go-live.

---

## 5 — How this feeds ClickUp

`task-creator` transcribes, it does not author. The mapping is fixed:

| Roadmap | ClickUp |
|---|---|
| Phase file preamble blockquote | Phase parent description |
| `### What it is` + `### Current state (verified)` | `## Background` |
| `### Implementation approach` + `### Code changes` + `### Folder structure` + `### Comment conventions` | `## How to Implement` |
| `### Acceptance criteria` | `## Acceptance Criteria` |
| `### Testing criteria` | `## How to Test` |
| INDEX `Phase → PR map` `Depends on` | phase→phase `waiting_on` dependency |
| INDEX `Task index` | the parent's `**Subtasks:**` line |

If a phase file is written properly, creating the tickets requires no new
thinking. That is the test of whether the roadmap is finished.

---

## 6 — Procedure

1. Read the source material in full (§1).
2. Ask the three intake questions (§1.2).
3. Do the grounding pass with real `file:line` reads; fix the grounding date.
4. **Draft the phase split in chat — titles, one-line scopes, dependency
   order — and get confirmation.** Do not write files before this.
5. Write `INDEX.md` first; fix the section numbering before anything cites it.
6. Write the phase files, each citing `INDEX §N`.
7. Create `PROGRESS.md` with the header block only.
8. Verify every internal link resolves and every `INDEX §N` reference points at
   a real heading.
9. Report the file list and the phase table. Then stop — ticket creation is a
   separate, separately-confirmed step via `task-creator`.

### Before you call it done

- [ ] Grounding date stated; every current-state note reflects a real read
- [ ] Every current-state note carries a `file:line` or an explicit "does not exist"
- [ ] Phase → PR map + ASCII dependency graph present and consistent
- [ ] Task index lists every `<phase>.<n>` and matches the phase files
- [ ] Every phase file has the preamble blockquote and all seven `###` sections per task
- [ ] Every judgement call is in the resolved/open decisions section, not buried
- [ ] Every `INDEX §N` link resolves
- [ ] Status line says planning-only
