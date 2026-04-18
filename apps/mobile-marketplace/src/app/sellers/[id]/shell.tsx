"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { ProfileStats } from "@/components/profiles/profile-stats";
import type { PublicProfile } from "@/lib/features/profiles/types";

export default function SellerPublicShell({ profile }: { profile: PublicProfile }) {
	return (
		<div className="flex flex-col gap-8">
			<ProfileHeader profile={profile} />
			<ProfileStats
				stats={{
					avg_rating: profile.avg_rating,
					total_reviews: profile.total_reviews,
					total_listings: profile.total_listings,
					total_sales: profile.total_sales,
				}}
			/>
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
		</div>
	);
}
