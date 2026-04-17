// ============================================================================
// Vitest configuration
// ============================================================================
//
// Node environment for unit tests; `@/*` alias matches tsconfig paths so
// feature tests can import `@/lib/...` like production code.

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.next/**',
			'**/*.api.test.ts',
			'**/*.integration.test.ts',
		],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'server-only': path.resolve(__dirname, './__tests__/mocks/server-only.ts'),
		},
	},
})
