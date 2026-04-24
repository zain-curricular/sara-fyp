// ============================================================================
// Seller Reviews Shell
// ============================================================================
//
// Rating summary bar, star filter tabs, review cards with inline reply form.
// Reply is submitted to POST /api/reviews/[id]/reply.

"use client";

import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";

import type { ReviewRow } from "./page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
			{Array.from({ length: 5 }).map((_, i) => (
				<Star
					key={i}
					className={cn(
						"size-3.5",
						i < rating ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/30",
					)}
					aria-hidden
				/>
			))}
		</div>
	);
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

// ----------------------------------------------------------------------------
// Reply form
// ----------------------------------------------------------------------------

function ReplyForm({ reviewId, existingReply }: { reviewId: string; existingReply: string | null }) {
	const [open, setOpen] = useState(false);
	const [reply, setReply] = useState(existingReply ?? "");
	const [busy, setBusy] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit() {
		if (!reply.trim()) return;
		setError(null);
		setBusy(true);

		try {
			const res = await fetch(`/api/reviews/${reviewId}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reply: reply.trim() }),
			});
			const json = (await res.json()) as { ok: boolean; error?: string };

			if (!json.ok) {
				setError(json.error ?? "Failed to save reply");
			} else {
				setSaved(true);
				setOpen(false);
			}
		} catch {
			setError("Network error — please try again");
		} finally {
			setBusy(false);
		}
	}

	if (saved || existingReply) {
		return (
			<div className="mt-2 rounded-lg bg-muted/40 px-3 py-2">
				<p className="text-xs font-medium text-muted-foreground">Your reply</p>
				<p className="mt-0.5 text-sm">{saved ? reply : existingReply}</p>
			</div>
		);
	}

	return (
		<div className="mt-2">
			{!open ? (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					<MessageSquare className="size-3.5" aria-hidden />
					Reply to this review
				</button>
			) : (
				<div className="flex flex-col gap-2">
					<Textarea
						value={reply}
						onChange={(e) => setReply(e.target.value)}
						placeholder="Write a professional reply…"
						rows={3}
						disabled={busy}
					/>
					{error && <p className="text-xs text-destructive">{error}</p>}
					<div className="flex items-center gap-2">
						<Button
							type="button"
							size="sm"
							disabled={busy || !reply.trim()}
							onClick={() => void handleSubmit()}
						>
							{busy ? "Posting…" : "Post reply"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={busy}
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

type StarFilter = "all" | 1 | 2 | 3 | 4 | 5;

export default function SellerReviewsShell({ reviews }: { reviews: ReviewRow[] }) {
	const [filter, setFilter] = useState<StarFilter>("all");

	// Rating summary
	const totalCount = reviews.length;
	const avgRating = totalCount > 0
		? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
		: 0;

	const starCounts = [5, 4, 3, 2, 1].map((star) => ({
		star,
		count: reviews.filter((r) => r.rating === star).length,
	}));

	const filtered =
		filter === "all" ? reviews : reviews.filter((r) => r.rating === filter);

	return (
		<div container-id="seller-reviews-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="reviews-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
				<p className="text-sm text-muted-foreground">Manage your seller reputation</p>
			</header>

			{totalCount === 0 ? (
				<div
					container-id="reviews-empty"
					className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<Star className="size-10 text-muted-foreground/30" aria-hidden />
					<p className="text-sm font-medium">No reviews yet</p>
					<p className="text-xs text-muted-foreground">
						Complete orders and buyers will be prompted to leave a review.
					</p>
				</div>
			) : (
				<>
					{/* Rating summary */}
					<Card size="sm">
						<CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:gap-8">
							{/* Average */}
							<div className="flex flex-col items-center gap-1">
								<p className="text-5xl font-bold tabular-nums">{avgRating.toFixed(1)}</p>
								<StarRating rating={Math.round(avgRating)} />
								<p className="text-xs text-muted-foreground">{totalCount} reviews</p>
							</div>

							<Separator orientation="vertical" className="hidden h-20 sm:block" />

							{/* Star breakdown */}
							<div className="flex flex-1 flex-col gap-1.5">
								{starCounts.map(({ star, count }) => (
									<button
										key={star}
										type="button"
										onClick={() => setFilter(filter === star ? "all" : (star as StarFilter))}
										className="flex items-center gap-2 group"
									>
										<span className="w-4 text-xs tabular-nums text-muted-foreground">{star}</span>
										<Star className="size-3 text-amber-400 fill-amber-400" aria-hidden />
										<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-amber-400 transition-all"
												style={{
													width: totalCount > 0 ? `${Math.round((count / totalCount) * 100)}%` : "0%",
												}}
											/>
										</div>
										<span className="w-6 text-xs tabular-nums text-muted-foreground">{count}</span>
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Filter tabs */}
					<div container-id="reviews-filter" className="flex flex-wrap gap-1.5">
						{(["all", 5, 4, 3, 2, 1] as StarFilter[]).map((f) => (
							<button
								key={f}
								type="button"
								onClick={() => setFilter(f)}
								className={cn(
									"rounded-full border px-3 py-1 text-xs font-medium transition-colors",
									filter === f
										? "border-primary bg-primary text-primary-foreground"
										: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
								)}
							>
								{f === "all" ? "All" : `${f} ★`}
							</button>
						))}
					</div>

					{/* Review list */}
					<div container-id="reviews-list" className="flex flex-col gap-3">
						{filtered.length === 0 ? (
							<p className="text-sm text-muted-foreground">No reviews match this filter.</p>
						) : (
							filtered.map((review) => (
								<Card key={review.id} size="sm">
									<CardContent className="flex flex-col gap-3 pt-4">
										<div className="flex items-start gap-3">
											<Avatar className="size-9 shrink-0">
												<AvatarImage src={review.reviewerAvatar ?? undefined} />
												<AvatarFallback className="text-xs">
													{review.reviewerName.slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-1 flex-col gap-1">
												<div className="flex flex-wrap items-center justify-between gap-1">
													<p className="text-sm font-semibold">{review.reviewerName}</p>
													<span className="text-xs text-muted-foreground">
														{formatDate(review.createdAt)}
													</span>
												</div>
												<StarRating rating={review.rating} />
											</div>
										</div>
										{review.comment && (
											<p className="text-sm text-foreground">{review.comment}</p>
										)}
										{!review.comment && (
											<p className="text-xs italic text-muted-foreground">No written comment</p>
										)}
										{review.sellerReply && (
											<Badge variant="secondary" className="w-fit rounded-sm text-[10px]">
												You replied
											</Badge>
										)}
										<ReplyForm
											reviewId={review.id}
											existingReply={review.sellerReply}
										/>
									</CardContent>
								</Card>
							))
						)}
					</div>
				</>
			)}
		</div>
	);
}
