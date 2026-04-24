// ============================================================================
// Admin Listing Detail Shell
// ============================================================================
//
// Full listing detail view with approve/reject dialog.
// Approve: POST /api/admin/listings/[id]/approve
// Reject: POST /api/admin/listings/[id]/reject { reason }

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Package } from "lucide-react";
import { toast } from "sonner";

import type { AdminListing } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type DetailedListing = AdminListing & {
	description: string | null;
	images: Array<{ url: string; position: number }>;
};

type Props = {
	listing: DetailedListing;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminListingDetailShell({ listing }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [showRejectForm, setShowRejectForm] = useState(false);
	const [rejectReason, setRejectReason] = useState("");

	async function approve() {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/listings/${listing.id}/approve`, { method: "POST" });
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Listing approved");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	async function reject() {
		if (!rejectReason.trim()) {
			toast.error("Please enter a reason");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/listings/${listing.id}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: rejectReason }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success("Listing rejected");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
			setShowRejectForm(false);
			setRejectReason("");
		}
	}

	return (
		<div container-id="admin-listing-detail" className="flex flex-col gap-6">

			{/* Back */}
			<Link
				href="/admin/listings"
				className={buttonVariants({ variant: "ghost", size: "sm" })}
			>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to listings
			</Link>

			{/* Main card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="size-4" aria-hidden />
						{listing.title}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">

					<div container-id="admin-listing-info" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">Price</p>
							<p className="font-medium tabular-nums">{formatPKR(listing.price)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Condition</p>
							<p className="font-medium capitalize">{listing.condition}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							<Badge variant={listing.status === "active" ? "default" : listing.status === "rejected" ? "destructive" : "secondary"}>
								{listing.status.replace(/_/g, " ")}
							</Badge>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Store</p>
							<p className="font-medium">{listing.storeName ?? "—"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Views</p>
							<div className="flex items-center gap-1">
								<Eye className="size-3.5 text-muted-foreground" aria-hidden />
								<span className="tabular-nums">{listing.viewCount}</span>
							</div>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Created</p>
							<p className="font-medium tabular-nums">
								{new Date(listing.createdAt).toLocaleDateString("en-PK")}
							</p>
						</div>
					</div>

					{listing.description && (
						<>
							<Separator />
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Description</p>
								<p className="text-sm text-foreground">{listing.description}</p>
							</div>
						</>
					)}

					{listing.images.length > 0 && (
						<>
							<Separator />
							<div>
								<p className="mb-2 text-xs text-muted-foreground">Images</p>
								<div className="flex flex-wrap gap-2">
									{listing.images.map((img) => (
										<a
											key={img.position}
											href={img.url}
											target="_blank"
											rel="noopener noreferrer"
											className="overflow-hidden rounded-md border border-border"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={img.url}
												alt={`Image ${img.position + 1}`}
												className="size-24 object-cover"
											/>
										</a>
									))}
								</div>
							</div>
						</>
					)}

					<Separator />

					{/* Actions */}
					<div container-id="admin-listing-actions" className="flex flex-col gap-3">
						<div className="flex flex-wrap gap-2">
							{listing.status !== "active" && (
								<Button
									variant="default"
									size="sm"
									onClick={approve}
									disabled={loading}
								>
									Approve listing
								</Button>
							)}
							{listing.status !== "rejected" && !showRejectForm && (
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setShowRejectForm(true)}
									disabled={loading}
								>
									Reject listing
								</Button>
							)}
						</div>

						{showRejectForm && (
							<div className="flex w-full max-w-sm flex-col gap-2">
								<Textarea
									placeholder="Reason for rejection…"
									value={rejectReason}
									onChange={(e) => setRejectReason(e.target.value)}
									rows={3}
								/>
								<div className="flex gap-2">
									<Button
										variant="destructive"
										size="sm"
										onClick={reject}
										disabled={loading || !rejectReason.trim()}
									>
										Confirm rejection
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setShowRejectForm(false);
											setRejectReason("");
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
