// ============================================================================
// API integration tests — POST /api/ai/listings/[id]/description
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/features/listings/shared/services', () => ({
	authenticateAndAuthorizeListing: vi.fn(),
}))

vi.mock('@/lib/features/ai-engine/services', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/features/ai-engine/services')>()
	return {
		...actual,
		generateListingDescription: vi.fn(),
	}
})

import { POST } from './route'
import { authenticateAndAuthorizeListing } from '@/lib/features/listings/shared/services'
import { ListingServiceError } from '@/lib/features/listings/core/services'
import { generateListingDescription, AiError } from '@/lib/features/ai-engine/services'
import { buildJsonRequest } from '../../../../../../../__tests__/api'

const listingId = '00000000-0000-4000-8000-0000000000a1'

describe('POST /api/ai/listings/[id]/description', () => {
	beforeEach(() => {
		vi.mocked(authenticateAndAuthorizeListing).mockReset()
		vi.mocked(generateListingDescription).mockReset()
	})

	it('returns 401 when auth fails', async () => {
		vi.mocked(authenticateAndAuthorizeListing).mockResolvedValue({
			listing: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
		})

		const res = await POST(
			buildJsonRequest(`/api/ai/listings/${listingId}/description`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(401)
	})

	it('returns 404 for invalid uuid', async () => {
		const res = await POST(buildJsonRequest('/api/ai/listings/not-a-uuid/description', {}), {
			params: Promise.resolve({ id: 'not-a-uuid' }),
		})
		expect(res.status).toBe(404)
	})

	it('returns 200 with description when generation succeeds', async () => {
		vi.mocked(authenticateAndAuthorizeListing).mockResolvedValue({
			listing: {
				id: listingId,
				user_id: 'u1',
				category_id: 'c1',
				platform: 'mobile',
				title: 'Phone',
				details: {},
			} as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'u1' },
			error: null,
		})
		vi.mocked(generateListingDescription).mockResolvedValue({
			data: {
				description: 'Great phone.',
				listing: { id: listingId } as import('@/lib/supabase/database.types').ListingRow,
			},
			error: null,
		})

		const res = await POST(
			buildJsonRequest(`/api/ai/listings/${listingId}/description`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.ok).toBe(true)
		expect(body.data.description).toBe('Great phone.')
	})

	it('returns 400 when body is not an empty object', async () => {
		const res = await POST(
			buildJsonRequest(`/api/ai/listings/${listingId}/description`, { extra: true }),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(400)
	})

	it('returns 500 with generic message when persistence fails (not AI wording)', async () => {
		vi.mocked(authenticateAndAuthorizeListing).mockResolvedValue({
			listing: {
				id: listingId,
				user_id: 'u1',
				category_id: 'c1',
				platform: 'mobile',
				title: 'Phone',
				details: {},
			} as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'u1' },
			error: null,
		})
		vi.mocked(generateListingDescription).mockResolvedValue({
			data: null,
			error: new ListingServiceError('INTERNAL', 'Listing update failed'),
		})

		const res = await POST(
			buildJsonRequest(`/api/ai/listings/${listingId}/description`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.ok).toBe(false)
		expect(body.error).toBe('Failed to generate description')
		expect(body.error).not.toMatch(/AI request failed/i)
	})

	it('returns 429 when AI rate limit is hit', async () => {
		vi.mocked(authenticateAndAuthorizeListing).mockResolvedValue({
			listing: {
				id: listingId,
				user_id: 'u1',
				category_id: 'c1',
				platform: 'mobile',
				title: 'Phone',
				details: {},
			} as import('@/lib/supabase/database.types').ListingRow,
			user: { id: 'u1' },
			error: null,
		})
		vi.mocked(generateListingDescription).mockResolvedValue({
			data: null,
			error: new AiError('RATE_LIMIT', 'Too many requests'),
		})

		const res = await POST(
			buildJsonRequest(`/api/ai/listings/${listingId}/description`, {}),
			{ params: Promise.resolve({ id: listingId }) },
		)
		expect(res.status).toBe(429)
	})
})
