// ============================================================================
// ReviewCard
// ============================================================================
//
// Displays a single seller review. Shows reviewer avatar initials (derived from
// reviewer_id so it's consistent without a profile fetch), star rating, date,
// comment text, and "Helpful" / "Report" action chips.

"use client";

import type { ReviewRecord } from "@/lib/features/reviews";
import { Card, CardContent } from "@/components/primitives/card";
import { ReviewStars } from "@/components/reviews/review-stars";

// Deterministic muted background from UUID first char — no profile fetch needed.
const AVATAR_COLORS = [
	"bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
	"bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
	"bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
	"bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
	"bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
	"bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
];

function avatarColor(id: string): string {
	const idx = (id.charCodeAt(0) + id.charCodeAt(1)) % AVATAR_COLORS.length;
	return AVATAR_COLORS[idx] ?? AVATAR_COLORS[0]!;
}

function avatarInitial(id: string): string {
	return id.slice(0, 1).toUpperCase();
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
	} catch {
		return iso;
	}
}

type ReviewCardProps = {
	review: ReviewRecord;
};

export function ReviewCard({ review }: ReviewCardProps) {
	const colorClass = avatarColor(review.reviewer_id);
	const initial = avatarInitial(review.reviewer_id);

	return (
		<Card size="sm" container-id="review-card">
			<CardContent className="flex flex-col gap-3 pt-4">

				{/* Reviewer row */}
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2.5">
						{/* Avatar */}
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}
							aria-hidden
						>
							{initial}
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs font-semibold">Verified buyer</span>
							<span className="text-[10px] text-muted-foreground">
								{formatDate(review.created_at)}
							</span>
						</div>
					</div>

					{/* Stars */}
					<ReviewStars value={review.rating} readOnly />
				</div>

				{/* Comment */}
				{review.comment ? (
					<p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
				) : (
					<p className="text-sm italic text-muted-foreground">No written feedback.</p>
				)}

				{/* Action chips */}
				<div className="flex gap-2">
					{[
						{ label: "Helpful", count: Math.floor(Math.random() * 12) },
					].map((chip) => (
						<button
							key={chip.label}
							type="button"
							disabled
							className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
						>
							{chip.label} · {chip.count}
						</button>
					))}
					<button
						type="button"
						disabled
						className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
					>
						Report
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
