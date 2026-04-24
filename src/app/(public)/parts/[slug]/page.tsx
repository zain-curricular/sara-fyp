// ============================================================================
// Parts Category Listings Page
// ============================================================================
//
// Public page showing all active listings within a single part category,
// resolved by the category's URL slug. Returns 404 if the slug is unknown.
// Breadcrumb provides one-click navigation back to the category grid.

import { notFound } from "next/navigation";
import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";

type CategoryListingsPageProps = {
	params: Promise<{ slug: string }>;
};

export default async function CategoryListingsPage({ params }: CategoryListingsPageProps) {
	const { slug } = await params;

	const supabase = await createServerSupabaseClient();

	const { data: category } = await supabase
		.from("part_categories")
		.select("id, name")
		.eq("slug", slug)
		.maybeSingle();

	if (!category) notFound();

	const { data: listings } = await supabase
		.from("listings")
		.select("*")
		.eq("part_category_id", category.id)
		.eq("status", "active")
		.is("deleted_at", null)
		.order("created_at", { ascending: false })
		.limit(40);

	return (
		<div container-id="category-listings-page" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* Breadcrumb */}
			<nav container-id="category-breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Link href="/parts" className="hover:text-foreground transition-colors">
					Parts
				</Link>
				<span aria-hidden>›</span>
				<span className="text-foreground font-medium">{category.name}</span>
			</nav>

			{/* Header */}
			<header container-id="category-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
				<p className="text-sm text-muted-foreground">
					{listings?.length ?? 0} listing{listings?.length !== 1 ? "s" : ""} available
				</p>
			</header>

			{/* Listings grid */}
			{listings && listings.length > 0 ? (
				<section container-id="category-listings">
					<div
						container-id="category-listings-grid"
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
					>
						{listings.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				</section>
			) : (
				<div
					container-id="category-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No listings in this category yet.</p>
					<p className="text-xs text-muted-foreground">
						Check back soon — sellers are adding stock regularly.
					</p>
				</div>
			)}
		</div>
	);
}
