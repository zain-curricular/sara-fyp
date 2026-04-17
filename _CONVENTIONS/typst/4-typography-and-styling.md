# Typography & Styling

Docs: [Text](https://typst.app/docs/reference/text/text/) · [Heading](https://typst.app/docs/reference/model/heading/) · [Styling](https://typst.app/docs/reference/styling/) · [Color](https://typst.app/docs/reference/visualize/color/) · [Table](https://typst.app/docs/reference/model/table/)

## Text

```typst
#set text(font: "New Computer Modern", size: 11pt, weight: "regular", fill: black)
#set text(font: ("Helvetica Neue", "Arial", "sans-serif")) // fallback chain
#text(size: 16pt, weight: "bold")[Large Bold]
#text(fill: rgb("#6b7280"), size: 9pt)[Small muted]
```

Key params: `font` · `size` (11pt) · `weight` (regular / 100-900) · `style` (normal/italic/oblique) · `fill` · `tracking` · `spacing` · `baseline` · `lang` · `hyphenate`

Decorations: `#underline[..]` · `#strike[..]` · `#overline[..]` · `#highlight(fill: yellow)[..]` · `#smallcaps[..]` · `#sub[..]` · `#super[..]`

## Headings

```typst
= Level 1
== Level 2
=== Level 3
#heading(level: 1)[Function form]
#set heading(numbering: "1.1.")
```

**Custom styles via show rules:**

```typst
#show heading: set text(fill: rgb("#1e40af"))
#show heading.where(level: 1): it => {
  text(size: 18pt, weight: "bold")[#it.body]
  v(4pt)
  line(length: 100%, stroke: 1pt + rgb("#1e40af"))
}
```

## Set Rules & Show Rules

**Set** — default properties for all subsequent elements:

```typst
#set text(font: "Arial", size: 12pt)
#set par(justify: true)
#set page(margin: 2cm)
```

Scoped: `#block[#set text(size: 9pt); Small text]`

**Show-set** — set rules for specific elements:

```typst
#show heading: set text(fill: navy)
```

**Show-transform** — redefine rendering:

```typst
#show heading.where(level: 1): it => block(fill: luma(230), inset: 8pt, width: 100%)[
  #text(weight: "bold", size: 16pt)[#it.body]
]
```

Selectors: `.where(level: 1)` · `"text match"` · `regex("\\d+")` · `<label>`

## Colors

```typst
rgb("#1e40af")                  // hex
rgb(30, 64, 175)                // 0-255
luma(200)                       // grayscale
cmyk(27%, 0%, 3%, 5%)           // print
color.hsl(210deg, 80%, 40%)     // HSL
```

Named: `black` · `gray` · `white` · `red` · `blue` · `green` · `yellow` · `orange` · `purple` · `navy` · `teal` · `aqua`

Methods: `.lighten(60%)` · `.darken(20%)` · `.transparentize(50%)` · `color.mix(red, blue)`

## Tables

Semantic tabular data (use `grid` for pure layout):

```typst
#table(
  columns: (auto, 1fr, 1fr), inset: 8pt, stroke: 0.5pt + gray,
  align: (left, center, center),
  fill: (_, y) => if y == 0 { luma(230) },
  table.header([*Name*], [*Score*], [*Grade*]),
  [Alice], [92], [A],
  [Bob], [78], [B],
  table.cell(colspan: 3, align: center)[_End_],
)
```

Functional params: `fill: (x, y) => ...` · `align: (x, y) => ...` · `stroke: (x, y) => ...`

Sub-elements: `table.cell(colspan, rowspan, x, y)` · `table.header(repeat: true)` · `table.footer` · `table.hline` · `table.vline`

## Lists

`- bullet` · `+ numbered` · `/ Term: def` · Customize: `#set list(marker: [--])` · `#set enum(numbering: "a)")`

## Figures

```typst
#figure(table(...), caption: [Results], placement: auto) <my-table>
See @my-table.
```
