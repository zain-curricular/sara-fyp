// ============================================================================
// Home Page (RSC)
// ============================================================================
//
// Loads real recently-listed parts (with cover images) server-side and hands
// them to the landing shell, so the homepage shows live inventory instead of
// placeholders. The personalised "For You" rail is a client island inside the
// shell (auth-gated, self-hiding).

import { createServerSupabaseClient } from "@/lib/supabase/server";

import HomeShell from "./shell";
import type { RailListing } from "./_components/home-rails";

export default async function HomePage() {
	const supabase = await createServerSupabaseClient();

	// Newest active listings + their cover image (position asc).
	const { data } = await supabase
		.from("listings")
		.select("id, title, price, city, condition, created_at, listing_images(url, position)")
		.eq("status", "active")
		.order("created_at", { ascending: false })
		.limit(8);

	const recentListings = (data ?? []) as RailListing[];

	return <HomeShell recentListings={recentListings} />;
}
