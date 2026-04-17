// ============================================================================
// User-scoped Supabase client (Bearer JWT)
// ============================================================================
//
// Used for SECURITY INVOKER RPCs (`auth.uid()`), Storage uploads under RLS, and
// any path that must run as the caller — not the service role.

import { createClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
	const v = process.env[name]
	if (!v) {
		throw new Error(`Missing required env: ${name}`)
	}
	return v
}

/**
 * Supabase client that sends the caller’s access token so Postgres `auth.uid()`
 * and Storage policies see the correct user.
 *
 * @param accessToken - JWT from `Authorization: Bearer …`.
 */
export function createUserSupabaseClient(accessToken: string) {
	const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
	const key = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
	return createClient(url, key, {
		global: {
			headers: { Authorization: `Bearer ${accessToken}` },
		},
		auth: { persistSession: false, autoRefreshToken: false },
	})
}
