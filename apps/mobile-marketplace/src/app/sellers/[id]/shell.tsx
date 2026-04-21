"use client";

import { useState } from "react";

import type { PublicProfile } from "@/lib/features/profiles/types";
import type { ReviewsListPayload } from "@/lib/features/reviews/types";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { ProfileStats } from "@/components/profiles/profile-stats";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

type SellerPublicShellProps = {
	profile: PublicProfile;
	reviewsInitial: ReviewsListPayload;
};

export default function SellerPublicShell({ profile, reviewsInitial }: SellerPublicShellProps) {
	const [tab, setTab] = useState<"overview" | "reviews">("overview");

	return (
		<div container-id="seller-public-shell" className="flex flex-col gap-8">
			<ProfileHeader profile={profile} />
			<ProfileStats
				stats={{
					avg_rating: profile.avg_rating,
					total_reviews: profile.total_reviews,
					total_listings: profile.total_listings,
					total_sales: profile.total_sales,
				}}
			/>

			<div
				container-id="seller-public-tabs"
				role="tablist"
				className="flex flex-wrap items-center gap-1 border-b border-border"
			>
				<Button
					type="button"
					role="tab"
					aria-selected={tab === "overview"}
					variant={tab === "overview" ? "secondary" : "ghost"}
					size="sm"
					className="-mb-px rounded-b-none"
					onClick={() => setTab("overview")}
				>
					Overview
				</Button>
				<Button
					type="button"
					role="tab"
					aria-selected={tab === "reviews"}
					variant={tab === "reviews" ? "secondary" : "ghost"}
					size="sm"
					className="-mb-px rounded-b-none"
					onClick={() => setTab("reviews")}
				>
					Reviews ({profile.total_reviews})
				</Button>
			</div>

			{tab === "overview" ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Listings</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Listings grid will load here when the listings feature is wired.
						</p>
					</CardContent>
				</Card>
			) : null}

			{tab === "reviews" ? (
				<section container-id="seller-public-reviews" className="flex flex-col gap-4">
					<h2 className="text-lg font-semibold tracking-tight">Seller reviews</h2>
					<ReviewsList key={profile.id} sellerId={profile.id} initial={reviewsInitial} />
				</section>
			) : null}
		</div>
	);
}
