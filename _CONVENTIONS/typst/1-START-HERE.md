# Typst Conventions

Typst is a markup typesetting system that compiles to PDF. **TypeScript functions build Typst markup strings**, compiled via NAPI bindings.

## Pipeline

```
TS data → template fn (returns markup string) → compileTypstToPdf() → PDF Buffer → HTTP response
```

## Key Files

- `lib/features/export/_config/pdf.ts` — margins, fonts, colors, `DOCUMENT_PREAMBLE`
- `lib/features/export/services/_helpers/typstHelpers.ts` — `escapeTypst()`, `renderQuestionText()`, color helpers
- `lib/features/export/services/compileTypst.ts` — singleton compiler, `compileTypstToPdf()`
- `{module}/services/_export/*.ts` — template builder functions

## Template Pattern

Pure TS functions returning complete Typst markup. No `.typ` files — all programmatic.

```typescript
import { DOCUMENT_PREAMBLE } from "@/lib/features/export";
import {
    escapeTypst,
    colorPrimary,
    colorBorder,
} from "@/lib/features/export/services";
import { compileTypstToPdf } from "@/lib/features/export/services";

export function buildMyTemplate(title: string, data: MyData[]): string {
    let markup = DOCUMENT_PREAMBLE; // A4, 2cm margins, New Computer Modern 11pt, MiTeX, justified
    markup += `#align(center)[#text(size: 16pt, weight: "bold")[${escapeTypst(title)}]]\n`;
    for (const item of data) markup += `#block[${escapeTypst(item.text)}]\n`;
    return markup;
}

// Compilation: const pdfBuffer = await compileTypstToPdf(markup);
```

## SSTI Prevention

Typst executes code (`#read()`, `#eval()`, `#import()`). **All user content must be escaped.**

```typescript
markup += `#text[${escapeTypst(userInput)}]`; // CORRECT — plain text
markup += renderQuestionText(question.text); // CORRECT — auto-detect LaTeX
markup += renderLatexLine(answer); // CORRECT — known LaTeX
markup += `#text[${userInput}]`; // WRONG — SSTI vulnerability
```

Trusted template strings (your own Typst syntax) need no escaping.

## Reference

- [docs-index.md](./docs-index.md) — full Typst API reference links (load when needed)
