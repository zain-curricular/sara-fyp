// ============================================================================
// Integration / API tests — environment gate
// ============================================================================

/**
 * True when Supabase service-role tests can run (local `supabase start` or CI).
 */
export const canRunSupabaseIntegrationTests: boolean = Boolean(
	process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL,
)
