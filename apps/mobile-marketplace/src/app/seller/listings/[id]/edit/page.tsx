import { notFound, redirect } from "next/navigation";

import EditListingShell from "./shell";

import { getListingForOwner, listMobileCategories } from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function EditListingPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { data: listing, error } = await getListingForOwner(id, user.id);
	if (error) {
		throw new Error("Failed to load listing");
	}
	if (!listing) {
		notFound();
	}

	const { data: categories, error: catErr } = await listMobileCategories();
	if (catErr) {
		throw new Error("Failed to load categories");
	}

	return <EditListingShell listing={listing} categories={categories ?? []} />;
}
