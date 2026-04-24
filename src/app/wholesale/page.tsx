// ============================================================================
// Wholesale Browse Page
// ============================================================================
//
// Displays all active wholesale listings (is_wholesale = true). Intended for
// workshop owners and distributors placing bulk orders. No auth required —
// browsing is public; purchasing requires sign-in at checkout.

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";

export default async function WholesalePage() {
	const supabase = await createServerSupabaseClient();

	const { data: listings } = await supabase
		.from("listings")
		.select("*")
		.eq("status", "active")
		.eq("is_wholesale", true)
		.is("deleted_at", null)
		.order("created_at", { ascending: false })
		.limit(40);

	return (
		<div container-id="wholesale-page" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* Header */}
			<header container-id="wholesale-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Wholesale Parts</h1>
				<p className="text-sm text-muted-foreground">
					Bulk orders for workshops and distributors
				</p>
			</header>

			{/* Listings grid */}
			{listings && listings.length > 0 ? (
				<section container-id="wholesale-grid">
					<div
						container-id="wholesale-listings-grid"
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
					>
						{listings.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				</section>
			) : (
				<div
					container-id="wholesale-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No wholesale listings available.</p>
					<p className="text-xs text-muted-foreground">
						Check back soon — suppliers list new stock regularly.
					</p>
				</div>
			)}
		</div>
	);
}
