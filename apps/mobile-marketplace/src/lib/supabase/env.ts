import { deriveSupabaseApiUrlFromEnv } from "@/lib/supabase/derive-api-url";

export function requirePublicEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

/**
 * HTTPS API URL: `NEXT_PUBLIC_SUPABASE_URL`, or (server-only) derived from `DATABASE_URL`.
 * Must use direct `process.env.NEXT_PUBLIC_*` access so Next inlines it in client bundles;
 * passing `process.env` into helpers does not get replaced by Turbopack/Webpack.
 */
export function getPublicSupabaseUrl(): string | undefined {
	const fromPublic = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	if (fromPublic) return fromPublic;
	// Browser must not read DATABASE_URL; Edge middleware also often lacks non-public env.
	if (typeof window === "undefined") {
		return deriveSupabaseApiUrlFromEnv(process.env);
	}
	return undefined;
}

export function requirePublicSupabaseUrl(): string {
	const url = getPublicSupabaseUrl();
	if (!url) {
		throw new Error(
			"Missing Supabase API URL: set NEXT_PUBLIC_SUPABASE_URL, or DATABASE_URL with user postgres.<project_ref> (Supabase pooler) or host db.<project_ref>.supabase.co",
		);
	}
	return url;
}

/** Legacy anon JWT or newer dashboard “publishable” key — both work as the Supabase client `anon` key. */
export function requireSupabasePublicKey(): string {
	const value =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!value) {
		throw new Error(
			"Missing Supabase client key: set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
		);
	}
	return value;
}

export function hasSupabasePublicConfig(): boolean {
	return Boolean(
		getPublicSupabaseUrl() &&
			(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
	);
}
