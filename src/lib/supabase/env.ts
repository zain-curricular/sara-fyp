import { deriveSupabaseApiUrlFromEnv } from "@/lib/supabase/derive-api-url";

/**
 * Fixed auth-cookie name shared by the browser, server, and middleware clients.
 * `@supabase/ssr` otherwise derives the cookie name from the API URL's hostname
 * (`sb-<host>-auth-token`); when the browser and server reach Supabase on
 * different hosts (e.g. `localhost:56321` vs the internal `kong:8000` in docker),
 * the derived names diverge and the server never sees the browser's session —
 * so login "succeeds" but every protected route bounces back to /login. Pinning
 * one name keeps them in sync regardless of URL.
 */
export const SUPABASE_AUTH_COOKIE_NAME = "sb-marketplace-auth";

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
 *
 * Server-side only, an explicit `SUPABASE_INTERNAL_URL` wins. This is for running
 * the app inside docker compose, where the browser reaches the API gateway on the
 * published host port (`NEXT_PUBLIC_SUPABASE_URL`) but server code must reach it over
 * the internal network (e.g. `http://kong:8000`). It is not a `NEXT_PUBLIC_*` var, so
 * it never leaks into client bundles, and when unset behaviour is unchanged.
 */
export function getPublicSupabaseUrl(): string | undefined {
	if (typeof window === "undefined") {
		const internal = process.env.SUPABASE_INTERNAL_URL?.trim();
		if (internal) return internal;
	}
	const fromPublic = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
	if (fromPublic) return fromPublic;
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

/** Legacy anon JWT or newer dashboard "publishable" key — both work as the Supabase client `anon` key. */
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
