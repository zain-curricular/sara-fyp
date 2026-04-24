// ============================================================================
// Create Listing Wizard
// ============================================================================
//
// Three-step wizard: (1) Details — category, title, description, sale type,
// condition, price, city; (2) Photos — image dropzone; (3) Publish.
//
// Desktop: form left, sticky live-preview card right. Preview updates in
// real-time from local state. API calls only fire on step transitions.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ImageIcon } from "lucide-react";

import type { CategoryOption, CreateListingWizardInput } from "@/lib/features/listings";
import { useCreateListing, usePublishListing, useUploadImages } from "@/lib/features/listings";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldLabel } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";
import { Separator } from "@/components/primitives/separator";
import { Textarea } from "@/components/primitives/textarea";
import { ImageDropzone } from "@/components/listings/image-dropzone";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Types & constants
// ----------------------------------------------------------------------------

type CreateListingWizardProps = {
	categories: CategoryOption[];
};

const CONDITIONS = [
	{ value: "new", grade: "A+", label: "New", sub: "Original packaging" },
	{ value: "like_new", grade: "A", label: "Like New", sub: "Removed, unused" },
	{ value: "excellent", grade: "B+", label: "Excellent", sub: "Very light use" },
	{ value: "good", grade: "B", label: "Good", sub: "Normal wear" },
	{ value: "fair", grade: "C", label: "Fair", sub: "Visible wear" },
	{ value: "poor", grade: "D", label: "Poor", sub: "Heavy wear" },
] as const;

type ConditionValue = (typeof CONDITIONS)[number]["value"];

const SALE_TYPES = [
	{ value: "fixed", label: "Buy Now", sub: "Set a fixed price" },
	{ value: "auction", label: "Auction", sub: "Let buyers bid" },
	{ value: "both", label: "Both", sub: "Recommended ✨" },
] as const;

type SaleTypeValue = (typeof SALE_TYPES)[number]["value"];

const STEPS = ["Details", "Photos", "Publish"] as const;

// ----------------------------------------------------------------------------
// Step indicator
// ----------------------------------------------------------------------------

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
	return (
		<ol container-id="wizard-steps" className="flex items-center gap-0">
			{STEPS.map((label, i) => {
				const n = (i + 1) as 1 | 2 | 3;
				const done = current > n;
				const active = current === n;
				return (
					<li key={label} className="flex items-center gap-0">
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"flex size-6 items-center justify-center rounded-full text-xs font-semibold",
									done && "bg-primary text-primary-foreground",
									active && "border-2 border-primary text-primary",
									!done && !active && "border-2 border-border text-muted-foreground",
								)}
							>
								{done ? <CheckCircle2 className="size-3.5" aria-hidden /> : n}
							</span>
							<span
								className={cn(
									"text-sm font-medium",
									active ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{label}
							</span>
						</div>
						{n < 3 && (
							<div
								className={cn(
									"mx-3 h-px w-8 shrink-0 sm:w-12",
									done ? "bg-primary" : "bg-border",
								)}
								aria-hidden
							/>
						)}
					</li>
				);
			})}
		</ol>
	);
}

// ----------------------------------------------------------------------------
// Live preview card
// ----------------------------------------------------------------------------

