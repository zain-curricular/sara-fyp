// ============================================================================
// Mechanic Request Detail Shell — Client Component
// ============================================================================
//
// Shows the full state of a mechanic verification request. Subscribes to
// Supabase realtime for live status updates. Displays listing preview,
// vehicle details, mechanic verdict and notes.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { MechanicRequest, MechanicRequestStatus } from "@/lib/features/mechanic-requests";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function statusBadge(status: MechanicRequestStatus) {
	switch (status) {
		case "pending":
			return <Badge variant="outline">Pending</Badge>;
		case "assigned":
			return <Badge variant="secondary">Assigned to mechanic</Badge>;
		case "verified_compatible":
			return <Badge variant="default">Compatible</Badge>;
		case "verified_incompatible":
			return <Badge variant="destructive">Incompatible</Badge>;
		case "rejected":
			return <Badge variant="destructive">Rejected</Badge>;
		case "expired":
			return <Badge variant="secondary">Expired</Badge>;
		default:
			return <Badge variant="secondary">{status}</Badge>;
	}
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString("en-PK", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicRequestDetailShell({
	request: initialRequest,
}: {
	request: MechanicRequest;
}) {
	const [request, setRequest] = useState<MechanicRequest>(initialRequest);

	// Realtime subscription
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`mechanic_request:${request.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "mechanic_requests",
					filter: `id=eq.${request.id}`,
				},
				(payload) => {
					setRequest((prev) => ({
						...prev,
						status: payload.new.status as MechanicRequestStatus,
						mechanicId: payload.new.mechanic_id as string | null,
						mechanicNotes: payload.new.mechanic_notes as string | null,
						respondedAt: payload.new.responded_at as string | null,
					}));
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [request.id]);

	return (
		<div
			container-id="mechanic-request-detail-shell"
			className="mx-auto flex max-w-2xl flex-col gap-6"
		>
			{/* Header */}
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2 flex-wrap">
					<h1 className="text-2xl font-semibold tracking-tight">
						Verification Request
					</h1>
					{statusBadge(request.status)}
				</div>
				<p className="text-sm text-muted-foreground">
					Submitted {formatDate(request.createdAt)}
				</p>
			</div>

			<Separator />

			{/* Status card */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Status</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2 text-sm">
					<div className="flex items-center gap-2">
						{statusBadge(request.status)}
					</div>
					{request.mechanic && (
						<div className="text-muted-foreground">
							Assigned to:{" "}
							<span className="font-medium text-foreground">
								{request.mechanic.fullName}
							</span>
							{request.mechanic.rating !== null && (
								<span> — {request.mechanic.rating.toFixed(1)} ★</span>
							)}
						</div>
					)}
					{request.respondedAt && (
						<div className="text-muted-foreground">
							Responded: {formatDate(request.respondedAt)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Listing preview */}
			{request.listing && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Part listing</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-3">
						{request.listing.images[0] && (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={request.listing.images[0]}
								alt={request.listing.title}
								className="h-16 w-16 rounded-md border border-border object-cover"
							/>
						)}
						<p className="text-sm font-medium">{request.listing.title}</p>
					</CardContent>
				</Card>
			)}

			{/* Vehicle details */}
			{request.vehicle && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Vehicle</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						{request.vehicle.make} {request.vehicle.model}{" "}
						({request.vehicle.yearFrom}–{request.vehicle.yearTo})
						{request.vehicleDetails && (
							<p className="mt-1 text-muted-foreground">{request.vehicleDetails}</p>
						)}
					</CardContent>
				</Card>
			)}

			{/* Mechanic verdict */}
			{request.mechanicNotes && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Mechanic notes</CardTitle>
					</CardHeader>
					<CardContent className="text-sm leading-relaxed">
						{request.mechanicNotes}
					</CardContent>
				</Card>
			)}

			{/* Fee info */}
			<div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
				<span className="text-muted-foreground">Verification fee</span>
				<span className="font-medium">{formatPKR(request.fee)}</span>
			</div>

			<Link
				href="/buyer/mechanic-requests"
				className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
			>
				Back to requests
			</Link>
		</div>
	);
}
