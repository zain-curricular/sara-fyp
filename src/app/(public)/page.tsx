// ============================================================================
// Home Page (RSC)
// ============================================================================
//
// Loads real recently-listed parts (with cover images) server-side and hands
// them to the landing shell, so the homepage shows live inventory instead of
// placeholders. The personalised "For You" rail is a client island inside the
// shell (auth-gated, self-hiding).

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listBrandsWithListingCounts } from "@/lib/features/product-catalog/services";

import HomeShell from "./shell";
import type { RailListing } from "./_components/home-rails";

/** Brand chips shown under the hero. */
const BRAND_CHIP_LIMIT = 5;

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

	// Total live inventory, for the "LIVE · N listings" badge.
	const { count: totalListings } = await supabase
		.from("listings")
		.select("id", { count: "exact", head: true })
		.eq("status", "active")
		.is("deleted_at", null);

	// Brand chips come from live inventory — the hero degrades to no chips
	// rather than failing the whole page if the catalog query breaks.
	const { data: brands, error: brandsError } = await listBrandsWithListingCounts("automotive");
	if (brandsError) {
		console.error("listBrandsWithListingCounts(automotive) failed", brandsError);
	}

	const rankedBrands = brands ?? [];
	const brandChips = rankedBrands.slice(0, BRAND_CHIP_LIMIT);

	return (
		<HomeShell
			recentListings={recentListings}
			brandChips={brandChips}
			moreBrandCount={rankedBrands.length - brandChips.length}
			totalListings={totalListings ?? 0}
		/>
	);
}
