// ============================================================================
// Admin Seller Detail Shell
// ============================================================================
//
// Shows seller store info with verify/unverify toggle.
// Calls POST /api/admin/sellers/[id]/verify.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";

import type { AdminSeller } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	seller: AdminSeller;
	adminId: string;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminSellerDetailShell({ seller, adminId: _adminId }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	async function toggleVerify() {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/sellers/${seller.id}/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ verified: !seller.verified }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success(seller.verified ? "Seller unverified" : "Seller verified");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="admin-seller-detail" className="flex flex-col gap-6">

			{/* Back */}
			<Link href="/admin/sellers" className={buttonVariants({ variant: "ghost", size: "sm" })}>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to sellers
			</Link>

			{/* Store card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShoppingBag className="size-4" aria-hidden />
						{seller.storeName}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">

					<div container-id="admin-seller-info" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">Slug</p>
							<p className="font-medium">/{seller.slug}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Owner</p>
							<p className="font-medium">{seller.ownerName ?? "—"}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">City</p>
							<p className="font-medium">{seller.city}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Rating</p>
							<div className="flex items-center gap-1">
								<Star className="size-3.5 text-amber-500" aria-hidden />
								<span className="font-medium tabular-nums">{seller.rating.toFixed(1)}</span>
							</div>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Active Listings</p>
							<p className="font-medium tabular-nums">{seller.listingCount}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Created</p>
							<p className="font-medium tabular-nums">
								{new Date(seller.createdAt).toLocaleDateString("en-PK")}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							{seller.verified ? (
								<Badge variant="default">Verified</Badge>
							) : (
								<Badge variant="secondary">Unverified</Badge>
							)}
						</div>
					</div>

					<Separator />

					<div container-id="admin-seller-actions" className="flex gap-2">
						<Button
							variant={seller.verified ? "outline" : "default"}
							size="sm"
							onClick={toggleVerify}
							disabled={loading}
						>
							{seller.verified ? "Unverify seller" : "Verify seller"}
						</Button>
						<Link
							href={`/admin/users/${seller.ownerId}`}
							className={buttonVariants({ variant: "outline", size: "sm" })}
						>
							View owner profile
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
