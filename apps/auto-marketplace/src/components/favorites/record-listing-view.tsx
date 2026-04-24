"use client";

import { useEffect } from "react";

import { apiFetch } from "@/lib/api/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Records a browse event for recommendations / recently viewed (POST /api/listings/:id/view).
 * After `await`ing the session, checks `cancelled` before POST so React Strict Mode's aborted
 * first effect does not rely on a stale "done" flag and the second run still sends one event.
 */
export function RecordListingView({ listingId }: { listingId: string }) {
	useEffect(() => {
		let cancelled = false;

		async function run() {
			const supabase = createBrowserSupabaseClient();
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session?.access_token || cancelled) return;

			try {
				await apiFetch(`/api/listings/${encodeURIComponent(listingId)}/view`, {
					method: "POST",
					accessToken: session.access_token,
				});
			} catch {
				// Best-effort; do not surface errors in the UI.
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [listingId]);

	return null;
}
