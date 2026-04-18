import { expect, test } from "../fixtures/index";

test("home page renders", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /browse phones/i })).toBeVisible();
});
