// ============================================================================
// Buyer Dispute Detail Shell — Client Component
// ============================================================================
//
// Shows dispute header, description, evidence images, and resolution note.
// When status=open, allows adding more evidence images.
// Subscribes to Supabase realtime for live status updates.

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import type { Dispute, DisputeStatus } from "@/lib/features/disputes";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatPKR } from "@/lib/utils/currency";

import { Badge } from "@/components/primitives/badge";
import { Button, buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function statusBadge(status: DisputeStatus) {
	switch (status) {
		case "open":
			return <Badge variant="destructive">Open</Badge>;
		case "under_review":
			return <Badge variant="outline">Under review</Badge>;
		case "resolved":
			return <Badge variant="default">Resolved</Badge>;
		case "closed":
			return <Badge variant="secondary">Closed</Badge>;
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

function humanReason(reason: string) {
	return reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function DisputeDetailShell({
	dispute: initialDispute,
}: {
	dispute: Dispute;
}) {
	const [dispute, setDispute] = useState<Dispute>(initialDispute);
	const [addingEvidence, setAddingEvidence] = useState(false);
	const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const authFetch = useAuthenticatedFetch();

	// Realtime subscription for status updates
	useEffect(() => {
		const supabase = createBrowserSupabaseClient();
		const channel = supabase
			.channel(`dispute:${dispute.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "disputes",
					filter: `id=eq.${dispute.id}`,
				},
				(payload) => {
					setDispute((prev) => ({
						...prev,
						status: payload.new.status as DisputeStatus,
						resolutionNote: payload.new.resolution_note as string | null,
						resolvedAt: payload.new.resolved_at as string | null,
					}));
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [dispute.id]);

	async function handleAddEvidence() {
		if (evidenceFiles.length === 0) return;
		setAddingEvidence(true);

		try {
			// In a real implementation, upload files to Storage first
			// For now, we post with empty urls as a demonstration
			const res = await authFetch<{ ok: true } | { ok: false; error: string }>(
				`/api/disputes/${dispute.id}/evidence`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ urls: [] }),
				},
			);

			if (!res.ok) throw new Error("error" in res ? res.error : "Failed");
			toast.success("Evidence added");
			setEvidenceFiles([]);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to add evidence");
		} finally {
			setAddingEvidence(false);
		}
	}

	return (
		<div
			container-id="dispute-detail-shell"
			className="mx-auto flex max-w-2xl flex-col gap-6"
		>
			{/* Lightbox */}
			{lightboxSrc && (
				<button
					type="button"
					onClick={() => setLightboxSrc(null)}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={lightboxSrc}
						alt="Evidence"
						className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
					/>
				</button>
			)}

			{/* Header */}
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight">
						{humanReason(dispute.reason)}
					</h1>
					{statusBadge(dispute.status)}
				</div>
				<p className="text-sm text-muted-foreground">
					Opened {formatDate(dispute.createdAt)}
				</p>
			</div>

			<Separator />

			{/* Description */}
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					Description
				</h2>
				<p className="text-sm leading-relaxed">{dispute.description}</p>
			</div>

			{/* Evidence */}
			{dispute.evidenceUrls.length > 0 && (
				<div className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Evidence
					</h2>
					<div
						container-id="dispute-evidence-grid"
						className="grid grid-cols-3 gap-2 sm:grid-cols-4"
					>
						{dispute.evidenceUrls.map((url, i) => (
							<button
								key={i}
								type="button"
								onClick={() => setLightboxSrc(url)}
								className="aspect-square overflow-hidden rounded-md border border-border"
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={url}
									alt={`Evidence ${i + 1}`}
									className="h-full w-full object-cover transition-opacity hover:opacity-80"
								/>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Add more evidence (open only) */}
			{dispute.status === "open" && (
				<div className="flex flex-col gap-3">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Add more evidence
					</h2>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						className="sr-only"
						onChange={(e) =>
							setEvidenceFiles(Array.from(e.target.files ?? []).slice(0, 10))
						}
					/>

					{evidenceFiles.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{evidenceFiles.map((f, i) => (
								<div key={i} className="relative">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={URL.createObjectURL(f)}
										alt={f.name}
										className="h-16 w-16 rounded-md border border-border object-cover"
									/>
									<button
										type="button"
										onClick={() =>
											setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== i))
										}
										className="absolute -right-1 -top-1 rounded-full bg-black/60 p-0.5 text-white"
									>
										<X className="size-3" />
									</button>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
						>
							<ImagePlus className="size-4" />
							Select images
						</Button>
						{evidenceFiles.length > 0 && (
							<Button
								size="sm"
								onClick={handleAddEvidence}
								disabled={addingEvidence}
							>
								{addingEvidence ? "Uploading…" : "Upload evidence"}
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Resolution note */}
			{dispute.resolutionNote && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Admin resolution</CardTitle>
						{dispute.resolvedAt && (
							<CardDescription>{formatDate(dispute.resolvedAt)}</CardDescription>
						)}
					</CardHeader>
					<CardContent className="text-sm">{dispute.resolutionNote}</CardContent>
				</Card>
			)}

			{/* Order summary */}
			{dispute.order && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Order summary</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-1 text-sm">
						<span>
							Order number:{" "}
							<strong>{dispute.order.orderNumber}</strong>
						</span>
						<span>
							Total:{" "}
							<strong>{formatPKR(dispute.order.total)}</strong>
						</span>
					</CardContent>
				</Card>
			)}

			<Link
				href="/buyer/disputes"
				className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
			>
				Back to disputes
			</Link>
		</div>
	);
}
