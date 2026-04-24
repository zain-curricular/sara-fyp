import { redirect } from "next/navigation";

import { fetchMyFavorites } from "@/lib/features/favorites/services";

import FavoritesShell from "./shell";

export default async function BuyerFavoritesPage() {
	const payload = await fetchMyFavorites(1, 48);
	if (!payload) {
		redirect("/login");
	}

	return <FavoritesShell payload={payload} />;
}
