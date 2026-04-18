import { redirect } from "next/navigation";

import SellerListingsShell from "./shell";

import { listSellerListings } from "@/lib/features/listings/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SellerListingsPage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/sign-in");
	}

	const { data, error } = await listSellerListings(user.id);
	if (error) {
		throw new Error("Failed to load listings");
	}

	return <SellerListingsShell listings={data ?? []} />;
}
