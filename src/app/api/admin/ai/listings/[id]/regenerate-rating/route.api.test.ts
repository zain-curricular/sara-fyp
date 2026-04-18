// ============================================================================
// API integration tests — POST /api/admin/ai/listings/[id]/regenerate-rating
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/features/listings/shared/services', () => ({
	authenticateAndAuthorizeAdminListing: vi.fn(),
}))

vi.mock('@/lib/features/ai-engine/services', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/features/ai-engine/services')>()
	return {
		...actual,
		regenerateAiRatingForListing: vi.fn(),
	}
})

import { POST } from './route'
import { authenticateAndAuthorizeAdminListing } from '@/lib/features/listings/shared/services'
import { ListingServiceError } from '@/lib/features/listings/core/services'
import { regenerateAiRatingForListing, AiError } from '@/lib/features/ai-engine/services'
import { buildJsonRequest } from '../../../../../../../../__tests__/api'

const listingId = '00000000-0000-4000-8000-0000000000b2'

describe('POST /api/admin/ai/listings/[id]/regenerate-rating', () => {
	beforeEach(() => {
		vi.mocked(authenticateAndAuthorizeAdminListing).mockReset()
		vi.mocked(regenerateAiRatingForListing).mockReset()
	})

	it('returns 401 when auth fails', async () => {
		vi.mocked(authenticateAndAuthorizeAdminListing).mockResolvedValue({
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
		})

		const res = await POST(
			buildJsonRequest(`/api/admin/ai/listings/${listingId}/regenerate-rating`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(401)
	})

	it('returns 400 when body is not empty', async () => {
		const res = await POST(
			buildJsonRequest(`/api/admin/ai/listings/${listingId}/regenerate-rating`, { x: 1 }),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(400)
	})

	it('returns 200 with rating when regeneration succeeds', async () => {
		vi.mocked(authenticateAndAuthorizeAdminListing).mockResolvedValue({
			listing: { id: listingId } as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'admin-1' },
			error: null,
		})
		vi.mocked(regenerateAiRatingForListing).mockResolvedValue({
			data: {
				rating: {
					overall: 8,
					summary: 'Good',
					pros: [],
					cons: [],
					breakdown: {
						screen: 8,
						battery: 8,
						camera: 8,
						motherboard: 8,
						sensors: 8,
					},
				},
				listing: { id: listingId } as import('@/lib/supabase/database.types').ListingRow,
			},
			error: null,
		})

		const res = await POST(
			buildJsonRequest(`/api/admin/ai/listings/${listingId}/regenerate-rating`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.rating.overall).toBe(8)
	})

	it('returns 429 when AI rate limit is hit', async () => {
		vi.mocked(authenticateAndAuthorizeAdminListing).mockResolvedValue({
			listing: { id: listingId } as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'admin-1' },
			error: null,
		})
		vi.mocked(regenerateAiRatingForListing).mockResolvedValue({
			data: null,
			error: new AiError('RATE_LIMIT'),
		})

		const res = await POST(
			buildJsonRequest(`/api/admin/ai/listings/${listingId}/regenerate-rating`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(429)
	})

	it('returns 500 with generic message for ListingServiceError INTERNAL', async () => {
		vi.mocked(authenticateAndAuthorizeAdminListing).mockResolvedValue({
			listing: { id: listingId } as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'admin-1' },
			error: null,
		})
		vi.mocked(regenerateAiRatingForListing).mockResolvedValue({
			data: null,
			error: new ListingServiceError('INTERNAL'),
		})

		const res = await POST(
			buildJsonRequest(`/api/admin/ai/listings/${listingId}/regenerate-rating`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.error).toBe('Failed to regenerate rating')
	})
})
