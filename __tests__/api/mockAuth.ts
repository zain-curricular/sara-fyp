// ============================================================================
// API integration tests — auth mock helpers
// ============================================================================
//
// Each `route.api.test.ts` that needs auth MUST register the mock before
// importing this module or route handlers:
//
//   vi.mock('@/lib/auth/auth', () => ({ authenticateFromRequest: vi.fn() }))

import { NextResponse } from 'next/server'
import { vi } from 'vitest'

import { authenticateFromRequest } from '@/lib/auth/auth'

/** Typed reference — only valid after `vi.mock('@/lib/auth/auth', …)` in the test file. */
export const mockAuthenticateFromRequest = vi.mocked(authenticateFromRequest)

/**
 * Resolves auth as the given user id (matches `authenticateFromRequest` success shape).
 */
export function mockAuthenticatedUser(
	userId: string,
	options?: { emailVerified?: boolean },
): void {
	mockAuthenticateFromRequest.mockResolvedValue({
		user: {
			id: userId,
			email_confirmed_at: options?.emailVerified ? new Date().toISOString() : null,
		},
		error: null,
	})
}

/**
 * Resolves auth as missing/invalid token (401 envelope).
 */
export function mockUnauthenticated(): void {
	mockAuthenticateFromRequest.mockResolvedValue({
		user: null,
		error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
	})
}
