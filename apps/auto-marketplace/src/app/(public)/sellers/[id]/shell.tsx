// ============================================================================
// Seller Public Shell
// ============================================================================
//
// Client shell for /sellers/[id]. Renders the public storefront for an
// automart seller: cover banner, avatar, trust chips, KPI stats, and three
// tabs — Listings (placeholder), Reviews (star distribution + paginated list),
// and About (bio, details, verifications).
//
// All data arrives as props from the RSC (page.tsx). The ReviewsList component
// handles its own pagination client-side via useSellerReviews.

"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, MessageSquare, Star, UserPlus, Wrench, Zap } from "lucide-react";

import type { PublicProfile } from "@/lib/features/profiles/types";
import type { ReviewsListPayload } from "@/lib/features/reviews/types";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type SellerPublicShellProps = {
	profile: PublicProfile;
	reviewsInitial: ReviewsListPayload;
};

type TabKey = "listings" | "reviews" | "about";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getInitials(name: string | null, handle: string | null): string {
	const src = name ?? handle ?? "?";
	return src
		.split(/\s+/)
		.map((s) => s[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getMemberSince(createdAt: string): string {
	return new Date(createdAt).getFullYear().toString();
}

/** Computes star distribution percentages from loaded review items. */
function starDistribution(items: ReviewsListPayload["items"]): { star: number; pct: number }[] {
	if (items.length === 0) {
		return [5, 4, 3, 2, 1].map((star) => ({ star, pct: 0 }));
	}
	const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	for (const r of items) {
		const s = Math.round(r.rating);
		if (s >= 1 && s <= 5) counts[s]++;
	}
	return [5, 4, 3, 2, 1].map((star) => ({
		star,
		pct: Math.round((counts[star]! / items.length) * 100),
	}));
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export default function SellerPublicShell({ profile, reviewsInitial }: SellerPublicShellProps) {
	const [tab, setTab] = useState<TabKey>("listings");

	const initials = getInitials(profile.display_name, profile.handle);
	const memberSince = getMemberSince(profile.created_at);
	const dist = starDistribution(reviewsInitial.items);

	const TABS: { key: TabKey; label: string }[] = [
		{ key: "listings", label: `Listings (${profile.total_listings})` },
		{ key: "reviews", label: `Reviews (${profile.total_reviews})` },
		{ key: "about", label: "About" },
	];

	return (
		<div container-id="seller-public-shell" className="flex flex-col gap-5">

			{/* Cover + avatar */}
			<div container-id="seller-cover" className="relative">
				{/* Decorative cover banner */}
				<div
					className="h-28 w-full rounded-xl bg-muted/40"
					style={{
						backgroundImage:
							"repeating-linear-gradient(135deg, oklch(0.70 0.21 50 / 0.08) 0 6px, transparent 6px 12px)",
					}}
					aria-hidden
				/>

				{/* Avatar — overlaps cover bottom */}
				<div className="absolute -bottom-10 left-5">
					<Avatar className="size-20 ring-4 ring-background" size="lg">
						{profile.avatar_url ? (
							<AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "Seller"} />
						) : null}
						<AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
					</Avatar>
				</div>
			</div>

			{/* Profile card */}
			<Card size="sm" className="pt-8">
				<CardContent className="flex flex-col gap-4">

					{/* Name row + actions */}
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-2xl font-bold tracking-tight">
									{profile.display_name ?? "Unnamed seller"}
								</h1>
								{profile.is_verified && (
									<Badge variant="default" className="rounded-sm text-[10px]">
										<CheckCircle2 className="size-3" aria-hidden />
										Verified
									</Badge>
								)}
								<Badge variant="secondary" className="rounded-sm capitalize text-[10px]">
									{profile.role}
								</Badge>
							</div>

							<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
								{profile.handle && <span>@{profile.handle}</span>}
								{profile.city && (
									<>
										<span aria-hidden>·</span>
										<span className="flex items-center gap-1">
											<MapPin className="size-3" aria-hidden />
											{profile.city}
										</span>
									</>
								)}
								<span aria-hidden>·</span>
								<span>seller since {memberSince}</span>
							</div>
						</div>

						<div className="flex gap-2">
							<Button type="button" variant="outline" size="sm" disabled>
								<UserPlus className="size-3.5" aria-hidden />
								Follow
							</Button>
							<Button type="button" size="sm" disabled>
								<MessageSquare className="size-3.5" aria-hidden />
								Chat
							</Button>
						</div>
					</div>

					{/* Trust chips */}
					<div className="flex flex-wrap gap-1.5">
						<span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
							<Star className="size-3 fill-primary text-primary" aria-hidden />
							{profile.avg_rating.toFixed(1)} ({profile.total_reviews})
						</span>
						{profile.is_verified && (
							<span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
								<CheckCircle2 className="size-3 text-green-600 dark:text-green-400" aria-hidden />
								ID verified
							</span>
						)}
						{profile.phone_verified && (
							<span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
								<CheckCircle2 className="size-3 text-green-600 dark:text-green-400" aria-hidden />
								Phone verified
							</span>
						)}
						<span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
							<Wrench className="size-3 text-primary" aria-hidden />
							Mechanic-verified parts
						</span>
						<span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
							<Zap className="size-3 text-primary" aria-hidden />
							Ships in 24h
						</span>
					</div>
				</CardContent>
			</Card>

			{/* KPI stats */}
			<div container-id="seller-stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					{ label: "Avg. rating", value: profile.avg_rating.toFixed(1), accent: true },
					{ label: "Total sales", value: profile.total_sales.toLocaleString(), accent: false },
					{ label: "Listings", value: profile.total_listings.toLocaleString(), accent: false },
					{ label: "Reviews", value: profile.total_reviews.toLocaleString(), accent: false },
				].map((s) => (
					<Card key={s.label} size="sm">
						<CardContent className="flex flex-col gap-1 pt-4">
							<p className="text-xs font-medium text-muted-foreground">{s.label}</p>
							<p
								className={cn(
									"text-2xl font-bold tabular-nums",
									s.accent && "text-primary",
								)}
							>
								{s.value}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Tabs */}
			<div
				container-id="seller-tabs"
				role="tablist"
				className="flex items-center gap-0 border-b border-border"
			>
				{TABS.map(({ key, label }) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={tab === key}
						onClick={() => setTab(key)}
						className={cn(
							"border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
							tab === key
								? "border-primary text-foreground"
								: "border-transparent text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</button>
				))}
			</div>

			{/* Listings tab */}
			{tab === "listings" ? (
				<div container-id="seller-listings-tab" className="flex flex-col gap-4">
					<div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
						<p className="text-sm font-medium">Parts listings coming soon.</p>
						<p className="text-xs text-muted-foreground">
							Seller-scoped part search is not yet wired to this profile.
						</p>
					</div>
				</div>
			) : null}

			{/* Reviews tab */}
			{tab === "reviews" ? (
				<div container-id="seller-reviews-tab" className="flex flex-col gap-5">

					{/* Star distribution */}
					<Card size="sm">
						<CardHeader>
							<div className="flex items-center gap-3">
								<p className="text-4xl font-bold tabular-nums text-primary">
									{profile.avg_rating.toFixed(1)}
								</p>
								<div className="flex flex-col gap-0.5">
									<div className="flex gap-0.5">
										{[1, 2, 3, 4, 5].map((i) => (
											<Star
												key={i}
												className={cn(
													"size-4",
													i <= Math.round(profile.avg_rating)
														? "fill-primary text-primary"
														: "text-muted-foreground",
												)}
												aria-hidden
											/>
										))}
									</div>
									<p className="text-xs text-muted-foreground">
										{profile.total_reviews} verified reviews
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{dist.map(({ star, pct }) => (
								<div key={star} className="flex items-center gap-2">
									<span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
										{star}
									</span>
									<Star className="size-3 shrink-0 fill-primary text-primary" aria-hidden />
									<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
										{pct}%
									</span>
								</div>
							))}
						</CardContent>
					</Card>

					<ReviewsList
						key={profile.id}
						sellerId={profile.id}
						initial={reviewsInitial}
						emptyMessage="This seller has no reviews yet."
					/>
				</div>
			) : null}

			{/* About tab */}
			{tab === "about" ? (
				<div container-id="seller-about-tab" className="flex flex-col gap-4">

					{/* Bio */}
					{profile.bio ? (
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">About</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
									{profile.bio}
								</p>
							</CardContent>
						</Card>
					) : null}

					{/* Details */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Details</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-0">
							{[
								profile.city && { label: "Location", value: profile.city },
								{ label: "Member since", value: memberSince },
								profile.handle && { label: "Handle", value: `@${profile.handle}` },
							]
								.filter(Boolean)
								.map((row, i, arr) => {
									const { label, value } = row as { label: string; value: string };
									return (
										<div key={label}>
											{i > 0 && <Separator />}
											<div className="flex items-center justify-between py-2.5 text-sm">
												<span className="text-muted-foreground">{label}</span>
												<span className="font-medium">{value}</span>
											</div>
										</div>
									);
								})}
						</CardContent>
					</Card>

					{/* Verifications */}
					<Card size="sm">
						<CardHeader>
							<CardTitle className="text-base">Verifications</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{[
								{ label: "Identity verified", done: profile.is_verified },
								{ label: "Phone number", done: profile.phone_verified },
								{ label: "Bank account", done: false },
								{ label: "Address", done: false },
							].map((v) => (
								<div key={v.label} className="flex items-center gap-2 text-sm">
									<CheckCircle2
										className={cn(
											"size-4 shrink-0",
											v.done
												? "text-green-600 dark:text-green-400"
												: "text-muted-foreground/30",
										)}
										aria-hidden
									/>
									<span className={v.done ? "font-medium" : "text-muted-foreground"}>
										{v.label}
									</span>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
