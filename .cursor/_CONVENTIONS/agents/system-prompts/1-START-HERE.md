# System Prompt Design for Tool-Calling Agents

Best practices for writing system prompts that power tool-calling AI agents. Backed by published research from Anthropic, OpenAI, Google, and academic studies.

## The Three Pillars

| Pillar                     | Covers                                                    | Key Metric              |
| -------------------------- | --------------------------------------------------------- | ----------------------- |
| **Structure & Formatting** | Section ordering, caching layout, delimiter choice        | Cache hit rate          |
| **Instruction Design**     | Role, identity, tool guidance, examples, positive framing | Tool selection accuracy |
| **Production Patterns**    | Context management, safety, testing, anti-patterns        | Reliability, cost       |

## Three Essential Reminders (~20% Performance Boost)

Every agent system prompt should include:

1. **Persistence** — "Keep going until the user's query is completely resolved"
2. **Tool-calling** — "Use tools to gather information — do NOT guess or make up an answer"
3. **Planning** — "Plan before each tool call, reflect on the outcome after"

## Key Benchmarks

| Finding                                                        | Source               |
| -------------------------------------------------------------- | -------------------- |
| Few-shot examples → +17.8pp accuracy (46.2% → 64.0%)           | arXiv 2502.02533     |
| Prompt caching → 78.5% cost reduction (Sonnet 4.5)             | arXiv 2601.06007     |
| Tool filtering (46 → 15 tools) → 67% token reduction           | Anthropic            |
| Context >80% → reliability degradation                         | Hong et al. 2025     |
| System prompt degradation begins ~2,000–3,000 tokens           | MLOps Community 2025 |
| Persona → no statistical accuracy gain (0.004 coefficient)     | arXiv 2311.10054     |
| CoT in reasoning models → negligible gain, 20–80% latency cost | Wharton/GAIL 2025    |
