# Documentation

Always update docs after changes.

## Structure

Title → Overview → System Design & Architecture → Quick Start → Usage Example → Config (if needed) → API (if needed) → Contributing → Related Docs

## Writing

- Active voice, short paragraphs, bullets over prose
- **Bold** for terms/commands, `code` for paths/variables, max 3 header levels
- Mermaid diagrams for architecture/data flow (ensure text contrast with colours)
- Document folder structure, link to component docs

## Abstraction

READMEs = **architectural overviews**, not code mirrors. Reader can open source files.

- Explain "why" and "how things connect" — not line-by-line implementation
- Snippets < 10 lines — signatures, key patterns, usage examples only
- Never copy large code blocks into docs — reference file path instead
- Prefer `See [filename](./path)` links over inlining
- Snippet > ~10 lines → summarise in prose, link to file
