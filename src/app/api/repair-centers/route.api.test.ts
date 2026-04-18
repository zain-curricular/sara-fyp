// ============================================================================
// API integration tests — GET /api/repair-centers
// ============================================================================

import { describe, it, expect } from 'vitest'

import { canRunSupabaseIntegrationTests } from '../../../../__tests__/integration'
import { GET } from './route'

describe.skipIf(!canRunSupabaseIntegrationTests)('GET /api/repair-centers', () => {
	it('returns 200 with envelope', async () => {
		const res = await GET()
		expect(res.status).toBe(200)
		const json = (await res.json()) as { ok: boolean; data: unknown }
		expect(json.ok).toBe(true)
		expect(Array.isArray(json.data)).toBe(true)
	})
})
