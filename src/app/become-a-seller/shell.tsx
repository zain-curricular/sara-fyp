// ============================================================================
// Become a Seller Shell
// ============================================================================
//
// Three-step seller onboarding wizard:
//   Step 1 — Store details: name, URL slug (auto-generated, editable), city,
//             description
//   Step 2 — Branding: optional logo + banner uploads (Supabase Storage)
//   Step 3 — Terms agreement and submit
//
// On submit: POST /api/seller/onboard → on success redirect to /seller.
// Each step is validated independently before allowing progression.

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/primitives/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import { Textarea } from "@/components/primitives/textarea";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Convert a store name to a URL-safe slug. */
function toSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 60);
}

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const storeDetailsSchema = z.object({
	storeName: z.string().min(3, "Store name must be at least 3 characters"),
	slug: z
		.string()
		.min(3, "Slug must be at least 3 characters")
		.max(60, "Slug must be under 60 characters")
		.regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
	city: z.string().min(2, "Enter a city"),
	description: z.string().max(500, "Keep it under 500 characters").optional(),
});

const termsSchema = z.object({
	agreedToTerms: z.literal(true),
});

type StoreDetailsForm = z.infer<typeof storeDetailsSchema>;

// ----------------------------------------------------------------------------
// Step progress indicator
// ----------------------------------------------------------------------------

