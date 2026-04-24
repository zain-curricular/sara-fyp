import { createBrowserClient } from "@supabase/ssr";

import { requirePublicSupabaseUrl, requireSupabasePublicKey } from "@/lib/supabase/env";

export function createBrowserSupabaseClient() {
	return createBrowserClient(requirePublicSupabaseUrl(), requireSupabasePublicKey());
}
