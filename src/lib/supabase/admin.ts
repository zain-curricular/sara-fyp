// ============================================================================
// Supabase Admin Client
// ============================================================================
//
// Service-role client for privileged server-side operations (order creation,
// escrow releases, admin mutations). Never expose to the browser.
//
// Usage
// -----
// import { createAdminSupabaseClient } from "@/lib/supabase/admin"
// const supabase = createAdminSupabaseClient()

import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requirePublicSupabaseUrl } from "@/lib/supabase/env";

function requireServiceRoleKey(): string {
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
	return key;
}

/** Bypasses RLS. Only use in trusted server contexts (route handlers, Edge Functions). */
export function createAdminSupabaseClient() {
	return createClient(requirePublicSupabaseUrl(), requireServiceRoleKey(), {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}
