"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { ApiError, apiFetch } from "@/lib/api/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * JSON fetch to `NEXT_PUBLIC_API_URL` with the current Supabase session token.
 * Does **not** redirect on 401 — use on public routes where auth is optional (e.g. favorite / is-favorited checks).
 * For routes that require a logged-in user, prefer {@link useAuthenticatedFetch}.
 */
export function useSessionApiFetch() {
	return useCallback(async <T>(path: string, init?: RequestInit): Promise<T> => {
		const supabase = createBrowserSupabaseClient();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		return apiFetch<T>(path, { ...init, accessToken: session?.access_token });
	}, []);
}

/**
 * Authenticated JSON fetch to `NEXT_PUBLIC_API_URL` — attaches Supabase access token and redirects to `/sign-in` on 401.
 * Prefer this over raw `fetch` in client components (see `_CONVENTIONS/architecture/authentication/2-client-side-auth.md`).
 */
export function useAuthenticatedFetch() {
	const router = useRouter();

	return useCallback(
		async <T>(path: string, init?: RequestInit): Promise<T> => {
			const supabase = createBrowserSupabaseClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();

			try {
				return await apiFetch<T>(path, {
					...init,
					accessToken: session?.access_token,
				});
			} catch (error) {
				if (error instanceof ApiError && error.status === 401) {
					router.push("/sign-in");
				}
				throw error;
			}
		},
		[router],
	);
}
