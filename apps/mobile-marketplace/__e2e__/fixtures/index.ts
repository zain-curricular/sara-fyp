import { test as base } from "@playwright/test";

/** Extend with shared page objects / auth when e2e grows (`_CONVENTIONS/testing/3-e2e-testing/`). */
export const test = base.extend({});

export { expect } from "@playwright/test";
