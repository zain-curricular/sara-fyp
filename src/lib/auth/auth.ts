// ============================================================================
// Request authentication (generic identity)
// ============================================================================
//
// Validates who is calling an API route via Supabase Auth JWT in the
// Authorization header. Uses getUser(jwt), not getSession(), per security
// guidance — session cookies can be spoofed in some setups.
//
// Consumers
// ---------
// Feature `_auth` wrappers and routes that need `auth.uid()` without a
// resource id (e.g. PATCH /api/profiles/me).

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function anonClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !key) {
		throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
	}
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false },
	})
}

/** Successful auth: caller user id only (minimal surface for routes). */
export type AuthSuccess = { user: { id: string }; error: null }

/** Failed auth: pre-built JSON Response (401) for direct return from routes. */
export type AuthFailure = { user: null; error: NextResponse }

/**
 * Validates the Bearer JWT and returns the authenticated user's id.
 *
 * @param request - Incoming Request (reads `Authorization` header).
 * @returns Either `{ user, error: null }` or `{ user: null, error: Response }`.
 */
export async function authenticateFromRequest(request: Request): Promise<AuthSuccess | AuthFailure> {
	const header = request.headers.get('authorization')
	const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null

	// Reject missing token before touching Supabase
	if (!token) {
		return {
			user: null,
			error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
		}
	}

	const supabase = anonClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token)

	// Map Supabase auth errors to the same 401 envelope
	if (error || !user) {
		return {
			user: null,
			error: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
		}
	}

	return { user: { id: user.id }, error: null }
}

/**
 * Returns the caller’s user id when a valid Bearer token is present; otherwise
 * `null` (no 401 — for public routes that behave differently for owners).
 */
export async function getOptionalUserIdFromRequest(request: Request): Promise<string | null> {
	const header = request.headers.get('authorization')
	const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null
	if (!token) {
		return null
	}

	const supabase = anonClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(token)

	if (error || !user) {
		return null
	}

	return user.id
}
