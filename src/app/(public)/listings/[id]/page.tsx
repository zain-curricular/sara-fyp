import { notFound } from "next/navigation";

import ListingDetailShell from "./shell";
import { SimilarListings } from "./_components/similar-listings";

import { resolveListingPartType, resolveListingVehicle } from "@/lib/features/recommendations";
import { LiveRecommendationsRail } from "@/components/recommendations/live-recommendations-rail";
import { TrackListingView } from "@/components/recommendations/track-listing-view";

import { getListingDetailPagePayload } from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ListingDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const { data, error } = await getListingDetailPagePayload(id, user?.id ?? null);
	if (error) {
		if (error instanceof Error) throw error;
		throw new Error("Failed to load listing", { cause: error });
	}
	if (!data) {
		notFound();
	}

	// Behaviour signal for the live engine (vehicle + part type from details, else title)
	const { listing } = data;
	const viewSignal = {
		listingId: listing.id,
		title: listing.title,
		vehicle: resolveListingVehicle(listing),
		partType: resolveListingPartType(listing),
		price: Number(listing.price),
		condition: listing.listing_condition ?? null,
	};

	return (
		<div className="flex flex-col gap-12">
			<TrackListingView signal={viewSignal} />
			<ListingDetailShell listing={data.listing} images={data.images} sellerReviews={data.sellerReviews} />
			<LiveRecommendationsRail
				containerId="listing-live-recommendations"
				title="Because you viewed this"
				description="Re-ranked from this part and everything you've browsed this session."
				contextListingId={listing.id}
				hideWhenCold
			/>
			<SimilarListings listingId={id} />
		</div>
	);
}
