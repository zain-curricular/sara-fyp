// ============================================================================
// Open Dispute Shell — Client Component
// ============================================================================
//
// Form for opening a dispute against an order. Handles image evidence upload
// (stored as object URLs for preview; URLs POSTed to /api/disputes).
// On success redirects to /buyer/disputes/[id].

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { z } from "zod";

import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { formatPKR } from "@/lib/utils/currency";

import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldLabel,
	FieldError,
	FieldDescription,
} from "@/components/primitives/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";

// ----------------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------------

const REASONS = [
	{ value: "item_not_received", label: "Item not received" },
	{ value: "item_not_as_described", label: "Item not as described" },
	{ value: "damaged_item", label: "Damaged item" },
	{ value: "wrong_item", label: "Wrong item sent" },
	{ value: "seller_unresponsive", label: "Seller unresponsive" },
	{ value: "other", label: "Other" },
] as const;

const disputeFormSchema = z.object({
	reason: z.enum(
		REASONS.map((r) => r.value) as [string, ...string[]],
	),
	description: z
		.string()
		.min(20, "Describe the issue in at least 20 characters")
		.max(2000),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type Props = {
	orderId: string;
	orderNumber: string;
	total: number;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function DisputeOpenShell({ orderId, orderNumber, total }: Props) {
	const router = useRouter();
	const authFetch = useAuthenticatedFetch();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
	const [evidencePreviews, setEvidencePreviews] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<DisputeFormValues>({
		resolver: zodResolver(disputeFormSchema),
	});

	// Handle file picks
	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? []);
		const combined = [...evidenceFiles, ...files].slice(0, 10);
		setEvidenceFiles(combined);
		setEvidencePreviews(combined.map((f) => URL.createObjectURL(f)));
	}

	function removeFile(index: number) {
		const next = evidenceFiles.filter((_, i) => i !== index);
		setEvidenceFiles(next);
		setEvidencePreviews(next.map((f) => URL.createObjectURL(f)));
	}

	async function onSubmit(values: DisputeFormValues) {
		setIsSubmitting(true);
		try {
			// For now, pass evidence as empty array (real implementation would
			// upload to Supabase Storage first and collect URLs)
			const res = await authFetch<
				| { ok: true; data: { disputeId: string } }
				| { ok: false; error: string }
			>("/api/disputes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderId,
					reason: values.reason,
					description: values.description,
					evidenceUrls: [],
				}),
			});

			if (!res.ok) {
				throw new Error("error" in res ? res.error : "Failed to open dispute");
			}

			toast.success("Dispute opened");
			router.push(`/buyer/disputes/${res.data.disputeId}`);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to open dispute");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div
			container-id="dispute-open-shell"
			className="mx-auto flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Open a dispute</h1>
				<p className="text-sm text-muted-foreground">
					Describe the issue with your order and we'll review it.
				</p>
			</header>

			{/* Order summary */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Order {orderNumber}</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Total: <span className="font-medium text-foreground">{formatPKR(total)}</span>
				</CardContent>
			</Card>

			{/* Form */}
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
				container-id="dispute-form"
			>
				{/* Reason */}
				<Controller
					control={control}
					name="reason"
					render={({ field }) => (
						<Field data-invalid={!!errors.reason || undefined}>
							<FieldLabel htmlFor="reason">Reason</FieldLabel>
							<Select onValueChange={field.onChange} value={field.value ?? ""}>
								<SelectTrigger id="reason" className="w-full">
									<SelectValue placeholder="Select a reason…" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{REASONS.map((r) => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{errors.reason && (
								<FieldError>{errors.reason.message}</FieldError>
							)}
						</Field>
					)}
				/>

				{/* Description */}
				<Field data-invalid={!!errors.description || undefined}>
					<FieldLabel htmlFor="description">Description</FieldLabel>
					<textarea
						id="description"
						rows={5}
						placeholder="Describe the issue in detail…"
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						{...register("description")}
					/>
					<FieldDescription>Minimum 20 characters</FieldDescription>
					{errors.description && (
						<FieldError>{errors.description.message}</FieldError>
					)}
				</Field>

				{/* Evidence upload */}
				<Field>
					<FieldLabel>Evidence (optional)</FieldLabel>
					<FieldDescription>Upload up to 10 images</FieldDescription>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						multiple
						className="sr-only"
						onChange={handleFileChange}
					/>

					{evidencePreviews.length > 0 && (
						<div
							container-id="evidence-previews"
							className="grid grid-cols-4 gap-2 sm:grid-cols-5"
						>
							{evidencePreviews.map((src, i) => (
								<div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={src}
										alt={`Evidence ${i + 1}`}
										className="h-full w-full object-cover"
									/>
									<button
										type="button"
										onClick={() => removeFile(i)}
										className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
									>
										<X className="size-3" />
									</button>
								</div>
							))}
						</div>
					)}

					{evidenceFiles.length < 10 && (
						<Button
							type="button"
							variant="outline"
							onClick={() => fileInputRef.current?.click()}
							className="w-fit"
						>
							<ImagePlus className="size-4" />
							Add images
						</Button>
					)}
				</Field>

				{/* Submit */}
				<div className="flex gap-2">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Submitting…" : "Submit dispute"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push(`/buyer/orders/${orderId}`)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}
