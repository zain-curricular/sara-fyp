// ============================================================================
// Seller Store Management Page
// ============================================================================
//
// RSC: authenticates seller, fetches store data, renders StoreEditShell.
// Redirects to /sign-in if unauthenticated.

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStoreByOwner } from "@/lib/features/seller-store/services";
import StoreEditShell from "./shell";

export const metadata = { title: "Your Store — ShopSmart" };

export default async function SellerStorePage() {
	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) redirect("/sign-in");

	const { data: store, error } = await getStoreByOwner(user.id);

	if (error) throw new Error("Failed to load store");

	return <StoreEditShell store={store} ownerId={user.id} />;
}
