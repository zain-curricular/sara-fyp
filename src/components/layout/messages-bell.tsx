// ============================================================================
// Messages Bell
// ============================================================================
//
// Client island rendered by SiteHeader. Fetches the caller's total unread
// message count and shows a numbered badge on the messages icon. Refetches on
// window focus and whenever a `conversations` row the user can see changes
// (Supabase Realtime respects RLS, so only the caller's conversations arrive).
//
// Auth is optional — guests see a plain icon with no badge.

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/** Messages icon with live unread badge. Guest-safe. */
export function MessagesBell() {
	const [userId, setUserId] = useState<string | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);

	// Resolve auth state client-side.
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();

		void supabase.auth.getSession().then(({ data: { session } }) => {
			setUserId(session?.user?.id ?? null);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUserId(session?.user?.id ?? null);
			if (!session) setUnreadCount(0);
		});

		return () => subscription.unsubscribe();
	}, []);

	// Fetch the current unread total. Non-critical — errors leave the badge at 0.
	const refresh = useCallback(() => {
		void fetch("/api/conversations/unread-count")
			.then((r) => (r.ok ? r.json() : null))
			.then((body: unknown) => {
				if (
					body &&
					typeof body === "object" &&
					"ok" in body &&
					body.ok &&
					"data" in body &&
					body.data &&
					typeof body.data === "object" &&
					"unreadCount" in body.data
				) {
					setUnreadCount((body.data as { unreadCount: number }).unreadCount);
				}
			})
			.catch(() => {
				// Ignore — badge simply stays put.
			});
	}, []);

	// Initial fetch + realtime + focus refetch, all gated on a known user.
	useEffect(() => {
		if (!userId) return;

		refresh();

		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`conv-unread:${userId}`)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "conversations" },
				() => refresh(),
			)
			.subscribe();

		const onFocus = () => refresh();
		window.addEventListener("focus", onFocus);

		return () => {
			void supabase.removeChannel(channel);
			window.removeEventListener("focus", onFocus);
		};
	}, [userId, refresh]);

	return (
		<Link
			href="/messages"
			className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
			aria-label={unreadCount > 0 ? `Messages — ${unreadCount} unread` : "Messages"}
		>
			<MessageSquare className="size-4" />
			{unreadCount > 0 && (
				<span
					aria-hidden
					className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground"
				>
					{unreadCount > 99 ? "99+" : unreadCount}
				</span>
			)}
		</Link>
	);
}
