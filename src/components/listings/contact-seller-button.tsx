// ============================================================================
// Contact Seller Button
// ============================================================================
//
// Shown on listing detail pages. When clicked by an authenticated user, it
// POSTs to /api/conversations to get-or-create a conversation with the seller,
// then navigates to /messages/[conversationId]. Guests are redirected to login.
//
// Usage:
//   <ContactSellerButton sellerId={listing.user_id} listingId={listing.id} />

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/primitives/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useStartConversation } from "@/lib/features/messaging";

type ContactSellerButtonProps = {
	sellerId: string;
	listingId: string;
	/** Optional: show a compact icon-only variant. */
	variant?: "default" | "outline" | "ghost";
	className?: string;
};

/** Opens or resumes a conversation with a listing's seller. */
export function ContactSellerButton({
	sellerId,
	listingId,
	variant = "default",
	className,
}: ContactSellerButtonProps) {
	const router = useRouter();
	const { start, isPending } = useStartConversation();
	const [isChecking, setIsChecking] = useState(false);

	const handleClick = useCallback(async () => {
		// Check auth client-side to avoid full redirect for logged-in users
		setIsChecking(true);
		try {
			const supabase = createBrowserSupabaseClient();
			const { data: { session } } = await supabase.auth.getSession();

			if (!session) {
				router.push(`/login?next=/listings/${listingId}`);
				return;
			}

			const result = await start({ sellerId, listingId });
			if (result) {
				router.push(`/messages/${result.conversationId}`);
			}
		} finally {
			setIsChecking(false);
		}
	}, [sellerId, listingId, start, router]);

	const isLoading = isChecking || isPending;

	return (
		<Button
			type="button"
			variant={variant}
			className={className}
			disabled={isLoading}
			onClick={() => void handleClick()}
		>
			<MessageSquare className="size-4" />
			{isLoading ? "Opening chat…" : "Contact seller"}
		</Button>
	);
}
