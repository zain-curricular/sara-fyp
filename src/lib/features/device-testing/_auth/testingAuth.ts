// ============================================================================
// Device testing — auth helpers
// ============================================================================

import { NextResponse } from 'next/server'

import { authenticateFromRequest } from '@/lib/auth/auth'
import { getProfileById } from '@/lib/features/profiles/services'

export type TestingAuth =
	| { user: { id: string }; error: null }
	| { user: null; error: NextResponse }

export async function authenticateAndAuthorizeTester(request: Request): Promise<TestingAuth> {
	const auth = await authenticateFromRequest(request)
	if (auth.error) {
		return { user: null, error: auth.error }
	}
	const { data: profile } = await getProfileById(auth.user.id)
	if (!profile || profile.role !== 'tester') {
		return {
			user: null,
			error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }),
		}
	}
	return { user: auth.user, error: null }
}

export async function authenticateAndAuthorizeAdmin(request: Request): Promise<TestingAuth> {
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
