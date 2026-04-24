import { redirect } from "next/navigation";

import { fetchMyViewedListings } from "@/lib/features/favorites/services";

import ViewedShell from "./shell";

export default async function BuyerViewedPage() {
	const payload = await fetchMyViewedListings(1, 48);
	if (!payload) {
		redirect("/login");
	}

	return <ViewedShell payload={payload} />;
}
