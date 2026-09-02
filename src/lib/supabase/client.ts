import { createBrowserClient } from "@supabase/ssr";

import {
	SUPABASE_AUTH_COOKIE_NAME,
	requirePublicSupabaseUrl,
	requireSupabasePublicKey,
} from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
	return createBrowserClient(requirePublicSupabaseUrl(), requireSupabasePublicKey(), {
		cookieOptions: { name: SUPABASE_AUTH_COOKIE_NAME },
	});
}
