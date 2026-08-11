// ============================================================================
// Buyer Recently Viewed Page — RSC
// ============================================================================
//
// Fetches the buyer's view history server-side and passes it to ViewedShell.
// Only an absent session redirects to login — a failed query throws so
// error.tsx can offer a retry, rather than bouncing a signed-in user.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getViewedListingsForUser } from "@/lib/features/favorites/services";

import ViewedShell from "./shell";

export const metadata = { title: "Recently viewed — ShopSmart" };

export default async function BuyerViewedPage() {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/buyer/viewed");

	const { data: payload, error } = await getViewedListingsForUser(session.userId, 1, 48);
	if (error || !payload) {
		console.error("getViewedListingsForUser failed", error);
		throw new Error("Failed to load recently viewed listings");
	}

	return <ViewedShell payload={payload} />;
}
