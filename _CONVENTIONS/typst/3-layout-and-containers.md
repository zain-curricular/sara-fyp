# Layout & Containers

Docs: [Page](https://typst.app/docs/reference/layout/page/) · [Grid](https://typst.app/docs/reference/layout/grid/) · [Block](https://typst.app/docs/reference/layout/block/) · [Box](https://typst.app/docs/reference/layout/box/) · [Columns](https://typst.app/docs/reference/layout/columns/) · [Align](https://typst.app/docs/reference/layout/align/) · [Pad](https://typst.app/docs/reference/layout/pad/) · [Place](https://typst.app/docs/reference/layout/place/) · [Rect](https://typst.app/docs/reference/visualize/rect/)

## Page

```typst
#set page(
  paper: "a4",
  margin: 2cm,          // or (top: 2.5cm, bottom: 2cm, left: 2cm, right: 2cm)
  columns: 1,
  numbering: "1",
  header: [My Header],
  footer: context [#align(center)[#counter(page).display("1")]],
  fill: white,
)
```

Headers/footers repeat every page. Use `context` for dynamic content (page numbers).

## Grid

Primary tool for multi-column layouts.

```typst
#grid(columns: (100pt, 200pt), [...], [...])  // fixed
#grid(columns: (1fr, 2fr), [...], [...])       // fractional
#grid(columns: (80pt, 1fr), [...], [...])      // mixed
#grid(columns: (auto, 1fr), [...], [...])      // auto + flex
#grid(columns: 3, [...], [...], [...])          // N equal

// Gutters
#grid(columns: (1fr, 1fr), gutter: 12pt, [...], [...])
#grid(columns: (1fr, 1fr), column-gutter: 16pt, row-gutter: 8pt, [...], [...])

// Cell spanning
grid.cell(colspan: 2)[Wide]
grid.cell(rowspan: 2)[Tall]

// Styling
#grid(
  columns: (1fr, 1fr),
  fill: (_, row) => if calc.odd(row) { luma(240) },
  stroke: 0.5pt + gray,
  inset: 8pt,
  align: (left, center),
  [...], [...],
)
```

## Block (block-level container)

```typst
#block(
  width: 100%, fill: rgb("#f0f9ff"), stroke: 0.5pt + rgb("#e5e7eb"),
  radius: 4pt, inset: 12pt, breakable: true,
)[Content]
```

Params: `width`, `height`, `fill`, `stroke`, `radius`, `inset`, `outset`, `breakable`, `clip`, `sticky`, `above`, `below`

## Box (inline container)

```typst
This is #box(fill: yellow, inset: 2pt, radius: 2pt)[highlighted] text.
```

Params: `width`, `height`, `baseline`, `fill`, `stroke`, `radius`, `inset`, `outset`, `clip`

## Columns

```typst
#columns(2, gutter: 16pt)[
  Text flows across columns...
  #colbreak()
  Second column.
]
```

For page-level columns, prefer `#set page(columns: 2)` (handles page breaks/footnotes).

## Spacing & Alignment

```typst
#v(8pt)                  // vertical space
#h(1fr)                  // horizontal flex fill
Left #h(1fr) Right       // push apart

#align(center)[Centered]
#align(right + bottom)[Bottom-right]
```

Values: `left` · `center` · `right` · `start` · `end` · `top` · `horizon` · `bottom` — combine with `+`

## Padding

```typst
#pad(x: 16pt)[Horizontal]
#pad(left: 20pt, top: 10pt)[Custom]
#pad(rest: 12pt)[Uniform]
```

## Place (absolute positioning)

```typst
#place(top + right, dx: -10pt, dy: 10pt)[Logo]
#place(top, float: true, scope: "parent")[#block(width: 100%)[Banner]]
```

## Recipes

**Two-column header:**

```typst
#grid(columns: (1fr, auto), [*Student:* John], align(right)[*Date:* 2024-01-15])
```

**Card with title bar:**

```typst
#block(stroke: 0.5pt + gray, radius: 4pt, width: 100%, clip: true)[
  #block(fill: rgb("#1e40af"), width: 100%, inset: 8pt)[
    #text(fill: white, weight: "bold")[Section Title]
  ]
  #pad(rest: 10pt)[Card body]
]
```

**Divider:** `#line(length: 100%, stroke: 0.5pt + rgb("#e5e7eb"))`

**Page break:** `#pagebreak()`
