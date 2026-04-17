# README Hierarchy

READMEs exist at **directory boundaries** and form a 4-level inverted pyramid — scope narrows and detail increases at each depth.

---

## The Four Levels

```
Level 1 — Module Root
│  "What is this system and how does it fit?"
│  Architecture, design decisions, directory structure, barrel exports
│
├── Level 2 — Sub-Domain / Service Layer (services/README.md)
│   "How do I use this layer?"
│   API reference, function signatures, data flow, configuration
│
│   ├── Level 3 — Pipeline / Algorithm (_marking-pipeline/README.md)
│   │   "How does this complex subsystem work?"
│   │   Step-by-step breakdown, input/output per step, state machines
│   │
│   └── Level 4 — Hook / Component Layer (hooks/README.md)
│       "What can I call and what does it return?"
│       Props tables, composition patterns, usage examples
│
└── Always update documentation after changes
```

## Content Distribution

| Content Type         | Level 1          | Level 2            | Level 3          | Level 4        |
| -------------------- | ---------------- | ------------------ | ---------------- | -------------- |
| Architecture diagram | ✅ High-level    | ✅ System flow     | ✅ Pipeline flow | —              |
| Directory structure  | ✅ Full tree     | ✅ Layer files     | —                | —              |
| API/prop tables      | Summary          | ✅ Full signatures | ✅ Per-step I/O  | ✅ Reference   |
| Code examples        | Import patterns  | ✅ Usage           | ✅ Advanced      | ✅ Composition |
| Status workflows     | ✅ High-level    | —                  | ✅ Detailed      | —              |
| Auth/authorization   | ✅ Feature rules | Data access scope  | —                | —              |
| Error handling       | Summary          | ✅ Layer strategy  | ✅ Per-step      | —              |
| Configuration        | —                | ✅ Constants       | ✅ Tunables      | —              |

**Rule:** Never repeat content across levels. Each level answers a **different question**. Link to the deeper level for details.

---

## Level 1 — Feature Module Root

**Location:** `lib/features/{module}/README.md`
**Audience:** Developer integrating with or building on the feature
**Question answered:** "What is this system and how does it fit?"

### Required Sections

1. **Overview** — 1–2 sentences: what the feature does
2. **Architecture** — Mermaid diagram showing system flow + design principles
3. **Directory Structure** — Annotated file tree with `path → purpose` for every file
4. **Two-Barrel Pattern** — Table distinguishing client-safe (`index.ts`) from server-only (`services/index.ts`)
5. **Import Conventions** — Short code examples showing ✅ and ❌ import patterns
6. **Key Subsystems** — Brief description + link to sub-README for each complex area
7. **Database Schema** — ERD (mermaid) + status workflows (if the feature has DB tables)
8. **Related Docs** — Links to child READMEs, related features, and relevant conventions

---

## Level 2 — Service Layer / Sub-Domain

**Location:** `{module}/services/README.md` or `{sub-domain}/README.md`
**Audience:** Developer modifying or extending the layer
**Question answered:** "How do I use this layer?"

### Required Sections

1. **Purpose** — What this layer does (1 sentence)
2. **File Overview** — Table: file path + brief purpose
3. **API Reference** — Table: function name, signature, description
4. **Data Flow** — Sequence diagram or flowchart showing how functions chain
5. **Usage Examples** — Short code blocks (< 10 lines) showing import + call patterns
6. **Configuration** — Constants table (name, value, purpose) if applicable
7. **"How to Add New X"** — Step-by-step for the most common extension pattern

---

## Level 3 — Pipeline / Algorithm

**Location:** `{module}/services/_pipeline-name/README.md`
**Audience:** Developer debugging or extending the subsystem
**Question answered:** "How does this complex subsystem work?"

### Required Sections

1. **Overview** — 3–5 bullet points: what the pipeline does
2. **Architecture Diagram** — Mermaid flowchart showing all steps
3. **Files** — Table: path + 1-line purpose per file
4. **Step-by-Step Breakdown** — Subsection per major step with:
    - Responsibilities (bullet points)
    - Input/output format
    - Error handling for that step
5. **Status Workflows** — Mermaid state diagram (if applicable)
6. **Configuration** — Constants and their values

---

## Level 4 — Hook / Component Layer

**Location:** `{module}/hooks/README.md` or `{module}/components/README.md`
**Audience:** Developer consuming the hooks/components
**Question answered:** "What can I call and what does it return?"

### Required Sections

1. **File Overview** — Simple list of files in the directory
2. **Composition Pattern** — How hooks/components fit together (diagram or text)
3. **Reference** — Per hook/component:
    - Input props table (name, type, description)
    - Output/return table (name, type, description)
    - Key behaviours (bullet points)
4. **Usage Example** — Typical composition pattern with code snippet

---

## When to Create a New README

| Trigger                                 | Action                                 |
| --------------------------------------- | -------------------------------------- |
| New feature module created              | Create Level 1 README at module root   |
| New service layer or sub-domain         | Create Level 2 README in services/     |
| Complex multi-file subsystem (3+ files) | Create Level 3 README in subsystem dir |
| New hook or component group (2+ files)  | Create Level 4 README in the directory |
| New API route group                     | Create README in the route directory   |

## When to Update an Existing README

| Change                                    | Update Required                            |
| ----------------------------------------- | ------------------------------------------ |
| File added/removed/renamed in a directory | Update directory structure + file overview |
| Exported function signature changed       | Update API reference table                 |
| New subsystem or pipeline added           | Add section + link in parent README        |
| Architecture or data flow changed         | Redraw mermaid diagrams                    |
| Database schema changed                   | Update ERD + status workflow diagrams      |
| Import patterns changed                   | Update barrel export table + code examples |

---

## README Anti-Patterns

| Anti-Pattern                               | Fix                                                        |
| ------------------------------------------ | ---------------------------------------------------------- |
| README mirrors source code line-by-line    | Explain architecture + link to source files                |
| Code snippet > 10 lines                    | Trim to signature/pattern, link to file for full source    |
| Duplicated content across README levels    | Each level answers a different question — link, don't copy |
| No mermaid diagram for complex flow        | Add flowchart/sequence/state diagram                       |
| README lists files but doesn't explain why | Add purpose annotation for every file                      |
| Stale directory tree (missing new files)   | Regenerate from filesystem after changes                   |
| Missing README in a new directory          | Create one following the appropriate level template        |
| README has no "Related Docs" section       | Add links to child READMEs and related features            |
