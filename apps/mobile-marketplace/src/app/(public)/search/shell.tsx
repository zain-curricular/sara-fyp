"use client";

import Link from "next/link";

import type { ListingRecord, ListingsPagination } from "@/lib/features/listings";
import type { ListingsSearchParams } from "@/lib/features/listings";
import { toListingsApiQuery } from "@/lib/features/listings/search-query";
import { ListingCard } from "@/components/listings/listing-card";
import { FilterChips, type ActiveFilterChip } from "@/components/listings/filter-chips";
import { SearchFiltersSidebar } from "@/components/listings/search-filters-sidebar";
import { buttonVariants } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type SearchShellProps = {
	listings: ListingRecord[];
	pagination: ListingsPagination;
	params: ListingsSearchParams;
};

function buildChips(params: ListingsSearchParams): ActiveFilterChip[] {
	const chips: ActiveFilterChip[] = [];
	const base = { ...params, platform: params.platform ?? "mobile", page: 1 as number | undefined };

	if (params.q) {
		const next = { ...base, q: undefined };
		chips.push({
			key: "q",
			label: `Keyword: ${params.q}`,
			removeHref: `/search${toListingsApiQuery(next)}`,
		});
	}
	if (params.city) {
		const next = { ...base, city: undefined };
		chips.push({
			key: "city",
			label: `City: ${params.city}`,
			removeHref: `/search${toListingsApiQuery(next)}`,
		});
	}
	if (params.price_min !== undefined) {
		const next = { ...base, price_min: undefined };
		chips.push({
			key: "pmin",
			label: `Min: ${params.price_min}`,
			removeHref: `/search${toListingsApiQuery(next)}`,
		});
	}
	if (params.price_max !== undefined) {
		const next = { ...base, price_max: undefined };
		chips.push({
			key: "pmax",
			label: `Max: ${params.price_max}`,
			removeHref: `/search${toListingsApiQuery(next)}`,
		});
	}
	return chips;
}

export default function SearchShell({ listings, pagination, params }: SearchShellProps) {
	const chips = buildChips(params);
	const page = params.page ?? 1;
	const prevPage = page > 1 ? page - 1 : null;
	const nextPage = pagination.hasMore ? page + 1 : null;

	const hrefBase = (p: number) =>
		`/search${toListingsApiQuery({ ...params, platform: params.platform ?? "mobile", page: p })}`;

	return (
		<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
			<div className="hidden w-full max-w-xs shrink-0 lg:block">
				<SearchFiltersSidebar initial={params} />
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-semibold tracking-tight">Search listings</h1>
					<p className="text-sm text-muted-foreground">
						{pagination.total} result{pagination.total === 1 ? "" : "s"}
					</p>
					<FilterChips chips={chips} />
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{listings.map((l) => (
						<ListingCard key={l.id} listing={l} />
					))}
				</div>

				{listings.length === 0 ? (
					<p className="text-sm text-muted-foreground">No listings match your filters.</p>
				) : null}

				<div className="flex flex-wrap items-center gap-2">
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

			<div className="lg:hidden">
				<SearchFiltersSidebar initial={params} />
			</div>
		</div>
	);
}
