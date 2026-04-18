// ============================================================================
// Listings — authenticateAndAuthorizeListing
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth/auth', () => ({
	authenticateFromRequest: vi.fn(),
}))

vi.mock('@/lib/features/listings/core/services', () => ({
	getListingById: vi.fn(),
}))

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getListingById } from '@/lib/features/listings/core/services'
import { authenticateAndAuthorizeListing } from '../../_auth/listingAuth'

describe('authenticateAndAuthorizeListing', () => {
	beforeEach(() => {
		vi.mocked(authenticateFromRequest).mockReset()
		vi.mocked(getListingById).mockReset()
	})

	it('returns 500 when listing load fails with DB error', async () => {
		vi.mocked(authenticateFromRequest).mockResolvedValue({
			error: null,
			user: { id: 'user-1' },
		} as Awaited<ReturnType<typeof authenticateFromRequest>>)
		vi.mocked(getListingById).mockResolvedValue({
			data: null,
			error: new Error('connection reset'),
		})

		const res = await authenticateAndAuthorizeListing(
			new Request('http://localhost'),
			'00000000-0000-4000-8000-000000000001',
		)
		expect(res.error).toBeInstanceOf(NextResponse)
		expect(res.error?.status).toBe(500)
		const body = await res.error!.json()
		expect(body.error).toBe('Internal server error')
	})
})
