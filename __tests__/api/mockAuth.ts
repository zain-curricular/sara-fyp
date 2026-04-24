// ============================================================================
// API integration tests — auth mock helpers
// ============================================================================
//
// Each `route.api.test.ts` that needs auth MUST register the mock before
// importing this module or route handlers:
//
//   vi.mock('@/lib/auth/guards', () => ({ authenticateRequest: vi.fn() }))

import { NextResponse } from 'next/server'
import { vi } from 'vitest'

import { authenticateRequest } from '@/lib/auth/guards'

/** Typed reference — only valid after `vi.mock('@/lib/auth/guards', …)` in the test file. */
export const mockAuthenticateRequest = vi.mocked(authenticateRequest)

/** @deprecated use mockAuthenticateRequest */
export const mockAuthenticateFromRequest = mockAuthenticateRequest

/**
 * Resolves auth as the given user id with the buyer role by default.
 */
export function mockAuthenticatedUser(
	userId: string,
	options?: { roles?: string[]; activeRole?: string },
): void {
	mockAuthenticateRequest.mockResolvedValue({
		ok: true,
		userId,
		roles: options?.roles ?? ['buyer'],
		activeRole: options?.activeRole ?? 'buyer',
	})
}

/**
 * Resolves auth as unauthenticated (401 envelope).
 */
export function mockUnauthenticated(): void {
	mockAuthenticateRequest.mockResolvedValue({
		ok: false,
		error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
	})
}
