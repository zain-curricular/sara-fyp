// ============================================================================
// New Mechanic Request Page — RSC
// ============================================================================
//
// Takes listingId from searchParams. Fetches listing info and available
// vehicles for the picker. Renders the request form.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import NewRequestShell from "./shell";

type Props = {
	searchParams: Promise<{ listingId?: string }>;
};

export default async function NewMechanicRequestPage({ searchParams }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/mechanic-requests/new");

	const { listingId } = await searchParams;
	if (!listingId) redirect("/buyer/mechanic-requests");

	const supabase = await createServerSupabaseClient();

	// Fetch listing info
	const { data: listing } = await supabase
		.from("listings")
		.select("id, title, primary_image_url, status")
		.eq("id", listingId)
		.eq("status", "active")
		.maybeSingle();

	if (!listing) notFound();

	const row = listing as Record<string, unknown>;

	// Fetch vehicles for picker
	const { data: vehicles } = await supabase
		.from("vehicles")
		.select("id, make, model, year_from, year_to")
		.order("make")
		.order("model");

	const vehicleRows = (vehicles ?? []).map((v) => {
		const vr = v as Record<string, unknown>;
		return {
			id: vr.id as string,
			make: vr.make as string,
			model: vr.model as string,
			yearFrom: vr.year_from as number,
			yearTo: vr.year_to as number,
		};
	});

	return (
		<NewRequestShell
			listing={{
				id: row.id as string,
				title: row.title as string,
				imageUrl: (row.primary_image_url as string | null) ?? null,
			}}
			vehicles={vehicleRows}
		/>
	);
}
