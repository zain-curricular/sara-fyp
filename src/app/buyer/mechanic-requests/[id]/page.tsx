// ============================================================================
// Mechanic Request Detail Page — RSC
// ============================================================================
//
// Fetches mechanic request detail for the authenticated buyer. Ownership
// is verified in the service layer.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getMechanicRequestDetail } from "@/lib/features/mechanic-requests/services";

import MechanicRequestDetailShell from "./shell";

type Props = { params: Promise<{ id: string }> };

export default async function MechanicRequestDetailPage({ params }: Props) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { id } = await params;

	const { data: request, error } = await getMechanicRequestDetail(
		id,
		session.userId,
	);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load request");
	}

	if (!request) notFound();

	return <MechanicRequestDetailShell request={request} />;
}
