// ============================================================================
// Search Filters Sidebar
// ============================================================================
//
// Client-side filter panel for the browse/search page. Manages local state for
// keyword, condition, price range, city, and listing type, then pushes a new
// URL via router.push on Apply. The `buildHref` helper serialises the full
// ListingsSearchParams to a query string, preserving sticky params like
// model_id and category_id across filter changes.
//
// Used in both the desktop sticky aside and the mobile stacked footer area of
// SearchShell. No Card wrapper — the shell provides visual context.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ListingsSearchParams } from "@/lib/features/listings";
import { Button } from "@/components/primitives/button";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Separator } from "@/components/primitives/separator";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type SearchFiltersSidebarProps = {
	initial: ListingsSearchParams;
	basePath?: string;
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Serialises a ListingsSearchParams object to a full href string. */
function buildHref(basePath: string, next: ListingsSearchParams): string {
	const sp = new URLSearchParams();

	sp.set("platform", "mobile");

	if (next.q) sp.set("q", next.q);
	if (next.city) sp.set("city", next.city);
	if (next.price_min !== undefined) sp.set("price_min", String(next.price_min));
	if (next.price_max !== undefined) sp.set("price_max", String(next.price_max));
	if (next.model_id) sp.set("model_id", next.model_id);
	if (next.category_id) sp.set("category_id", next.category_id);
	if (next.page && next.page > 1) sp.set("page", String(next.page));
	if (next.limit && next.limit !== 20) sp.set("limit", String(next.limit));
	if (next.condition) sp.set("condition", next.condition);
	if (next.sale_type) sp.set("sale_type", next.sale_type);
	if (next.sort) sp.set("sort", next.sort);

	const qs = sp.toString();

	return qs ? `${basePath}?${qs}` : `${basePath}?platform=mobile`;
}

// ----------------------------------------------------------------------------
// Option definitions
// ----------------------------------------------------------------------------

const CONDITION_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "Any" },
	{ value: "new", label: "New" },
	{ value: "like_new", label: "Like New" },
	{ value: "excellent", label: "Excellent" },
	{ value: "good", label: "Good" },
	{ value: "fair", label: "Fair" },
];

const SALE_TYPE_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "All" },
	{ value: "fixed", label: "Buy Now" },
	{ value: "auction", label: "Auction" },
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/** Sidebar filter panel. Pushes a new search URL on Apply. */
export function SearchFiltersSidebar({ initial, basePath = "/search" }: SearchFiltersSidebarProps) {
	const router = useRouter();

	// Local filter state
	const [q, setQ] = useState(initial.q ?? "");
	const [city, setCity] = useState(initial.city ?? "");
	const [priceMin, setPriceMin] = useState(initial.price_min?.toString() ?? "");
	const [priceMax, setPriceMax] = useState(initial.price_max?.toString() ?? "");
	const [condition, setCondition] = useState(initial.condition ?? "");
	const [saleType, setSaleType] = useState(initial.sale_type ?? "");

	/** Builds the next params object and navigates. */
	function apply() {
		const next: ListingsSearchParams = {
			platform: "mobile",
			q: q.trim() || undefined,
			city: city.trim() || undefined,
			price_min: priceMin ? Number(priceMin) : undefined,
			price_max: priceMax ? Number(priceMax) : undefined,
			model_id: initial.model_id,
			category_id: initial.category_id,
			page: 1,
			limit: initial.limit ?? 20,
			condition: (condition || undefined) as ListingsSearchParams["condition"],
			sale_type: (saleType || undefined) as ListingsSearchParams["sale_type"],
		};

		router.push(buildHref(basePath, next));
	}

	return (
		<div container-id="search-filters-sidebar" className="flex flex-col gap-5">

			{/* Keyword */}
			<Field>
				<FieldLabel htmlFor="search-q">Keyword</FieldLabel>
				<Input
					id="search-q"
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search title…"
				/>
			</Field>

			<Separator />

			{/* Condition */}
			<div container-id="search-filters-condition" className="flex flex-col gap-2">
				<span className="text-sm font-medium">Condition</span>
				<div className="flex flex-col gap-1">
					{CONDITION_OPTIONS.map((opt) => (
						<label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
							<input
								type="radio"
								name="condition"
								value={opt.value}
								checked={condition === opt.value}
								onChange={() => setCondition(opt.value)}
								className="accent-primary"
							/>
							{opt.label}
						</label>
					))}
				</div>
			</div>

			<Separator />

			{/* Price range */}
			<div container-id="search-filters-price" className="grid grid-cols-2 gap-3">
				<Field>
					<FieldLabel htmlFor="search-pmin">Min price</FieldLabel>
					<Input
						id="search-pmin"
						inputMode="numeric"
						value={priceMin}
						onChange={(e) => setPriceMin(e.target.value)}
						placeholder="0"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor="search-pmax">Max price</FieldLabel>
					<Input
						id="search-pmax"
						inputMode="numeric"
						value={priceMax}
						onChange={(e) => setPriceMax(e.target.value)}
						placeholder="∞"
					/>
				</Field>
			</div>

			<Separator />

			{/* City */}
			<Field>
				<FieldLabel htmlFor="search-city">City</FieldLabel>
				<Input
					id="search-city"
					value={city}
					onChange={(e) => setCity(e.target.value)}
					placeholder="City"
				/>
			</Field>

			<Separator />

			{/* Listing type */}
			<div container-id="search-filters-sale-type" className="flex flex-col gap-2">
				<span className="text-sm font-medium">Listing type</span>
				<div className="flex flex-col gap-1">
					{SALE_TYPE_OPTIONS.map((opt) => (
						<label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
							<input
								type="radio"
								name="sale_type"
								value={opt.value}
								checked={saleType === opt.value}
								onChange={() => setSaleType(opt.value)}
								className="accent-primary"
							/>
							{opt.label}
						</label>
					))}
				</div>
			</div>

			{/* Apply */}
			<Button type="button" onClick={apply} className="w-full">
				Apply filters
			</Button>
		</div>
	);
}
