/**
 * Supabase JS needs the HTTPS API origin, not a postgres:// URL.
 * Hosted DB URLs usually encode the project ref as `postgres.<ref>` (pooler) or `db.<ref>.supabase.co`.
 */
export function extractSupabaseProjectRefFromDatabaseUrl(databaseUrl: string): string | null {
	try {
		const normalized = databaseUrl.trim().replace(/^postgres:\/\//i, "postgresql://");
		const u = new URL(normalized);
		const userMatch = u.username.match(/^postgres\.([a-z0-9]+)$/i);
		if (userMatch) return userMatch[1];
		const hostMatch = u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
		if (hostMatch) return hostMatch[1];
		return null;
	} catch {
		return null;
	}
}

export function deriveSupabaseApiUrlFromEnv(env: NodeJS.ProcessEnv): string | undefined {
	const explicit = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	if (explicit) return explicit;
	if (!env.DATABASE_URL?.trim()) return undefined;
	const ref = extractSupabaseProjectRefFromDatabaseUrl(env.DATABASE_URL);
	if (!ref) return undefined;
	return `https://${ref}.supabase.co`;
}
