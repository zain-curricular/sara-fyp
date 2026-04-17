// ============================================================================
// Product catalog — admin authorization
// ============================================================================
//
// Reuses profiles.role to gate admin catalog mutations. Same pattern as
// profiles admin routes — keep one source of truth for “is admin”.

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getProfileById } from '@/lib/features/profiles/services'

export type CatalogAdminAuth =
	| { user: { id: string }; error: null }
	| { user: null; error: NextResponse }

/**
 * Ensures the request is authenticated and the caller profile has role admin.
 *
 * @param request - Incoming HTTP request (Bearer JWT).
 */
export async function authenticateAndAuthorizeAdminCatalog(
	request: Request,
): Promise<CatalogAdminAuth> {
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
