// ============================================================================
// Admin Dispute Detail Shell
// ============================================================================
//
// Shows full dispute info and resolution form.
// Resolve: POST /api/admin/disputes/[id]/resolve { winner: "buyer"|"seller", note }

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gavel } from "lucide-react";
import { toast } from "sonner";

import type { AdminDispute } from "@/lib/features/admin";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type DetailedDispute = AdminDispute & {
	description: string;
	evidenceUrls: string[];
	sellerReply: string | null;
	resolvedAt: string | null;
	order: {
		orderNumber: string;
		buyerId: string;
		sellerId: string;
		total: number;
		ssStatus: string;
	} | null;
};

type Props = {
	dispute: DetailedDispute;
};

type Winner = "buyer" | "seller";

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function AdminDisputeDetailShell({ dispute }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [winner, setWinner] = useState<Winner>("buyer");
	const [note, setNote] = useState("");
	const isResolved = dispute.status.startsWith("resolved");

	async function resolve() {
		if (!note.trim()) {
			toast.error("Please enter a resolution note");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/disputes/${dispute.id}/resolve`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ winner, note }),
			});
			const json = await res.json() as { ok: boolean; error?: string };
			if (!json.ok) throw new Error(json.error ?? "Failed");
			toast.success(`Dispute resolved in favour of ${winner}`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="admin-dispute-detail" className="flex flex-col gap-6">

			{/* Back */}
			<Link href="/admin/disputes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
				<ArrowLeft className="size-3.5" aria-hidden />
				Back to disputes
			</Link>

			{/* Main card */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Gavel className="size-4" aria-hidden />
						Dispute — Order {dispute.orderNumber}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">

					{/* Dispute info */}
					<div container-id="admin-dispute-info" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">Status</p>
							<Badge variant={isResolved ? "default" : dispute.status === "open" ? "destructive" : "secondary"}>
								{dispute.status.replace(/_/g, " ")}
							</Badge>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Reason</p>
							<p className="font-medium capitalize">{dispute.reason.replace(/_/g, " ")}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Opened</p>
							<p className="font-medium tabular-nums">
								{new Date(dispute.createdAt).toLocaleDateString("en-PK")}
							</p>
						</div>
						{dispute.order && (
							<>
								<div>
									<p className="text-xs text-muted-foreground">Order total</p>
									<p className="font-medium tabular-nums">{formatPKR(dispute.order.total)}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground">Order status</p>
									<Badge variant="secondary">{dispute.order.ssStatus.replace(/_/g, " ")}</Badge>
								</div>
							</>
						)}
						{dispute.resolvedAt && (
							<div>
								<p className="text-xs text-muted-foreground">Resolved</p>
								<p className="font-medium tabular-nums">
									{new Date(dispute.resolvedAt).toLocaleDateString("en-PK")}
								</p>
							</div>
						)}
					</div>

					{/* Description */}
					{dispute.description && (
						<>
							<Separator />
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Buyer&apos;s description</p>
								<p className="text-sm">{dispute.description}</p>
							</div>
						</>
					)}

					{/* Seller reply */}
					{dispute.sellerReply && (
						<>
							<Separator />
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Seller&apos;s reply</p>
								<p className="text-sm">{dispute.sellerReply}</p>
							</div>
						</>
					)}

					{/* Resolution note (if resolved) */}
					{dispute.resolutionNote && (
						<>
							<Separator />
							<div>
								<p className="mb-1 text-xs text-muted-foreground">Resolution note</p>
								<p className="text-sm">{dispute.resolutionNote}</p>
							</div>
						</>
					)}

					{/* Evidence */}
					{dispute.evidenceUrls.length > 0 && (
						<>
							<Separator />
							<div>
								<p className="mb-2 text-xs text-muted-foreground">Evidence</p>
								<div className="flex flex-wrap gap-2">
									{dispute.evidenceUrls.map((url, i) => (
										<a
											key={i}
											href={url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-primary hover:underline"
										>
											Evidence {i + 1}
										</a>
									))}
								</div>
							</div>
						</>
					)}

					{/* Resolution form */}
					{!isResolved && (
						<>
							<Separator />
							<div container-id="admin-dispute-resolve" className="flex flex-col gap-3">
								<p className="text-sm font-medium">Resolve dispute</p>
								<div className="flex gap-2">
									<Button
										variant={winner === "buyer" ? "default" : "outline"}
										size="sm"
										onClick={() => setWinner("buyer")}
									>
										Favour buyer
									</Button>
									<Button
										variant={winner === "seller" ? "default" : "outline"}
										size="sm"
										onClick={() => setWinner("seller")}
									>
										Favour seller
									</Button>
								</div>
								<Textarea
									placeholder="Resolution note (required)…"
									value={note}
									onChange={(e) => setNote(e.target.value)}
									rows={3}
								/>
								<Button
									variant="default"
									size="sm"
									onClick={resolve}
									disabled={loading || !note.trim()}
									className="w-fit"
								>
									Confirm resolution
								</Button>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
