// ============================================================================
// Search Shell
// ============================================================================
//
// Client-side shell for the /search page. Renders a two-column layout:
// - Left: sticky filter sidebar (desktop) / stacked (mobile)
// - Right: result header (title, count, sort), active filter chips, results
//   grid, empty state, and pagination.
//
// Sort changes are handled client-side via router.push so the URL stays
// bookmarkable. All other filter changes go through SearchFiltersSidebar.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ListingRecord, ListingsPagination, ListingsSearchParams } from "@/lib/features/listings";
import { toListingsApiQuery } from "@/lib/features/listings/search-query";
import { ListingCard } from "@/components/listings/listing-card";
import { FilterChips, type ActiveFilterChip } from "@/components/listings/filter-chips";
import { SearchFiltersSidebar } from "@/components/listings/search-filters-sidebar";
import { buttonVariants } from "@/components/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/primitives/select";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type SearchShellProps = {
	listings: ListingRecord[];
	pagination: ListingsPagination;
	params: ListingsSearchParams;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Builds the active filter chip list from the current search params. */
function buildChips(params: ListingsSearchParams): ActiveFilterChip[] {
	const chips: ActiveFilterChip[] = [];
	const base = { ...params, platform: params.platform ?? "mobile", page: 1 as number | undefined };

	if (params.q) {
		chips.push({
			key: "q",
			label: `Keyword: ${params.q}`,
			removeHref: `/search${toListingsApiQuery({ ...base, q: undefined })}`,
		});
	}

	if (params.city) {
		chips.push({
			key: "city",
			label: `City: ${params.city}`,
			removeHref: `/search${toListingsApiQuery({ ...base, city: undefined })}`,
		});
	}

	if (params.price_min !== undefined) {
		chips.push({
			key: "pmin",
			label: `Min: ${params.price_min}`,
			removeHref: `/search${toListingsApiQuery({ ...base, price_min: undefined })}`,
		});
	}

	if (params.price_max !== undefined) {
		chips.push({
			key: "pmax",
			label: `Max: ${params.price_max}`,
			removeHref: `/search${toListingsApiQuery({ ...base, price_max: undefined })}`,
		});
	}

	if (params.condition) {
		const labels: Record<string, string> = {
			new: "New",
			like_new: "Like New",
			excellent: "Excellent",
			good: "Good",
			fair: "Fair",
			poor: "Poor",
		};
		chips.push({
			key: "condition",
			label: `Condition: ${labels[params.condition] ?? params.condition}`,
			removeHref: `/search${toListingsApiQuery({ ...base, condition: undefined })}`,
		});
	}

	if (params.sale_type) {
		const label =
			params.sale_type === "fixed"
				? "Buy Now"
				: params.sale_type === "auction"
					? "Auction"
					: params.sale_type;
		chips.push({
			key: "sale_type",
			label: `Type: ${label}`,
			removeHref: `/search${toListingsApiQuery({ ...base, sale_type: undefined })}`,
		});
	}

	return chips;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/** Full-page shell for /search — sidebar + header + results grid + pagination. */
export default function SearchShell({ listings, pagination, params }: SearchShellProps) {
	const router = useRouter();
	const chips = buildChips(params);
	const page = params.page ?? 1;
	const prevPage = page > 1 ? page - 1 : null;
	const nextPage = pagination.hasMore ? page + 1 : null;

	const hrefBase = (p: number) =>
		`/search${toListingsApiQuery({ ...params, platform: params.platform ?? "mobile", page: p })}`;

	/** Pushes a new URL with the selected sort applied. */
	function handleSortChange(value: string | null) {
		if (!value) return;
		const next = {
			...params,
			platform: "mobile" as const,
			sort: value as ListingsSearchParams["sort"],
			page: 1,
		};
		router.push(`/search${toListingsApiQuery(next)}`);
	}

	return (
		<div
			container-id="search-shell"
			className="flex flex-col gap-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-10"
		>
			{/* Desktop sticky sidebar */}
			<aside container-id="search-sidebar-desktop" className="hidden lg:sticky lg:top-20 lg:block">
				<SearchFiltersSidebar initial={params} />
			</aside>

			{/* Main content column */}
			<div container-id="search-main" className="flex min-w-0 flex-col gap-6">

				{/* Header: title, count, sort selector, active chips */}
				<header container-id="search-header" className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex flex-col gap-0.5">
							<h1 className="text-2xl font-bold tracking-tight">
								{params.q ? `Results for "${params.q}"` : "Browse listings"}
							</h1>
							<p className="text-sm text-muted-foreground tabular-nums">
								{pagination.total.toLocaleString()} listing{pagination.total === 1 ? "" : "s"}
							</p>
						</div>
						<Select value={params.sort ?? "newest"} onValueChange={handleSortChange}>
							<SelectTrigger className="w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest first</SelectItem>
								<SelectItem value="price_asc">Price: low to high</SelectItem>
								<SelectItem value="price_desc">Price: high to low</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<FilterChips chips={chips} />
				</header>

				{/* Results grid */}
				<div
					container-id="search-results-grid"
					className="grid grid-cols-2 gap-4 lg:grid-cols-3"
				>
					{listings.map((l) => (
						<ListingCard key={l.id} listing={l} />
					))}
				</div>

				{/* Empty state */}
				{listings.length === 0 ? (
					<div
						container-id="search-empty"
						className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center"
					>
						<p className="text-sm font-medium">No listings match your filters.</p>
						<p className="text-xs text-muted-foreground">
							Try removing a filter or broadening your search.
						</p>
					</div>
				) : null}

				{/* Pagination */}
				<div container-id="search-pagination" className="flex flex-wrap items-center justify-end gap-2 pt-2">
					{prevPage !== null ? (
						<Link
							href={hrefBase(prevPage)}
							className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
						>
							Previous
						</Link>
					) : null}
					{nextPage !== null ? (
						<Link
							href={hrefBase(nextPage)}
							className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
						>
							Next
						</Link>
					) : null}
				</div>
			</div>

			{/* Mobile stacked sidebar */}
			<div container-id="search-sidebar-mobile" className="lg:hidden">
				<SearchFiltersSidebar initial={params} />
			</div>
		</div>
	);
}
