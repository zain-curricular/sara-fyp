// ============================================================================
// Seller Reviews Page
// ============================================================================
//
// RSC: fetches reviews where subject is the current seller.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import SellerReviewsShell from "./shell";

export const metadata = { title: "Reviews — ShopSmart Seller" };

export type ReviewRow = {
	id: string;
	reviewerName: string;
	reviewerAvatar: string | null;
	rating: number;
	comment: string | null;
	createdAt: string;
	sellerReply: string | null;
	sellerRepliedAt: string | null;
};

export default async function SellerReviewsPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	// Fetch reviews for this seller, joining reviewer profile
	const { data, error } = await supabase
		.from("reviews")
		.select(`
			id, rating, comment, created_at, seller_reply, seller_replied_at,
			profiles!reviews_reviewer_id_fkey (full_name, avatar_url)
		`)
		.eq("reviewed_user_id", user.id)
		.order("created_at", { ascending: false })
		.limit(100);

	if (error) throw new Error("Failed to load reviews");

	const reviews: ReviewRow[] = (data ?? []).map((row) => {
		const r = row as Record<string, unknown>;
		const profile = r.profiles as Record<string, unknown> | null;
		return {
			id: r.id as string,
			rating: r.rating as number,
			comment: (r.comment as string | null) ?? null,
			createdAt: r.created_at as string,
			sellerReply: (r.seller_reply as string | null) ?? null,
			sellerRepliedAt: (r.seller_replied_at as string | null) ?? null,
			reviewerName: (profile?.full_name as string | null) ?? "Anonymous",
			reviewerAvatar: (profile?.avatar_url as string | null) ?? null,
		};
	});

	return <SellerReviewsShell reviews={reviews} />;
}
