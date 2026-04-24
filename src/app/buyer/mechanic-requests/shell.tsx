// ============================================================================
// Buyer Mechanic Requests List Shell — Client Component
// ============================================================================
//
// Lists mechanic verification requests with status badges and links to detail.

"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";

import type { MechanicRequest, MechanicRequestStatus } from "@/lib/features/mechanic-requests";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function statusBadge(status: MechanicRequestStatus) {
	switch (status) {
		case "pending":
			return <Badge variant="outline">Pending</Badge>;
		case "assigned":
			return <Badge variant="secondary">Assigned</Badge>;
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
	});
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function RequestsListShell({
	requests,
}: {
	requests: MechanicRequest[];
}) {
	return (
		<div
			container-id="mechanic-requests-shell"
			className="flex flex-col flex-1 min-h-0 p-4 relative overflow-auto gap-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Verification Requests
					</h1>
					<p className="text-sm text-muted-foreground">
						Track mechanic compatibility checks for your listings.
					</p>
				</div>
			</div>

			{/* List */}
			{requests.length === 0 ? (
				<div
					container-id="mechanic-requests-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/25 py-16"
				>
					<Wrench className="size-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">
						No verification requests yet
					</p>
				</div>
			) : (
				<div
					container-id="mechanic-requests-list"
					className="flex flex-col gap-3"
				>
					{requests.map((req) => (
						<Card key={req.id} size="sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-sm">
									{req.listing?.title ?? `Request ${req.id.slice(0, 8)}`}
									{statusBadge(req.status)}
								</CardTitle>
							</CardHeader>
							<CardContent className="flex items-center justify-between gap-4">
								<div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
									{req.vehicle && (
										<span>
											{req.vehicle.make} {req.vehicle.model} ({req.vehicle.yearFrom}–{req.vehicle.yearTo})
										</span>
									)}
									<span>{formatDate(req.createdAt)}</span>
								</div>
								<Link
									href={`/buyer/mechanic-requests/${req.id}`}
									className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
								>
									View
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
