// ============================================================================
// Mechanic Request Detail Shell
// ============================================================================
//
// Client shell for a single verification request. Shows vehicle + listing
// info, image gallery, buyer notes, and a verdict form (if assigned to me)
// or an Accept button (if pending).

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, MapPin, Package } from "lucide-react";

import type { MechanicVerificationRequest, VerificationVerdict } from "@/lib/features/mechanic";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Label } from "@/components/primitives/label";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type RequestWithDetail = MechanicVerificationRequest & {
	listingDetail: {
		description: string | null;
		condition: string;
		details: Record<string, unknown>;
		images: string[];
	};
};

type MechanicRequestDetailShellProps = {
	request: RequestWithDetail;
	isMine: boolean;
};

const VERDICT_OPTIONS: { value: VerificationVerdict; label: string; description: string }[] = [
	{
		value: "verified_compatible",
		label: "Compatible",
		description: "Part is compatible with the buyer's vehicle",
	},
	{
		value: "verified_incompatible",
		label: "Incompatible",
		description: "Part does not match the buyer's vehicle specs",
	},
	{
		value: "rejected",
		label: "Insufficient info",
		description: "Cannot determine — more information needed",
	},
];

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	assigned: "Assigned",
	completed: "Completed",
	cancelled: "Cancelled",
};

const VERDICT_LABELS: Record<string, string> = {
	verified_compatible: "Compatible",
	verified_incompatible: "Incompatible",
	rejected: "Insufficient info",
};

// ----------------------------------------------------------------------------
// Verdict form
// ----------------------------------------------------------------------------