function ListingPreview({
	title,
	price,
	city,
	condition,
	saleType,
}: {
	title: string;
	price: string;
	city: string;
	condition: ConditionValue;
	saleType: SaleTypeValue;
}) {
	const conditionMeta = CONDITIONS.find((c) => c.value === condition);
	const isEmpty = !title && !price && !city;

	return (
		<Card size="sm" className="h-fit">
			<CardHeader>
				<CardTitle className="text-sm text-muted-foreground">Live preview</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{/* Image placeholder */}
				<div className="flex aspect-[4/3] w-full items-center justify-center rounded-md bg-muted/40">
					<ImageIcon className="size-8 text-muted-foreground/40" aria-hidden />
				</div>

				{/* Badges */}
				<div className="flex flex-wrap gap-1.5">
					{conditionMeta && (
						<Badge variant="secondary" className="rounded-sm text-[10px]">
							{conditionMeta.grade} · {conditionMeta.label}
						</Badge>
					)}
					{saleType !== "fixed" && (
						<Badge className="rounded-sm text-[10px]">LIVE</Badge>
					)}
				</div>

				{/* Title */}
				{isEmpty ? (
					<p className="text-sm text-muted-foreground italic">Fill in the form to preview…</p>
				) : (
					<>
						<p className="line-clamp-2 text-sm font-semibold leading-snug">
							{title || "Your listing title"}
						</p>
						<p className="text-xl font-bold tabular-nums text-primary">
							{price ? `Rs ${Number(price).toLocaleString()}` : "Rs —"}
						</p>
						{city && (
							<p className="text-xs text-muted-foreground">{city}</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

// ----------------------------------------------------------------------------
// Wizard
// ----------------------------------------------------------------------------

/** Multi-step part listing creation form with live preview. */
export function CreateListingWizard({ categories }: CreateListingWizardProps) {
	const router = useRouter();
	const createListing = useCreateListing();
	const uploadImage = useUploadImages();
	const publishListing = usePublishListing();

	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [listingId, setListingId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [city, setCity] = useState("");
	const [condition, setCondition] = useState<ConditionValue>("good");
	const [saleType, setSaleType] = useState<SaleTypeValue>("fixed");
	const [isNegotiable, setIsNegotiable] = useState(false);

	async function submitDetails() {
		setError(null);
		setBusy(true);
		try {
			const body: CreateListingWizardInput = {
				platform: "automotive",
				category_id: categoryId,
				model_id: null,
				title: title.trim(),
				description: description.trim() || null,
				sale_type: saleType,
				price: Number(price),
				is_negotiable: isNegotiable,
				condition,
				details: {},
				city: city.trim(),
				area: null,
			};
			const row = await createListing(body);
			setListingId(row.id);
			setStep(2);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Could not create draft");
		} finally {
			setBusy(false);
		}
	}

	async function onUpload(file: File) {
		if (!listingId) return;
		setError(null);
		setBusy(true);
		try {
			await uploadImage(listingId, file);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setBusy(false);
		}
	}

	async function onPublish() {
		if (!listingId) return;
		setError(null);
		setBusy(true);
		try {
			await publishListing(listingId);
			router.push(`/listings/${listingId}`);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Publish failed");
		} finally {
			setBusy(false);
		}
	}

	if (!categories.length) {
		return (
			<p className="text-sm text-muted-foreground">
				No categories available. Seed the catalog first.
			</p>
		);
	}

	return (
		<div container-id="create-listing-wizard" className="flex flex-col gap-6">

			<StepIndicator current={step} />

			{error ? (
				<p
					role="alert"
					className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
				>
					{error}
				</p>
			) : null}

			{/* Two-column on desktop: form left, preview right */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">

				{/* ---- STEP 1: Details ---- */}
				{step === 1 ? (
					<div container-id="wizard-step-details" className="flex flex-col gap-5">

						{/* Category */}
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Category</CardTitle>
							</CardHeader>
							<CardContent>
								<Select
									value={categoryId}
									onValueChange={(v) => { if (v) setCategoryId(v); }}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((c) => (
											<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</CardContent>
						</Card>

						{/* Title + Description */}
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Description</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-4">
								<Field>
									<FieldLabel htmlFor="lst-title">Title</FieldLabel>
									<Input
										id="lst-title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="e.g. Toyota Corolla Alternator · Genuine OEM · 2018–2022"
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="lst-desc">Description</FieldLabel>
									<Textarea
										id="lst-desc"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="Describe the part's condition, fitment compatibility, any faults…"
										rows={4}
									/>
								</Field>
							</CardContent>
						</Card>

						{/* Condition grade */}
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Condition</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
									{CONDITIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => setCondition(opt.value)}
											className={cn(
												"flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
												condition === opt.value
													? "border-primary bg-primary/5 text-foreground"
													: "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
											)}
										>
											<span
												className={cn(
													"text-lg font-bold tabular-nums",
													condition === opt.value && "text-primary",
												)}
											>
												{opt.grade}
											</span>
											<span className="text-[10px] font-medium leading-tight">{opt.label}</span>
											<span className="text-[9px] leading-tight opacity-70">{opt.sub}</span>
										</button>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Sale type */}
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Listing type</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-3">
								<div className="grid grid-cols-3 gap-2">
									{SALE_TYPES.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => setSaleType(opt.value)}
											className={cn(
												"flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
												saleType === opt.value
													? "border-primary bg-primary/5"
													: "border-border bg-background hover:border-foreground/30",
											)}
										>
											<span
												className={cn(
													"text-sm font-semibold",
													saleType === opt.value ? "text-primary" : "text-foreground",
												)}
											>
												{opt.label}
											</span>
											<span className="text-[10px] text-muted-foreground">{opt.sub}</span>
										</button>
									))}
								</div>

								<Separator />

								{/* Price */}
								<div className="grid grid-cols-2 gap-3">
									<Field>
										<FieldLabel htmlFor="lst-price">
											{saleType === "auction" ? "Starting bid (Rs)" : "Price (Rs)"}
										</FieldLabel>
										<Input
											id="lst-price"
											inputMode="decimal"
											value={price}
											onChange={(e) => setPrice(e.target.value)}
											placeholder="0"
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="lst-city">City</FieldLabel>
										<Input
											id="lst-city"
											value={city}
											onChange={(e) => setCity(e.target.value)}
											placeholder="e.g. Karachi"
										/>
									</Field>
								</div>

								{/* Negotiable toggle */}
								{saleType !== "auction" && (
									<label className="flex cursor-pointer items-center gap-2.5 text-sm">
										<input
											type="checkbox"
											checked={isNegotiable}
											onChange={(e) => setIsNegotiable(e.target.checked)}
											className="accent-primary"
										/>
										Price is negotiable
									</label>
								)}
							</CardContent>
						</Card>

						{/* Actions */}
						<div className="flex items-center justify-end gap-2">
							<Button
								type="button"
								disabled={busy || !title.trim() || !price || !city.trim()}
								onClick={() => void submitDetails()}
							>
								{busy ? "Saving…" : "Continue: Photos →"}
							</Button>
						</div>
					</div>
				) : null}

				{/* ---- STEP 2: Photos ---- */}
				{step === 2 && listingId ? (
					<div container-id="wizard-step-photos" className="flex flex-col gap-5">
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Photos</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-5">
								<p className="text-sm text-muted-foreground">
									Upload 4–8 photos. Clear shots from all angles improve trust and sell faster.
								</p>
								<ImageDropzone onFile={onUpload} disabled={busy} />
							</CardContent>
						</Card>
						<div className="flex items-center justify-between gap-2">
							<Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>
								← Back
							</Button>
							<div className="flex gap-2">
								<Button type="button" variant="outline" onClick={() => setStep(3)} disabled={busy}>
									Skip for now
								</Button>
								<Button type="button" onClick={() => setStep(3)} disabled={busy}>
									Continue →
								</Button>
							</div>
						</div>
					</div>
				) : null}

				{/* ---- STEP 3: Publish ---- */}
				{step === 3 && listingId ? (
					<div container-id="wizard-step-publish" className="flex flex-col gap-5">
						<Card size="sm">
							<CardHeader>
								<CardTitle className="text-base">Publish your listing</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-4">
								<p className="text-sm text-muted-foreground">
									Your listing will go live immediately and be visible to all buyers on automart.
									You can edit or delist it any time from My Listings.
								</p>
								<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Title</span>
										<span className="font-medium">{title}</span>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Price</span>
										<span className="font-bold tabular-nums text-primary">
											Rs {Number(price).toLocaleString()}
										</span>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Condition</span>
										<span className="font-medium">
											{CONDITIONS.find((c) => c.value === condition)?.label}
										</span>
									</div>
									<Separator />
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">Type</span>
										<span className="font-medium">
											{SALE_TYPES.find((s) => s.value === saleType)?.label}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
						<div className="flex items-center justify-between gap-2">
							<Button type="button" variant="outline" onClick={() => setStep(2)} disabled={busy}>
								← Back
							</Button>
							<Button
								type="button"
								disabled={busy}
								onClick={() => void onPublish()}
							>
								{busy ? "Publishing…" : "Publish listing →"}
							</Button>
						</div>
					</div>
				) : null}

				{/* Sticky preview — only visible on step 1 */}
				<div className="hidden lg:block">
					<div className="sticky top-20">
						<ListingPreview
							title={title}
							price={price}
							city={city}
							condition={condition}
							saleType={saleType}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
