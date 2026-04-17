// ============================================================================
// Unit tests — completeOnboarding
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/features/profiles/services', () => ({
	getProfileById: vi.fn(),
	claimHandleForProfile: vi.fn(),
	updateProfile: vi.fn(),
}))

import { completeOnboarding } from '@/lib/features/onboarding/_utils/completeOnboarding'
import * as profiles from '@/lib/features/profiles/services'
import type { Profile } from '@/lib/features/profiles/types'

function baseProfile(overrides: Partial<Profile> = {}): Profile {
	return {
		id: '00000000-0000-4000-8000-000000000001',
		role: 'user',
		display_name: 'Old',
		avatar_url: null,
		phone_number: null,
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
		...overrides,
	}
}

describe('completeOnboarding', () => {
	beforeEach(() => {
		vi.mocked(profiles.getProfileById).mockReset()
		vi.mocked(profiles.claimHandleForProfile).mockReset()
		vi.mocked(profiles.updateProfile).mockReset()
	})

	it('returns VERIFIED_PHONE_MISMATCH when input phone differs from verified profile phone', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({
			data: baseProfile({ phone_number: '+12025550123', phone_verified: true }),
			error: null,
		})

		const { error } = await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550999',
			city: 'X',
			locale: 'en',
		})

		expect((error as Error).message).toBe('VERIFIED_PHONE_MISMATCH')
		expect(profiles.updateProfile).not.toHaveBeenCalled()
	})

	it('returns NOT_FOUND when profile row missing', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({ data: null, error: null })

		const { data, error } = await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'X',
			locale: 'en',
		})

		expect(data).toBeNull()
		expect(error).toBeInstanceOf(Error)
		expect((error as Error).message).toBe('NOT_FOUND')
	})

	it('returns HANDLE_ALREADY_SET when profile handle differs from requested', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({
			data: baseProfile({ handle: 'existing_handle' }),
			error: null,
		})

		const { error } = await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'X',
			handle: 'other_handle',
			locale: 'en',
		})

		expect((error as Error).message).toBe('HANDLE_ALREADY_SET')
		expect(profiles.claimHandleForProfile).not.toHaveBeenCalled()
	})

	it('returns HANDLE_TAKEN when claim returns unique violation', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({ data: baseProfile(), error: null })
		vi.mocked(profiles.claimHandleForProfile).mockResolvedValue({
			data: null,
			error: { code: '23505', message: 'duplicate key value violates unique constraint' },
		})

		const { error } = await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'X',
			handle: 'taken_handle',
			locale: 'en',
		})

		expect((error as Error).message).toBe('HANDLE_TAKEN')
	})

	it('returns HANDLE_TAKEN when claim returns no row', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({ data: baseProfile(), error: null })
		vi.mocked(profiles.claimHandleForProfile).mockResolvedValue({ data: null, error: null })

		const { error } = await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'X',
			handle: 'new_handle',
			locale: 'en',
		})

		expect((error as Error).message).toBe('HANDLE_TAKEN')
	})

	it('claims handle then updates profile', async () => {
		const claimed = baseProfile({ handle: 'claimed_h' })
		vi.mocked(profiles.getProfileById).mockResolvedValue({ data: baseProfile(), error: null })
		vi.mocked(profiles.claimHandleForProfile).mockResolvedValue({ data: claimed, error: null })
		vi.mocked(profiles.updateProfile).mockResolvedValue({ data: claimed, error: null })

		await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'Karachi',
			handle: 'claimed_h',
			locale: 'ur',
		})

		expect(profiles.updateProfile).toHaveBeenCalledWith('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'Karachi',
			locale: 'ur',
			onboarding_completed_at: expect.any(String),
		})
	})

	it('skips claim when handle already matches', async () => {
		vi.mocked(profiles.getProfileById).mockResolvedValue({
			data: baseProfile({ handle: 'same_h' }),
			error: null,
		})
		vi.mocked(profiles.updateProfile).mockResolvedValue({ data: baseProfile({ handle: 'same_h' }), error: null })

		await completeOnboarding('u1', {
			display_name: 'A',
			phone_number: '+12025550123',
			city: 'Lahore',
			handle: 'same_h',
			locale: 'en',
		})

		expect(profiles.claimHandleForProfile).not.toHaveBeenCalled()
		expect(profiles.updateProfile).toHaveBeenCalled()
	})
})
