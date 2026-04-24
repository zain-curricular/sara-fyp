// ============================================================================
// Dispute Detail Shell
// ============================================================================
//
// Shows dispute info, reason, description, buyer evidence images, and a
// "Add counter-evidence" section for the seller to upload images.
// Evidence uploaded to Supabase 'dispute-evidence' bucket via client-side upload.

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Loader2, Upload } from "lucide-react";

import type { Dispute } from "@/lib/features/disputes";
import { formatPKR } from "@/lib/utils/currency";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Config
// ----------------------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
	item_not_received: "Item not received",
	item_not_as_described: "Item not as described",
	damaged_item: "Damaged item",
	wrong_item: "Wrong item",
	seller_unresponsive: "Seller unresponsive",
	other: "Other",
};

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
	open: { label: "Open", variant: "outline" },
	under_review: { label: "Under Review", variant: "secondary" },
	resolved: { label: "Resolved", variant: "default" },
	closed: { label: "Closed", variant: "secondary" },
};

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" });
	} catch {
		return iso;
	}
}

// ----------------------------------------------------------------------------
// Evidence uploader
// ----------------------------------------------------------------------------

function EvidenceUploader({
	disputeId,
	userId,
}: {
	disputeId: string;
	userId: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [previewUrls, setPreviewUrls] = useState<string[]>([]);

	async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? []);
		if (files.length === 0) return;

		setError(null);
		setUploading(true);

		try {
			const { createBrowserSupabaseClient } = await import("@/lib/supabase/client");
			const supabase = createBrowserSupabaseClient();

			const uploadedUrls: string[] = [];

			for (const file of files) {
				const ext = file.name.split(".").pop() ?? "jpg";
				const path = `disputes/${disputeId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

				const { error: uploadError } = await supabase.storage
					.from("dispute-evidence")
					.upload(path, file, { upsert: false, contentType: file.type });

				if (uploadError) {
					setError(`Upload failed: ${uploadError.message}`);
					setUploading(false);
					return;
				}

				const { data: urlData } = supabase.storage.from("dispute-evidence").getPublicUrl(path);
				uploadedUrls.push(urlData.publicUrl);
			}

			// Submit to API
			const res = await fetch(`/api/disputes/${disputeId}/evidence`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ urls: uploadedUrls }),
			});

			const json = (await res.json()) as { ok: boolean; error?: string };

			if (!json.ok) {
				setError(json.error ?? "Failed to submit evidence");
			} else {
				setPreviewUrls((prev) => [...prev, ...uploadedUrls]);
				setSubmitted(true);
			}
		} catch {
			setError("Upload failed — please try again");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div container-id="evidence-uploader" className="flex flex-col gap-3">
			{submitted && (
				<p className="text-sm text-green-600">Evidence submitted successfully</p>
			)}

			{previewUrls.length > 0 && (
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
					{previewUrls.map((url, i) => (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							key={i}
							src={url}
							alt={`Evidence ${i + 1}`}
							className="aspect-square rounded-lg border border-border object-cover"
						/>
					))}
				</div>
			)}

			{error && <p className="text-sm text-destructive">{error}</p>}

			<label
				htmlFor="evidence-upload"
				className={cn(
					"flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium",
					"hover:border-foreground/30",
					uploading && "cursor-not-allowed opacity-50",
				)}
			>
				{uploading ? (
					<Loader2 className="size-4 animate-spin" aria-hidden />
				) : (
					<Upload className="size-4" aria-hidden />
				)}
				{uploading ? "Uploading…" : "Add images"}
			</label>
			<input
				ref={inputRef}
				id="evidence-upload"
				type="file"
				accept="image/*"
				multiple
				className="sr-only"
				disabled={uploading}
				onChange={handleFiles}
			/>
			<p className="text-xs text-muted-foreground">Upload up to 10 images as counter-evidence</p>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function DisputeDetailShell({
	dispute,
	userId,
}: {
	dispute: Dispute;
	userId: string;
}) {
	const statusMeta = STATUS_META[dispute.status] ?? { label: dispute.status, variant: "secondary" as const };

	return (
		<div container-id="dispute-detail-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="dispute-detail-header" className="flex flex-col gap-2">
				<Link
					href="/seller/disputes"
					className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5 pl-0")}
				>
					<ArrowLeft className="size-3.5" aria-hidden />
					Back to disputes
				</Link>

				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-bold tracking-tight">
							Dispute — Order #{dispute.order?.orderNumber ?? dispute.orderId.slice(0, 8)}
						</h1>
						<p className="text-sm text-muted-foreground">
							Opened {formatDate(dispute.createdAt)}
						</p>
					</div>
					<Badge variant={statusMeta.variant} className="text-sm">
						{statusMeta.label}
					</Badge>
				</div>
			</header>

			{/* Dispute info */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Dispute details</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-4">
						<div className="flex flex-col gap-0.5">
							<p className="text-xs text-muted-foreground">Reason</p>
							<Badge variant="outline" className="rounded-sm text-xs">
								{REASON_LABELS[dispute.reason] ?? dispute.reason}
							</Badge>
						</div>
						{dispute.order && (
							<div className="flex flex-col gap-0.5">
								<p className="text-xs text-muted-foreground">Order total</p>
								<p className="text-sm font-bold tabular-nums text-primary">
									{formatPKR(dispute.order.total)}
								</p>
							</div>
						)}
					</div>

					<Separator />

					<div className="flex flex-col gap-1">
						<p className="text-xs font-medium text-muted-foreground">Buyer's description</p>
						<p className="text-sm leading-relaxed">{dispute.description}</p>
					</div>

					{dispute.resolutionNote && (
						<>
							<Separator />
							<div className="flex flex-col gap-1">
								<p className="text-xs font-medium text-muted-foreground">Resolution note</p>
								<p className="text-sm">{dispute.resolutionNote}</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Buyer evidence */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Buyer evidence</CardTitle>
				</CardHeader>
				<CardContent>
					{dispute.evidenceUrls.length === 0 ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<ImageIcon className="size-4" aria-hidden />
							No images provided
						</div>
					) : (
						<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
							{dispute.evidenceUrls.map((url, i) => (
								<a key={i} href={url} target="_blank" rel="noopener noreferrer">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={url}
										alt={`Buyer evidence ${i + 1}`}
										className="aspect-square w-full rounded-lg border border-border object-cover hover:opacity-80 transition-opacity"
									/>
								</a>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Seller counter-evidence */}
			{dispute.status === "open" || dispute.status === "under_review" ? (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Add counter-evidence</CardTitle>
					</CardHeader>
					<CardContent>
						<EvidenceUploader disputeId={dispute.id} userId={userId} />
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
