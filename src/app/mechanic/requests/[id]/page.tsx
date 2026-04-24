// ============================================================================
// Mechanic Request Detail — Page (RSC)
// ============================================================================
//
// Loads the full verification request (listing images, buyer notes, vehicle
// info). If assigned to this mechanic, shows the verdict form. If pending,
// shows an Accept button.

import { redirect, notFound } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import MechanicRequestDetailShell from "./shell";
import type { MechanicVerificationRequest } from "@/lib/features/mechanic";

export const metadata = { title: "Request Detail — ShopSmart Mechanic" };

export default async function MechanicRequestDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getServerSession();
	if (!session) redirect("/login?next=/mechanic/requests");
	if (!session.roles.includes("mechanic")) redirect("/mechanic/onboarding");

	const { id } = await params;
	const supabase = await createServerSupabaseClient();

	const { data: row, error } = await supabase
		.from("verification_requests")
		.select(
			`id, buyer_id, listing_id, mechanic_id, status, verdict, notes, buyer_notes, responded_at, created_at,
			 listings!inner(id, title, price, city, description, condition, details,
			   listing_images(url, position))`,
		)
		.eq("id", id)
		.maybeSingle();

	if (error || !row) notFound();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const listing = (row as any).listings as Record<string, unknown>;
	const images = (listing.listing_images as { url: string; position: number }[]) ?? [];
	const sortedImages = [...images].sort((a, b) => a.position - b.position);

	const request: MechanicVerificationRequest & {
		listingDetail: {
			description: string | null;
			condition: string;
			details: Record<string, unknown>;
			images: string[];
		};
	} = {
		id: row.id as string,
		buyerId: row.buyer_id as string,
		listingId: row.listing_id as string,
		mechanicId: row.mechanic_id as string | null,
		status: row.status as MechanicVerificationRequest["status"],
		verdict: row.verdict as MechanicVerificationRequest["verdict"],
		notes: row.notes as string | null,
		buyerNotes: row.buyer_notes as string | null,
		respondedAt: row.responded_at as string | null,
		createdAt: row.created_at as string,
		listing: {
			title: listing.title as string,
			price: listing.price as number,
			city: listing.city as string,
			imageUrl: sortedImages[0]?.url ?? null,
			category: null,
		},
		vehicle: null,
		listingDetail: {
			description: listing.description as string | null,
			condition: listing.condition as string,
			details: (listing.details as Record<string, unknown>) ?? {},
			images: sortedImages.map((img) => img.url),
		},
	};

	return (
		<MechanicRequestDetailShell
			request={request}
			isMine={row.mechanic_id === session.userId}
		/>
	);
}
