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
//
// Instance Isolation
// ------------------
// Two copies of this panel are mounted at once (desktop aside + mobile stack).
// Every DOM id and radio group name is therefore namespaced with a `useId()`
// prefix, otherwise the two copies collide into a single native radio group and
// the browser silently clears the checked state of the visible one.
//
// URL Synchronisation
// -------------------
// Local state seeds from `initial`, but `initial` changes whenever the URL does
// (Apply, chip removal, back/forward). A render-phase reset keyed on the
// serialised params re-seeds the inputs so the panel always mirrors the filters
// actually in effect.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import type { ListingsSearchParams } from "@/lib/features/listings";
import { Button } from "@/components/primitives/button";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { RadioGroup, RadioGroupItem } from "@/components/primitives/radio-group";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

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

	sp.set("platform", "automotive");

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

	return qs ? `${basePath}?${qs}` : `${basePath}?platform=automotive`;
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

/** Row styling for a radio option — selected rows get an accented pill. */
function optionRowClass(selected: boolean): string {
	return cn(
		"flex cursor-pointer items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5 text-sm transition-colors",
		selected
			? "border-primary/40 bg-primary/10 font-medium text-foreground"
			: "text-muted-foreground hover:bg-accent hover:text-foreground",
	);
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/** Sidebar filter panel. Pushes a new search URL on Apply. */
export function SearchFiltersSidebar({ initial, basePath = "/search" }: SearchFiltersSidebarProps) {
	const router = useRouter();

	// Namespace for ids and radio group names — both panel copies share the DOM
	const uid = useId();

	// Local filter state
	const [q, setQ] = useState(initial.q ?? "");
	const [city, setCity] = useState(initial.city ?? "");
	const [priceMin, setPriceMin] = useState(initial.price_min?.toString() ?? "");
	const [priceMax, setPriceMax] = useState(initial.price_max?.toString() ?? "");
	const [condition, setCondition] = useState<string>(initial.condition ?? "");
	const [saleType, setSaleType] = useState<string>(initial.sale_type ?? "");

	// Re-seed every input whenever the URL-derived params change
	const initialKey = JSON.stringify([
		initial.q ?? "",
		initial.city ?? "",
		initial.price_min ?? "",
		initial.price_max ?? "",
		initial.condition ?? "",
		initial.sale_type ?? "",
	]);
	const [syncedKey, setSyncedKey] = useState(initialKey);

	if (syncedKey !== initialKey) {
		setSyncedKey(initialKey);
		setQ(initial.q ?? "");
		setCity(initial.city ?? "");
		setPriceMin(initial.price_min?.toString() ?? "");
		setPriceMax(initial.price_max?.toString() ?? "");
		setCondition(initial.condition ?? "");
		setSaleType(initial.sale_type ?? "");
	}

	/** Builds the next params object and navigates. */
	function apply() {
		const next: ListingsSearchParams = {
			platform: "automotive",
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
				<FieldLabel htmlFor={`${uid}-q`}>Keyword</FieldLabel>
				<Input
					id={`${uid}-q`}
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Search title…"
				/>
			</Field>

			<Separator />

			{/* Condition */}
			<div container-id="search-filters-condition" className="flex flex-col gap-2">
				<span id={`${uid}-condition-label`} className="text-sm font-medium">
					Condition
				</span>
				<RadioGroup
					aria-labelledby={`${uid}-condition-label`}
					name={`${uid}-condition`}
					value={condition}
					onValueChange={(value) => setCondition(String(value ?? ""))}
					className="gap-1"
				>
					{CONDITION_OPTIONS.map((opt) => (
						<label key={opt.value} className={optionRowClass(condition === opt.value)}>
							<RadioGroupItem value={opt.value} />
							{opt.label}
						</label>
					))}
				</RadioGroup>
			</div>

			<Separator />

			{/* Price range */}
			<div container-id="search-filters-price" className="grid grid-cols-2 gap-3">
				<Field>
					<FieldLabel htmlFor={`${uid}-pmin`}>Min price (Rs)</FieldLabel>
					<Input
						id={`${uid}-pmin`}
						inputMode="numeric"
						value={priceMin}
						onChange={(e) => setPriceMin(e.target.value)}
						placeholder="0"
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${uid}-pmax`}>Max price (Rs)</FieldLabel>
					<Input
						id={`${uid}-pmax`}
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
				<FieldLabel htmlFor={`${uid}-city`}>City</FieldLabel>
				<Input
					id={`${uid}-city`}
					value={city}
					onChange={(e) => setCity(e.target.value)}
					placeholder="City"
				/>
			</Field>

			<Separator />

			{/* Listing type */}
			<div container-id="search-filters-sale-type" className="flex flex-col gap-2">
				<span id={`${uid}-sale-type-label`} className="text-sm font-medium">
					Listing type
				</span>
				<RadioGroup
					aria-labelledby={`${uid}-sale-type-label`}
					name={`${uid}-sale-type`}
					value={saleType}
					onValueChange={(value) => setSaleType(String(value ?? ""))}
					className="gap-1"
				>
					{SALE_TYPE_OPTIONS.map((opt) => (
						<label key={opt.value} className={optionRowClass(saleType === opt.value)}>
							<RadioGroupItem value={opt.value} />
							{opt.label}
						</label>
					))}
				</RadioGroup>
			</div>

			{/* Apply */}
			<Button type="button" onClick={apply} className="w-full">
				Apply filters
			</Button>
		</div>
	);
}
