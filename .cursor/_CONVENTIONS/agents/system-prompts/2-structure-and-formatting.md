# Structure & Formatting

## Section Order

```
# Role and Objective           ← Identity, persona, domain
# Instructions                 ← Core behavioural rules
  ## Sub-category Details       ← Grouped by concern
# Tool Guidance                ← When/how to use each tool, disambiguation
# Output Format                ← Response structure, length, style
# Examples                     ← 2–5 diverse, canonical few-shot examples
# Final Steering Instructions  ← Critical overrides (recency bias)
```

Stable content at the **beginning** (cacheable), dynamic content at the **end**. Static prefix achieves **95%+ cache hit rate** → 90% input cost savings.

## Formatting

### Delimiters

Choose one system and use consistently:

| Format               | Best For                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| **Markdown headers** | Human-readable, shorter prompts                                         |
| **XML tags**         | Embedded data needing clear boundaries                                  |
| **Mixed**            | Markdown structure + XML data blocks (`<curriculum>`, `<student_data>`) |

### Rules

- **Prompt style mirrors output style** — markdown prompt → markdown response; prose prompt → prose response
- **Critical instructions at beginning AND end** — models prioritise later content on conflict
- **One concern per section** — unstructured walls of text get lower attention weight
- **Tool definitions in API `tools` parameter** (~2% improvement) — system prompt handles disambiguation only

## Caching Layout

| Region             | Content                                         | Cache Rate             |
| ------------------ | ----------------------------------------------- | ---------------------- |
| **Static prefix**  | Role, instructions, tool defs, examples         | 95%+ ($0.30/M tokens)  |
| **Semi-dynamic**   | User profile, class data                        | 60–80%                 |
| **Dynamic suffix** | Current query, retrieved context, mode appendix | Never cached ($3.00/M) |

Never embed session-specific values (timestamps, IDs) in the static prefix. Mode appendices go **after** the base prompt.

## Token Budget

~100 input tokens per 1 output token. Input optimisation is the dominant cost lever.

| Component            | Budget % |
| -------------------- | -------- |
| System instructions  | 10–15%   |
| Tool definitions     | 15–20%   |
| Knowledge context    | 30–40%   |
| Conversation history | 20–30%   |
| Buffer reserve       | 10–15%   |

**Stay below 80%** of context window. Performance degrades beyond this threshold (**context rot**).

### Context Rot Data

- Degradation begins at **2,000–3,000 system prompt tokens**
- Full history (~113K tokens) → **30% accuracy drop** vs focused 300-token version
- Semantically similar distractors cause **more harm** than unrelated noise
- **Lost in the middle**: best recall at beginning and end, worst in the middle

## Composition Pattern

Use **base + appendix**, not monolithic prompts:

```
Base System Prompt + Mode Appendix = Final System Prompt
```

- **Base**: static identity, capabilities, guardrails, communication style
- **Appendix**: mode-specific rules, activated only when mode is active
- Higher cache hit rates, reduced token consumption, isolated maintenance
