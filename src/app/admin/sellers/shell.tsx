// ============================================================================
// Admin Sellers Shell
// ============================================================================
//
// Table of all seller stores with verify/unverify inline action.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingBag, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import type { AdminSeller } from "@/lib/features/admin";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Props = {
	sellers: AdminSeller[];
	adminId: string;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminSellersShell({ sellers, adminId }: Props) {
	const router = useRouter();
	const [loadingId, setLoadingId] = useState<string | null>(null);

	async function handleVerify(seller: AdminSeller) {
		setLoadingId(seller.id);
		try {
			const res = await fetch(`/api/admin/sellers/${seller.id}/verify`, {
				method: "PATCH",
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
			setLoadingId(null);
		}
	}

	return (
		<div container-id="admin-sellers" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="admin-sellers-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Sellers</h1>
				<p className="text-sm text-muted-foreground">{sellers.length} seller store(s)</p>
			</header>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ShoppingBag className="size-4" aria-hidden />
						Seller stores
					</CardTitle>
				</CardHeader>
				<CardContent>
					{sellers.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">No sellers found.</p>
					) : (
						<div container-id="admin-sellers-table" className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										<th className="pb-2 pr-4 font-medium">Store</th>
										<th className="pb-2 pr-4 font-medium">Owner</th>
										<th className="pb-2 pr-4 font-medium">City</th>
										<th className="pb-2 pr-4 font-medium">Rating</th>
										<th className="pb-2 pr-4 font-medium">Listings</th>
										<th className="pb-2 pr-4 font-medium">Status</th>
										<th className="pb-2" />
									</tr>
								</thead>
								<tbody>
									{sellers.map((seller) => (
										<tr
											key={seller.id}
											className="border-b border-border/50 last:border-0 hover:bg-muted/30"
										>
											<td className="py-3 pr-4">
												<div className="flex flex-col gap-0.5">
													<span className="font-medium">{seller.storeName}</span>
													<span className="text-xs text-muted-foreground">/{seller.slug}</span>
												</div>
											</td>
											<td className="py-3 pr-4 text-muted-foreground">
												{seller.ownerName ?? "—"}
											</td>
											<td className="py-3 pr-4 text-muted-foreground">{seller.city}</td>
											<td className="py-3 pr-4">
												<div className="flex items-center gap-1">
													<Star className="size-3 text-amber-500" aria-hidden />
													<span className="tabular-nums">{seller.rating.toFixed(1)}</span>
												</div>
											</td>
											<td className="py-3 pr-4 tabular-nums">{seller.listingCount}</td>
											<td className="py-3 pr-4">
												{seller.verified ? (
													<Badge variant="secondary">
														<CheckCircle className="size-3 text-green-600" aria-hidden />
														Verified
													</Badge>
												) : (
													<Badge variant="outline">Unverified</Badge>
												)}
											</td>
											<td className="py-3">
												<div className="flex items-center gap-2">
													<Button
														variant={seller.verified ? "outline" : "default"}
														size="sm"
														disabled={loadingId === seller.id}
														onClick={() => handleVerify(seller)}
													>
														{seller.verified ? (
															<>
																<XCircle className="size-3.5" aria-hidden />
																Unverify
															</>
														) : (
															<>
																<CheckCircle className="size-3.5" aria-hidden />
																Verify
															</>
														)}
													</Button>
													<Link
														href={`/admin/sellers/${seller.id}`}
														className={buttonVariants({ variant: "ghost", size: "sm" })}
													>
														View
													</Link>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
