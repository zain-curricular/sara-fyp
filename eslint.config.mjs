import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project rule adjustments. These rules were introduced/tightened by the
  // Next 16 / React 19 upgrade (eslint-plugin-react-hooks v6) after most of this
  // codebase was written. They are relaxed here deliberately so `lint` stays
  // actionable; the underlying patterns are tracked for a dedicated cleanup pass.
  {
    rules: {
      // Cosmetic only — literal apostrophes/quotes render correctly in JSX.
      "react/no-unescaped-entities": "off",
      // Best-practice hints (not runtime bugs); surfaced as warnings, non-blocking.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
