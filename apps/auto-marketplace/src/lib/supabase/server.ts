import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requirePublicSupabaseUrl, requireSupabasePublicKey } from "@/lib/supabase/env";

export async function createServerSupabaseClient() {
	const cookieStore = await cookies();

	return createServerClient(
		requirePublicSupabaseUrl(),
		requireSupabasePublicKey(),
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options);
						});
					} catch {
						// Called from a Server Component without mutable cookies — safe to ignore.
					}
				},
			},
		},
	);
}
