# Language Essentials

Docs: [Syntax](https://typst.app/docs/reference/syntax/) · [Scripting](https://typst.app/docs/reference/scripting/)

## Modes

| Mode   | Enter                  | Purpose  |
| ------ | ---------------------- | -------- |
| Markup | default / `[brackets]` | Content  |
| Code   | `#hash`                | Logic    |
| Math   | `$dollars$`            | Formulas |

```typst
Hello *bold* _italic_
#let x = 42
The answer is #x.
$a^2 + b^2 = c^2$       // inline
$ sum_(i=1)^n i $         // block (spaces inside $)
#let greeting = [*Hello*] // content block → markup as value
```

## Markup

`*bold*` · `_italic_` · `` `code` `` · `= H1` / `== H2` / `=== H3` · `- bullet` · `+ numbered` · `/ Term: def` · `\` linebreak · blank line = paragraph · `~` nbsp · `---` em-dash

## Code

```typst
#let n = none; #let b = true; #let i = 42; #let s = "hello"
#let len = 2cm; #let ang = 90deg; #let frac = 1fr; #let pct = 50%
#let arr = (1, 2, 3); #let dict = (name: "Alice", age: 30)

#let greet(name) = [Hello, *#name*!]
#let card(title, color: blue) = { rect(fill: color, inset: 8pt)[#title] }
#let double = (x) => x * 2

#let (x, y) = (1, 2)
#let (first, .., last) = (1, 2, 3, 4)

#if score >= 70 [Excellent] else if score >= 40 [OK] else [Weak]
#for item in items [- #item.name: #item.value]
```

## Imports

```typst
#import "utils.typ": helper-fn, MY_CONST
#import "@preview/mitex:0.2.5": *
#include "chapter1.typ"
```

## Operators

Arithmetic: `+ - * /` · Comparison: `== != < > <= >=` · Logical: `and or not` · `in` / `not in` · Assignment: `= += -= *= /=`

Comments: `// line` · `/* block (nestable) */` · Identifiers use **kebab-case**: `my-variable`
