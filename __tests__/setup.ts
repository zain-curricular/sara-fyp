// ============================================================================
// Vitest global setup (API + optional shared)
// ============================================================================
//
// Loads `.env` like Next.js so SUPABASE_* vars are available for integration
// tests. Clears auth mocks after each test.

import { loadEnvConfig } from '@next/env'
import { afterEach, vi } from 'vitest'

loadEnvConfig(process.cwd())

afterEach(() => {
	vi.clearAllMocks()
})
