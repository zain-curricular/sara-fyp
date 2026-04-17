# Agent Tooling & Environment Design

Best practices for building Atlas — a **tool-native agent** where conversation is the interface and tools are the mechanism. Tool design quality matters more than prompt engineering.

## The Three Pillars

| Pillar                  | Covers                                                      | Key Metric              |
| ----------------------- | ----------------------------------------------------------- | ----------------------- |
| **Tool Design**         | Naming, schemas, descriptions, outputs, error handling      | Tool selection accuracy |
| **Context Engineering** | System prompts, mode system, token budgets, dynamic context | Response relevance      |
| **Agent Environment**   | Orchestration, safety, human-in-the-loop, error recovery    | Reliability & trust     |
