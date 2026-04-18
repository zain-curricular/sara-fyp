// ============================================================================
// Profiles — admin authorization wrapper
// ============================================================================
//
// Combines Bearer auth with “caller must be admin” and loads the target
// profile for PATCH /api/admin/profiles/:id. Returns NextResponse on failure
// so routes can `if (auth.error) return auth.error`.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getProfileById } from '../_data-access/profilesDafs'
import type { Profile } from '@/lib/features/profiles/types'

/** Success path includes full target row for delegation to adminUpdateProfile. */
export type AdminProfileAuthResult =
	| { targetProfile: Profile; user: { id: string }; error: null }
	| { targetProfile: null; user: null; error: NextResponse }

/**
 * Authenticates the request, requires admin role, and loads the target profile.
 *
 * @param request - Incoming HTTP request (Bearer token).
 * @param targetId - Profile id from the URL segment.
 */
export async function authenticateAndAuthorizeAdminProfile(
	request: Request,
	targetId: string,
): Promise<AdminProfileAuthResult> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { targetProfile: null, user: null, error: auth.error }
	}

	// Verify caller is admin via profiles.role
	const { data: caller } = await getProfileById(auth.user.id)
	if (!caller || caller.role !== 'admin') {
		return {
			targetProfile: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
		}
	}

	// Load target — 404 if missing (no existence leak)
	const { data: target } = await getProfileById(targetId)
	if (!target) {
		return {
			targetProfile: null,
			user: null,
			error: NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 }),
		}
	}

	return { targetProfile: target, user: auth.user, error: null }
}

/** Authenticated caller must have `profiles.role === 'admin'`. */
export async function authenticateAdmin(
	request: Request,
): Promise<{ user: { id: string }; error: null } | { user: null; error: NextResponse }> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { user: null, error: auth.error }
	}

	const { data: caller } = await getProfileById(auth.user.id)
	if (!caller || caller.role !== 'admin') {
		return {
			user: null,
			error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
		}
	}

	return { user: auth.user, error: null }
}
