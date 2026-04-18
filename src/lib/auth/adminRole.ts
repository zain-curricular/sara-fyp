// ============================================================================
// Admin role — request authentication (shared by admin API routes)
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getProfileById } from '@/lib/features/profiles/services'

export type AdminRoleAuth =
	| { user: { id: string }; error: null }
	| { user: null; error: NextResponse }

/**
 * Validates Bearer JWT and ensures the caller has `profiles.role === 'admin'`.
 */
export async function authenticateAndAuthorizeAdmin(request: Request): Promise<AdminRoleAuth> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { user: null, error: auth.error }
	}
	const { data: profile } = await getProfileById(auth.user.id)
	if (!profile || profile.role !== 'admin') {
		return {
			user: null,
			error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
		}
	}
	return { user: auth.user, error: null }
}
