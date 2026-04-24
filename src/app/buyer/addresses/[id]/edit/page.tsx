// ============================================================================
// Edit Address Page — RSC
// ============================================================================
//
// Fetches the address to pre-fill the form. Redirects if not found or
// if the address doesn't belong to the authenticated user.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { listAddresses } from "@/lib/features/addresses/services";

import EditAddressShell from "./shell";

type Props = { params: Promise<{ id: string }> };

export default async function EditAddressPage({ params }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in?next=/buyer/addresses");

	const { id } = await params;

	const { data: addresses, error } = await listAddresses(session.userId);
	if (error) throw new Error("Failed to load address");

	const address = addresses.find((a) => a.id === id);
	if (!address) notFound();

	return <EditAddressShell address={address} />;
}
