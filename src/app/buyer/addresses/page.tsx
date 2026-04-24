// ============================================================================
// Buyer Addresses Page — RSC
// ============================================================================
//
// Authenticates the user, fetches their saved addresses server-side, and
// passes them to the client shell. Throws on fetch error for error.tsx.

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAddresses } from "@/lib/features/addresses/services";

import AddressesShell from "./shell";

export default async function BuyerAddressesPage() {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/addresses");

	const { data: addresses, error } = await listAddresses(session.userId);
	if (error) throw new Error("Failed to load addresses");

	return <AddressesShell addresses={addresses} />;
}