function VerdictForm({ requestId }: { requestId: string }) {
	const router = useRouter();
	const [verdict, setVerdict] = useState<VerificationVerdict | "">("");
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!verdict) { setError("Select a verdict."); return; }
		if (notes.trim().length < 10) { setError("Notes must be at least 10 characters."); return; }

		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/mechanic/requests/${requestId}/verdict`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ verdict, notes: notes.trim() }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Failed to submit verdict");
			router.push("/mechanic/completed");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle className="text-base">Submit verdict</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">

					{/* Verdict selection */}
					<div className="flex flex-col gap-2">
						<Label>Verdict</Label>
						{VERDICT_OPTIONS.map((opt) => (
							<label
								key={opt.value}
								className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
								style={{
									borderColor: verdict === opt.value ? "hsl(var(--primary))" : undefined,
									backgroundColor: verdict === opt.value ? "hsl(var(--primary) / 0.06)" : undefined,
								}}
							>
								<input
									type="radio"
									name="verdict"
									value={opt.value}
									checked={verdict === opt.value}
									onChange={() => setVerdict(opt.value)}
									className="mt-0.5"
								/>
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-medium">{opt.label}</span>
									<span className="text-xs text-muted-foreground">{opt.description}</span>
								</div>
							</label>
						))}
					</div>

					{/* Notes */}
					<div className="flex flex-col gap-2">
						<Label htmlFor="verdict-notes">Notes for buyer</Label>
						<Textarea
							id="verdict-notes"
							placeholder="Explain your verdict in detail — part number match, fitment check, etc."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button type="submit" disabled={loading}>
						{loading ? "Submitting…" : "Submit verdict"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Accept button
// ----------------------------------------------------------------------------

function AcceptButton({ requestId }: { requestId: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleAccept() {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/mechanic/requests/${requestId}/accept`, {
				method: "POST",
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Failed to accept");
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<Button onClick={handleAccept} disabled={loading}>
				{loading ? "Accepting…" : "Accept this request"}
			</Button>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicRequestDetailShell({
	request,
	isMine,
}: MechanicRequestDetailShellProps) {
	const [activeImage, setActiveImage] = useState(0);
	const images = request.listingDetail.images;

	return (
		<div container-id="mechanic-request-detail" className="flex flex-col gap-6">

			{/* Back link */}
			<a
				href="/mechanic/requests"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ChevronLeft className="size-4" aria-hidden />
				Back to requests
			</a>

			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-bold tracking-tight">
						{request.listing?.title ?? "Verification request"}
					</h1>
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant={request.status === "completed" ? "default" : "secondary"}
							className="rounded-sm text-[10px]"
						>
							{STATUS_LABELS[request.status] ?? request.status}
						</Badge>
						{request.verdict && (
							<Badge className="rounded-sm text-[10px]">
								{VERDICT_LABELS[request.verdict] ?? request.verdict}
							</Badge>
						)}
						{request.listing?.city && (
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<MapPin className="size-3" aria-hidden />
								{request.listing.city}
							</div>
						)}
					</div>
				</div>
				<p className="text-xs text-muted-foreground">
					Submitted {new Date(request.createdAt).toLocaleDateString()}
				</p>
			</div>

			<div container-id="request-detail-grid" className="grid grid-cols-1 gap-6 lg:grid-cols-2">

				{/* Left: images + info */}
				<div container-id="request-detail-left" className="flex flex-col gap-4">

					{/* Gallery */}
					<Card size="sm">
						<CardContent className="flex flex-col gap-3 pt-4">
							<div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
								{images.length > 0 ? (
									<Image
										src={images[activeImage]}
										alt={`Image ${activeImage + 1}`}
										fill
										className="object-contain"
										sizes="(max-width: 768px) 100vw, 50vw"
									/>
								) : (
									<div className="flex h-full items-center justify-center">
										<Package className="size-10 text-muted-foreground" aria-hidden />
									</div>
								)}
							</div>
							{images.length > 1 && (
								<div className="flex gap-2 overflow-x-auto">
									{images.map((img, i) => (
										<button
											key={i}
											onClick={() => setActiveImage(i)}
											className="relative size-12 shrink-0 overflow-hidden rounded-md border-2 transition-colors"
											style={{
												borderColor: activeImage === i ? "hsl(var(--primary))" : "transparent",
											}}
										>
											<Image
												src={img}
												alt={`Thumbnail ${i + 1}`}
												fill
												className="object-cover"
												sizes="48px"
											/>
										</button>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Listing info */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Listing details</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div>
									<p className="text-xs text-muted-foreground">Condition</p>
									<p className="font-medium capitalize">
										{request.listingDetail.condition.replace("_", " ")}
									</p>
								</div>
								{request.listing?.price && (
									<div>
										<p className="text-xs text-muted-foreground">Price</p>
										<p className="font-medium tabular-nums">
											Rs {request.listing.price.toLocaleString()}
										</p>
									</div>
								)}
							</div>
							{request.listingDetail.description && (
								<>
									<Separator />
									<p className="text-sm leading-relaxed text-muted-foreground">
										{request.listingDetail.description}
									</p>
								</>
							)}
						</CardContent>
					</Card>

					{/* Buyer notes */}
					{request.buyerNotes && (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Buyer notes</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{request.buyerNotes}
								</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right: verdict or completed result */}
				<div container-id="request-detail-right" className="flex flex-col gap-4">
					{request.status === "assigned" && isMine && (
						<VerdictForm requestId={request.id} />
					)}

					{request.status === "pending" && !isMine && (
						<Card size="sm">
							<CardContent className="flex flex-col gap-3 pt-4">
								<p className="text-sm text-muted-foreground">
									This request is available in your service area.
								</p>
								<AcceptButton requestId={request.id} />
							</CardContent>
						</Card>
					)}

					{request.status === "completed" && (
						<Card size="sm" className="border-primary/20 bg-primary/5">
							<CardHeader>
								<CardTitle className="text-base">Verdict</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								<Badge className="w-fit rounded-sm">
									{VERDICT_LABELS[request.verdict ?? ""] ?? request.verdict}
								</Badge>
								{request.notes && (
									<p className="text-sm leading-relaxed text-muted-foreground">
										{request.notes}
									</p>
								)}
								{request.respondedAt && (
									<p className="text-xs text-muted-foreground">
										Submitted {new Date(request.respondedAt).toLocaleDateString()}
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
