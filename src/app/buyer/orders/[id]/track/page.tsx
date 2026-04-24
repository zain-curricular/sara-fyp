// ============================================================================
// Order Tracking Page — RSC
// ============================================================================
//
// Fetches order + status events server-side. TrackingShell subscribes to
// Supabase Realtime for live updates after hydration.

import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth/guards";
import { getOrderDetail, getOrderStatusEvents } from "@/lib/features/orders/services";
import TrackingShell from "./shell";

type PageProps = {
	params: Promise<{ id: string }>;
};

export const metadata = { title: "Track Order — ShopSmart" };

export default async function OrderTrackingPage({ params }: PageProps) {
	const session = await getServerSession();
	if (!session) redirect("/sign-in");

	const { id } = await params;

	const [{ data: order, error }, { data: events }] = await Promise.all([
		getOrderDetail(id, session.userId),
		getOrderStatusEvents(id, session.userId),
	]);

	if (error) {
		const msg = error instanceof Error ? error.message : "Error";
		if (msg === "Forbidden") notFound();
		throw new Error("Failed to load order");
	}
	if (!order) notFound();

	return <TrackingShell order={order} initialEvents={events ?? []} />;
}
