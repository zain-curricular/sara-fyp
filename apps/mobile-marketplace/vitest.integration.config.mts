import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname =
	typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(dirname, "src"),
			"server-only": path.resolve(dirname, "__tests__/mocks/server-only.ts"),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["src/**/*.integration.test.{ts,tsx}"],
		setupFiles: ["__tests__/setup.ts"],
		testTimeout: 30_000,
		sequence: { concurrent: false },
		passWithNoTests: true,
	},
});
