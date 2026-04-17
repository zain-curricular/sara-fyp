// ============================================================================
// Supabase service-role (admin) client
// ============================================================================
//
// Lazily creates a single typed Supabase client with SUPABASE_SERVICE_ROLE_KEY
// for server-side data access (DAFs). RLS is bypassed — authorization must
// live in services/routes.
//
// Build safety
// ------------
// Instantiation is deferred until first `getAdmin()` call so `next build` does
// not require env vars at module evaluation time.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type AdminClient = SupabaseClient<Database>

let cached: AdminClient | null = null

function requireEnv(name: string): string {
	const v = process.env[name]
	if (!v) {
		throw new Error(`Missing required env: ${name}`)
	}
	return v
}

/**
 * Returns the singleton typed Supabase client using the service role key.
 *
 * @returns Shared client with session persistence disabled (API routes only).
 */
export function getAdmin(): AdminClient {
	if (!cached) {
		// First use: read URL + key from env and cache the client
		cached = createClient<Database>(
			requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
			requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
			{
				auth: {
					persistSession: false,
					autoRefreshToken: false,
				},
			},
		)
	}
	return cached
}
