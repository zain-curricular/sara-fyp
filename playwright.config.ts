import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";

export default defineConfig({
	testDir: "__e2e__/tests",
	globalSetup: "__e2e__/global-setup.ts",
	globalTeardown: "__e2e__/global-teardown.ts",
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: `npx next dev --turbopack -p ${port}`,
		url: `http://127.0.0.1:${port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			SKIP_SUPABASE_MIDDLEWARE: "1",
		},
	},
});
