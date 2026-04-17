# Math & LaTeX

Docs: [Math](https://typst.app/docs/reference/math/) · [Equation](https://typst.app/docs/reference/math/equation/)

## Typst ↔ LaTeX Reference

See [Language Essentials](./2-language-essentials.md) for math mode syntax (`$inline$` / `$ block $`).

| Construct | Typst                                | LaTeX equiv                 |
| --------- | ------------------------------------ | --------------------------- |
| Fraction  | `$(a+b)/c$`                          | `\frac{a+b}{c}`             |
| Root      | `$sqrt(x)$` / `$root(3,x)$`          | `\sqrt{x}` / `\sqrt[3]{x}`  |
| Sum       | `$sum_(i=0)^n$`                      | `\sum_{i=0}^{n}`            |
| Integral  | `$integral_0^1 f(x) dif x$`          | `\int_0^1 f(x)\,dx`         |
| Greek     | `$alpha, beta, pi$`                  | `\alpha, \beta, \pi`        |
| Matrix    | `$mat(1, 2; 3, 4)$`                  | `\begin{pmatrix}...`        |
| Cases     | `$cases(0 &"if" x<0, 1 &"if" x>=0)$` | `\begin{cases}...`          |
| Bold/text | `$bold(x)$` / `$x "is even"$`        | `\mathbf{x}` / `\text{...}` |

Alignment: `$ x &= 2 + 3 \ &= 5 $`

Numbered: `#set math.equation(numbering: "(1)")` then `$ E = m c^2 $ <label>`

## MiTeX (LaTeX in Typst)

Renders LaTeX notation. Included via `DOCUMENT_PREAMBLE`: `#import "@preview/mitex:0.2.5": *`

```typst
#mitex(`\frac{a}{b} + \sqrt{c}`)
#block(width: 100%, clip: false)[#mitex(`\sum_{i=1}^{n} x_i`)]  // width-constrained
```

### TypeScript Helpers

```typescript
import {
    renderLatexLine,
    renderQuestionText,
    LATEX_PATTERNS,
} from "@/lib/features/export/services";

LATEX_PATTERNS.test(text); // detect LaTeX
renderLatexLine(line); // → #block(width: 100%, clip: false)[#mitex(`...`)]
renderQuestionText(text); // auto-detect: escapeTypst() OR #mitex()

// Multi-line LaTeX (prevents overflow)
const markup = answer
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(renderLatexLine)
    .join("\n#v(3pt)\n");
```

### When to Use What

- **Native Typst math** — template-authored math you control
- **MiTeX** — user-provided LaTeX strings
- **`renderQuestionText()`** — text that may or may not contain LaTeX
