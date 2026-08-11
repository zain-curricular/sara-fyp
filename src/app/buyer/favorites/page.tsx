// ============================================================================
// Buyer Favorites Page — RSC
// ============================================================================
//
// Fetches the buyer's saved listings server-side and passes them to
// FavoritesShell. Only an absent session redirects to login — a failed query
// throws so error.tsx can offer a retry, rather than bouncing a signed-in user.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getFavoritesForUser } from "@/lib/features/favorites/services";

import FavoritesShell from "./shell";

export const metadata = { title: "Saved — ShopSmart" };

export default async function BuyerFavoritesPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/buyer/favorites");

	const { data: payload, error } = await getFavoritesForUser(session.userId, 1, 48);
	if (error || !payload) {
		console.error("getFavoritesForUser failed", error);
		throw new Error("Failed to load favorites");
	}

	return <FavoritesShell payload={payload} />;
}
