// ============================================================================
// Vitest — API integration tests (`*.api.test.ts`)
// ============================================================================
//
// Real Supabase + mocked JWT boundary only. See `_CONVENTIONS/testing/2-vitest-config.md`.

import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['**/*.api.test.ts'],
		testTimeout: 30_000,
		sequence: { concurrent: false },
		setupFiles: ['__tests__/setup.ts'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'server-only': path.resolve(__dirname, './__tests__/mocks/server-only.ts'),
		},
	},
})
