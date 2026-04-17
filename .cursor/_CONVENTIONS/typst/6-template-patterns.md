# Template Helpers

See [1-START-HERE](./1-START-HERE.md) for template skeleton, key files, and escaping rules.

## Colors

```typescript
colorPrimary(); // rgb("#1e40af") — headers
colorSummaryBg(); // rgb("#f0f9ff") — light bg
colorMuted(); // rgb("#6b7280") — secondary text
colorBorder(); // rgb("#e5e7eb") — dividers
// Or: import { COLOR_PRIMARY, HEADING_FONT_SIZE_PT } from "@/lib/features/export";
```

## Snippets

**Header:**

```typescript
`#align(center)[#text(size: 16pt, weight: "bold")[${escapeTypst(title)}]]\n#v(8pt)`;
```

**Metadata row:**

```typescript
`#grid(columns: (1fr, 1fr), gutter: 4pt, [*Student:* ${escapeTypst(name)}], align(right)[*Class:* ${escapeTypst(cls)}])`;
```

**Divider:** `` `#line(length: 100%, stroke: 0.5pt + ${colorBorder()})` ``

**Summary box:**

```typescript
`#rect(fill: ${colorSummaryBg()}, radius: 4pt, width: 100%, inset: 12pt)[
  #grid(columns: (1fr, auto),
    align(left)[#text(size: 13pt, weight: "bold")[Total Score]],
    align(right)[#text(size: 13pt, weight: "bold")[${marks} / ${max}]],
  )
]`;
```

**Bordered card:**

```typescript
`#block(breakable: true, width: 100%)[#rect(stroke: 0.5pt + ${colorBorder()}, radius: 3pt, width: 100%, inset: 10pt)[
  #text(weight: "bold")[Question ${num}]
  #v(4pt)
  ${renderQuestionText(text)}
]]`;
```

**MCQ option:** `` `#grid(columns: (24pt, 1fr), gutter: 4pt, [#text(weight: "bold")[${escapeTypst(label)}.]],[${escapeTypst(text)}])` ``

**Answer lines:** `#line(length: 100%, stroke: 0.3pt + ${colorBorder()})` with `#v(18pt)` between

**Page break:** `\n#pagebreak()\n`

**Spacing:** `#v(8pt)` small · `#v(12pt)` medium · `#v(24pt)` large

## Checklist

1. Start with `DOCUMENT_PREAMBLE`
2. Escape all user data
3. Use color helpers
4. `breakable: true` on page-spanning blocks
5. `width: 100%` on blocks/rects
6. `#pagebreak()` between sections
7. Sort data before iterating
8. Test edge cases: empty strings, long text, LaTeX, special chars

## Custom Page Setup

```typescript
let markup = `${MITEX_IMPORT}
#set page(paper: "a4", margin: (top: 3cm, bottom: 2cm, x: 1.5cm),
  header: [#grid(columns: (1fr, auto),
    [#text(size: 9pt, fill: ${colorMuted()})[${escapeTypst(title)}]],
    align(right)[#text(size: 9pt, fill: ${colorMuted()})[Page #counter(page).display()]],
  )], footer: [])
#set text(font: "New Computer Modern", size: 11pt)
#set par(justify: true)`;
```
