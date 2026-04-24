// ============================================================================
// Parts Category Grid Page
// ============================================================================
//
// Public browse page listing all top-level part categories (parent_id IS NULL).
// Each category card links to /parts/{slug} where the buyer can browse listings
// within that category. Fetched server-side; no auth required.

import Link from "next/link";
import { Box } from "lucide-react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/primitives/card";

export default async function PartsPage() {
	const supabase = await createServerSupabaseClient();

	const { data: categories } = await supabase
		.from("part_categories")
		.select("id, name, slug, description")
		.is("parent_id", null)
		.order("name");

	return (
		<div container-id="parts-page" className="flex flex-col flex-1 min-h-0 p-4 gap-6">

			{/* Header */}
			<header container-id="parts-header" className="flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Parts</h1>
				<p className="text-sm text-muted-foreground">
					Browse by category to find the right part for your vehicle
				</p>
			</header>

			{/* Category grid */}
			{categories && categories.length > 0 ? (
				<section container-id="parts-categories">
					<div
						container-id="parts-category-grid"
						className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
					>
						{categories.map((cat) => (
							<Link
								key={cat.id}
								href={`/parts/${cat.slug}`}
								className="group block focus:outline-none"
							>
								<Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
									<CardContent container-id={`parts-cat-${cat.slug}`} className="flex flex-col gap-3 p-5">
										<Box className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden />
										<div className="flex flex-col gap-1">
											<p className="text-sm font-semibold leading-tight">{cat.name}</p>
											{cat.description && (
												<p className="text-xs text-muted-foreground line-clamp-2">
													{cat.description}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</section>
			) : (
				<div
					container-id="parts-empty"
					className="flex flex-col flex-1 min-h-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center"
				>
					<p className="text-sm font-medium">No categories yet.</p>
					<p className="text-xs text-muted-foreground">Check back soon.</p>
				</div>
			)}
		</div>
	);
}
