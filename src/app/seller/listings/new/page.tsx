import { redirect } from "next/navigation";

import NewListingShell from "./shell";

import { listAutomotiveCategories } from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewListingPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { data: categories, error } = await listAutomotiveCategories();
	if (error) {
		throw new Error("Failed to load categories");
	}

	return <NewListingShell categories={categories ?? []} />;
}
