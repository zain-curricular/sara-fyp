import { notFound } from "next/navigation";

import ListingDetailShell from "./shell";
import { SimilarListings } from "./_components/similar-listings";

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

	return (
		<div className="flex flex-col gap-12">
			<ListingDetailShell listing={data.listing} images={data.images} sellerReviews={data.sellerReviews} />
			<SimilarListings listingId={id} />
		</div>
	);
}
