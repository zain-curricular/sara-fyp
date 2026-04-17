# Context Engineering

Dynamically assembling all information an agent needs at runtime — instructions, data, examples, tools, history, and state — packaged optimally into the model's input.

Key insight: as token count increases, recall accuracy decreases due to **attention scarcity** (n-squared pairwise relationships). Context is a finite resource with diminishing returns.

---

## System Prompt Architecture

### Recommended Structure

```
# Role and Objective
# Instructions
## Sub-category Details
# Tool Guidance (when/how to use each tool, disambiguation)
# Output Format
# Examples (2-5 diverse, canonical)
# Final Steering Instructions (critical overrides)
```

### Three Essential Reminders (~20% performance boost)

1. **Persistence** — "Keep going until the user's query is completely resolved"
2. **Tool-calling** — "Use tools to gather information — do NOT guess or make up an answer"
3. **Planning** — "Plan before each tool call, reflect on the outcome after"

### Specificity Level

- **Too brittle**: Hardcoded if-else logic
- **Too vague**: High-level guidance without concrete signals
- **Optimal**: Specific enough to guide behaviour, flexible enough for strong heuristics. _Minimal does not mean short_ — include sufficient detail, but only detail that changes behaviour

### Formatting

- **Markdown headers** (`#`, `##`) for sections
- **XML tags** for content requiring clear boundaries
- Critical overrides near the **end** (models prioritise later instructions on conflict)
- Repeat critical instructions at **both beginning and end** for long-context documents

### Tool Definitions: Native Field

Always pass tools via the API's `tools` parameter, not in the system prompt (~2% benchmark improvement). Only use system prompt for **disambiguation and workflow sequencing**:

```
# Tool Guidance
- Use gatherRequirements to collect class and topic selections
- Use readCurriculum AFTER gatherRequirements to fetch topic content
- Use createAssignment only after both requirements AND curriculum are gathered
```

---

## The Mode System

Atlas uses mode-based architecture: different modes activate different system prompt appendices and tool sets.

**Mechanics**: `Base System Prompt + Mode Appendix = Final System Prompt`. Mode stored in `conversation.metadata.mode`, persisted across turns.

### Best Practices

1. **Progressive disclosure** — only load mode-specific instructions when active
2. **LLM-based selection** — let the model decide which mode to switch to
3. **Scoped permissions** — restrict tools to active mode needs (via `prepareStep` / `activeTools`)
4. **Clean transitions** — agent narrates what changed and why
5. **Fallback handler** — always have a default mode

### Dynamic Tool Filtering

As tool count grows, filter tools per mode. Reducing from 46 to 15 relevant tools gave **67% token reduction** without losing capability.

---

## Token Budget Management

Production agents consume ~**100 input tokens per 1 output token**. Input optimisation is the dominant cost lever.

### Budget Allocation

| Component                | Budget % | Notes                                   |
| ------------------------ | -------- | --------------------------------------- |
| **System instructions**  | 10-15%   | Disproportionate influence on behaviour |
| **Tool definitions**     | 15-20%   | Excessive tools degrade performance     |
| **Knowledge context**    | 30-40%   | Scales with task complexity             |
| **Conversation history** | 20-30%   | Requires active management              |
| **Buffer reserve**       | 10-15%   | Prevents catastrophic failures          |

### Compression Techniques

1. **Incremental summarisation** — every 5 turns, summarise into 200-token digests (70-80% reduction)
2. **Reference-based storage** — store large outputs externally, keep 100-token summaries in context
3. **Automatic compaction** — compress older messages when context exceeds 70%
4. **Tool result pruning** — clear verbose results from deep history after processing

### Prompt Caching

Move stable content to beginning, dynamic content to end:

| Content                          | Cache Hit Rate | Cost Impact   |
| -------------------------------- | -------------- | ------------- |
| System prompt + tool definitions | 95%+           | 90% reduction |
| User profiles, class data        | 60-80%         | Moderate      |
| Current query, retrieved context | Never cached   | Full price    |

---

## Dynamic vs Static Context

~**20% static** (instructions, schemas), ~**80% dynamically assembled** at runtime.

| Content Type                 | Placement                                 | Rationale                           |
| ---------------------------- | ----------------------------------------- | ----------------------------------- |
| Role, persona, constraints   | Static system prompt                      | Stable; high cache-hit              |
| Tool schemas                 | Native `tools` field                      | Models trained on structured format |
| Few-shot examples            | `# Examples` in system prompt             | Keeps tool descriptions clean       |
| Curriculum / assignment data | Loaded via tools on demand                | Avoids stale data                   |
| Conversation history         | Message array + progressive summarisation | Full recent + compressed older      |
| Mode instructions            | Appended dynamically                      | Only relevant instructions          |

### Progressive Disclosure

Atlas follows this pattern: load lightweight identifiers upfront → agent uses tools to load full data on demand → each interaction yields metadata informing the next decision.

---

## Multi-Tool Orchestration

### Sequencing

Include explicit workflow guidance in the system prompt:

```
1. gatherRequirements → collect class and topic selections
2. readCurriculum → fetch topic content
3. Generate questions based on curriculum + mode rules
4. createAssignment → save with all questions
```

### Planning Between Calls

Explicit planning between tool invocations gives ~**4% improvement**. Atlas already uses "Always write a brief message before calling any tool."

### Parallel vs Sequential

- **Parallel**: Independent calls (e.g., reading two assignments)
- **Sequential**: Dependent calls (e.g., `gatherRequirements` → `readCurriculum`)

AI SDK handles this via `stopWhen: stepCountIs(ATLAS_MAX_STEPS)`.

---

## Composable Patterns

For scaling beyond single-agent architecture:

| Pattern                  | When to Use                            |
| ------------------------ | -------------------------------------- |
| **Prompt Chaining**      | Fixed sequential subtasks              |
| **Routing**              | Distinct task categories (mode system) |
| **Parallelisation**      | Independent subtasks                   |
| **Orchestrator-Workers** | Unpredictable decomposition            |
| **Evaluator-Optimiser**  | Iterative refinement                   |

Start simple — add multi-step systems only when simpler solutions fall short.