function StepProgress({ step, total }: { step: number; total: number }) {
	return (
		<div container-id="step-progress" className="flex items-center gap-2">
			{Array.from({ length: total }, (_, i) => (
				<div
					key={i}
					className={cn(
						"h-1.5 flex-1 rounded-full transition-colors",
						i < step ? "bg-primary" : "bg-muted",
					)}
				/>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

/** Multi-step seller onboarding wizard. */
export default function BecomeASellerShell() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [bannerUrl, setBannerUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const logoRef = useRef<HTMLInputElement>(null);
	const bannerRef = useRef<HTMLInputElement>(null);

	const detailsForm = useForm<StoreDetailsForm>({
		resolver: zodResolver(storeDetailsSchema),
		defaultValues: { storeName: "", slug: "", city: "", description: "" },
	});

	// Auto-generate slug from store name
	function handleStoreNameChange(e: React.ChangeEvent<HTMLInputElement>) {
		const name = e.target.value;
		detailsForm.setValue("storeName", name);
		// Only auto-set slug if user hasn't manually edited it
		const currentSlug = detailsForm.getValues("slug");
		const autoSlug = toSlug(detailsForm.getValues("storeName") || "");
		if (currentSlug === autoSlug || currentSlug === "") {
			detailsForm.setValue("slug", toSlug(name), { shouldValidate: false });
		}
	}

	// Upload image to Supabase Storage
	async function uploadImage(
		file: File,
		bucket: string,
		path: string,
	): Promise<string | null> {
		const supabase = createBrowserSupabaseClient();
		const { data, error } = await supabase.storage
			.from(bucket)
			.upload(path, file, { upsert: true });

		if (error) {
			toast.error(`Upload failed: ${error.message}`);
			return null;
		}

		const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
		return urlData.publicUrl;
	}

	async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		const url = await uploadImage(file, "store-assets", `logos/${Date.now()}-${file.name}`);
		if (url) setLogoUrl(url);
		setUploading(false);
	}

	async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		const url = await uploadImage(file, "store-assets", `banners/${Date.now()}-${file.name}`);
		if (url) setBannerUrl(url);
		setUploading(false);
	}

	async function handleStep1Next() {
		const valid = await detailsForm.trigger();
		if (!valid) return;
		setStep(2);
	}

	async function handleSubmit() {
		if (!agreedToTerms) {
			toast.error("You must agree to the seller terms.");
			return;
		}

		setSubmitting(true);
		const values = detailsForm.getValues();

		const res = await fetch("/api/seller/onboard", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				storeName: values.storeName,
				slug: values.slug,
				city: values.city,
				description: values.description ?? "",
				logoUrl,
				bannerUrl,
			}),
		});

		const json = await res.json();
		setSubmitting(false);

		if (!json.ok) {
			toast.error(json.error ?? "Something went wrong. Try again.");
			return;
		}

		toast.success("Your store is live! Welcome to ShopSmart.");
		router.push("/seller");
		router.refresh();
	}

	return (
		<div container-id="become-seller-shell" className="w-full max-w-lg">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-1.5 mb-1">
						<span className="size-2 rounded-full bg-brand" />
						<span className="text-xs font-bold tracking-tight">
							Shop<span className="text-primary">Smart</span>
						</span>
					</div>
					<CardTitle className="text-xl font-bold tracking-tight">Become a seller</CardTitle>
					<CardDescription>
						{step === 1 && "Tell us about your store"}
						{step === 2 && "Add your store's branding (optional)"}
						{step === 3 && "Almost there — review and submit"}
					</CardDescription>
					<StepProgress step={step} total={3} />
				</CardHeader>

				<CardContent className="flex flex-col gap-5">

					{/* ── Step 1: Store details ── */}
					{step === 1 && (
						<div container-id="become-seller-step1" className="flex flex-col gap-4">
							<FieldSet>
								<FieldGroup>

									<Field data-invalid={!!detailsForm.formState.errors.storeName}>
										<FieldLabel htmlFor="bs_name">Store name</FieldLabel>
										<Input
											id="bs_name"
											type="text"
											placeholder="e.g. Lahore Auto Parts"
											{...detailsForm.register("storeName")}
											onChange={handleStoreNameChange}
										/>
										<FieldError errors={[detailsForm.formState.errors.storeName]} />
									</Field>

									<Field data-invalid={!!detailsForm.formState.errors.slug}>
										<FieldLabel htmlFor="bs_slug">Store URL slug</FieldLabel>
										<div className="flex items-center gap-1.5">
											<span className="text-xs text-muted-foreground whitespace-nowrap">
												shopsmart.pk/s/
											</span>
											<Input
												id="bs_slug"
												type="text"
												placeholder="lahore-auto-parts"
												className="flex-1"
												{...detailsForm.register("slug")}
											/>
										</div>
										<FieldError errors={[detailsForm.formState.errors.slug]} />
									</Field>

									<Field data-invalid={!!detailsForm.formState.errors.city}>
										<FieldLabel htmlFor="bs_city">City</FieldLabel>
										<Input
											id="bs_city"
											type="text"
											placeholder="e.g. Karachi"
											{...detailsForm.register("city")}
										/>
										<FieldError errors={[detailsForm.formState.errors.city]} />
									</Field>

									<Field data-invalid={!!detailsForm.formState.errors.description}>
										<FieldLabel htmlFor="bs_desc">Description (optional)</FieldLabel>
										<Textarea
											id="bs_desc"
											placeholder="Tell buyers what you sell and why they should choose you…"
											rows={3}
											{...detailsForm.register("description")}
										/>
										<FieldError errors={[detailsForm.formState.errors.description]} />
									</Field>

								</FieldGroup>
							</FieldSet>

							<Button className="w-full" onClick={handleStep1Next} type="button">
								Next →
							</Button>
						</div>
					)}

					{/* ── Step 2: Branding ── */}
					{step === 2 && (
						<div container-id="become-seller-step2" className="flex flex-col gap-5">
							<p className="text-sm text-muted-foreground">
								Upload a logo and banner for your store. Both are optional — you can add
								them later from your seller settings.
							</p>

							{/* Logo */}
							<div container-id="logo-upload" className="flex flex-col gap-2">
								<p className="text-sm font-medium">Store logo</p>
								{logoUrl ? (
									<div className="flex items-center gap-3">
										<img
											src={logoUrl}
											alt="Logo preview"
											className="size-16 rounded-lg object-cover border border-border"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setLogoUrl(null)}
										>
											Remove
										</Button>
									</div>
								) : (
									<>
										<input
											ref={logoRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleLogoUpload}
										/>
										<Button
											type="button"
											variant="outline"
											disabled={uploading}
											onClick={() => logoRef.current?.click()}
										>
											{uploading ? "Uploading…" : "Upload logo"}
										</Button>
									</>
								)}
							</div>

							{/* Banner */}
							<div container-id="banner-upload" className="flex flex-col gap-2">
								<p className="text-sm font-medium">Store banner</p>
								{bannerUrl ? (
									<div className="flex flex-col gap-2">
										<img
											src={bannerUrl}
											alt="Banner preview"
											className="h-24 w-full rounded-lg object-cover border border-border"
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setBannerUrl(null)}
										>
											Remove
										</Button>
									</div>
								) : (
									<>
										<input
											ref={bannerRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleBannerUpload}
										/>
										<Button
											type="button"
											variant="outline"
											disabled={uploading}
											onClick={() => bannerRef.current?.click()}
										>
											{uploading ? "Uploading…" : "Upload banner"}
										</Button>
									</>
								)}
							</div>

							<div container-id="step2-actions" className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => setStep(1)}
								>
									Back
								</Button>
								<Button
									type="button"
									className="flex-1"
									disabled={uploading}
									onClick={() => setStep(3)}
								>
									Next →
								</Button>
							</div>
						</div>
					)}

					{/* ── Step 3: Terms + submit ── */}
					{step === 3 && (
						<div container-id="become-seller-step3" className="flex flex-col gap-5">

							{/* Review summary */}
							<div
								container-id="review-summary"
								className="rounded-lg border border-border bg-muted/40 p-4 flex flex-col gap-2 text-sm"
							>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Store name</span>
									<span className="font-medium">{detailsForm.getValues("storeName")}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Slug</span>
									<span className="font-medium">/{detailsForm.getValues("slug")}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">City</span>
									<span className="font-medium">{detailsForm.getValues("city")}</span>
								</div>
								{logoUrl && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">Logo</span>
										<span className="font-medium text-primary">Uploaded</span>
									</div>
								)}
								{bannerUrl && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">Banner</span>
										<span className="font-medium text-primary">Uploaded</span>
									</div>
								)}
							</div>

							{/* Terms checkbox */}
							<label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
								<input
									type="checkbox"
									checked={agreedToTerms}
									onChange={(e) => setAgreedToTerms(e.target.checked)}
									className="mt-0.5 rounded border-border accent-primary"
								/>
								<span>
									I agree to the{" "}
									<a
										href="/seller-terms"
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
									>
										Seller Terms of Service
									</a>{" "}
									and understand that ShopSmart may review my listings before publishing.
								</span>
							</label>

							<div container-id="step3-actions" className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => setStep(2)}
									disabled={submitting}
								>
									Back
								</Button>
								<Button
									type="button"
									className="flex-1"
									disabled={submitting || !agreedToTerms}
									onClick={handleSubmit}
								>
									{submitting ? "Creating store…" : "Launch my store →"}
								</Button>
							</div>
						</div>
					)}

				</CardContent>
			</Card>
		</div>
	);
}
