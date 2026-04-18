import { notFound } from "next/navigation";

import ListingDetailShell from "./shell";

import { getListingDetailForViewer } from "@/lib/features/listings/services";
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

	const { data: detail, error } = await getListingDetailForViewer(id, user?.id ?? null);
	if (error) {
		throw new Error("Failed to load listing");
	}
	if (!detail) {
		notFound();
	}

	return <ListingDetailShell listing={detail.listing} images={detail.images} />;
}
