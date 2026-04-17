// ============================================================================
// Unit tests — getProfile (public shape)
// ============================================================================
//
// Mocks the data-access re-export layer (same module `getProfile` imports).

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/profiles/_data-access/profilesDafs', () => ({
	getProfileById: vi.fn(),
	getProfileByHandle: vi.fn(),
}))

import { getProfile } from '@/lib/features/profiles/_utils/getProfile'
import * as dafs from '@/lib/features/profiles/_data-access/profilesDafs'
import type { Profile } from '@/lib/features/profiles/types'

describe('getProfile', () => {
	beforeEach(() => {
		vi.mocked(dafs.getProfileById).mockReset()
	})

	it('returns PublicProfile without email, phone_number, or is_banned', async () => {
		const row: Profile = {
			id: '00000000-0000-4000-8000-000000000001',
			role: 'user',
			display_name: 'Test',
			avatar_url: null,
			phone_number: '+12025550123',
			phone_verified: false,
			email: 't@example.com',
			city: null,
			area: null,
			bio: null,
			is_verified: false,
			is_banned: false,
			avg_rating: 0,
			total_reviews: 0,
			total_listings: 0,
			total_sales: 0,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			handle: null,
			onboarding_completed_at: null,
			last_seen_at: null,
			locale: 'en',
		}

		vi.mocked(dafs.getProfileById).mockResolvedValue({ data: row, error: null })

		const { data, error } = await getProfile(row.id)

		expect(error).toBeNull()
		expect(data).not.toHaveProperty('email')
		expect(data).not.toHaveProperty('phone_number')
		expect(data).not.toHaveProperty('is_banned')
		expect(data?.display_name).toBe('Test')
	})
})
